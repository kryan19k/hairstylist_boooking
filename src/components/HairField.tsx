"use client";
import { useEffect, useRef, useState } from "react";
import type * as ThreeNS from "three";
import { useShade, useTheme } from "@/lib/shade";
import StrandField from "./StrandField";

type Three = typeof ThreeNS;
type Uniforms = {
  uTime: { value: number };
  uRes: { value: ThreeNS.Vector2 };
  uMouse: { value: ThreeNS.Vector2 };
  uLight: { value: number };
  uScale: { value: number };
  uBoost: { value: number };
  uC1: { value: ThreeNS.Color };
  uC2: { value: ThreeNS.Color };
  uC3: { value: ThreeNS.Color };
};

/* Locks of fine strands flow in gentle shared waves with a light ripple, lit by bands that
   travel along the wave, so it reads as soft wavy hair. Animated on the GPU; the cursor parts it. */
const VERT = /* glsl */ `
uniform float uTime;
uniform vec2 uRes;
uniform vec2 uMouse;
uniform float uScale; // >1 on phones: more waves per screen width
uniform float uBoost; // thicker/brighter lines on phones
attribute float aT;
attribute vec4 aA; // rootY, wavePhase, waveAmp, waveFreq
attribute vec4 aB; // speed, ripplePitch, rippleRadius, jitterY
attribute vec4 aC; // jitterPhase, ripplePhase, alpha, colorMix
varying float vAlpha;
varying float vMix;
varying float vLit;
varying float vT;
void main() {
  float t = aT;
  float W = uRes.x;
  float H = uRes.y;
  float x = mix(-0.04 * W, 1.06 * W, t);
  float fan = 0.12 + 0.88 * pow(t, 0.8);
  float y = H * 0.5 + aA.x * H * 0.34 * fan + aB.w * t;
  // body: neighbouring locks share phase, so the hair moves as one flowing sheet of waves
  float ph = x * aA.w * uScale - uTime * aB.x + aA.y;
  y += sin(ph) * aA.z * t;
  y += sin(ph * 0.5 + 1.3 + aC.x) * aA.z * 0.45 * t;
  y += sin(x * 0.0006 - uTime * 0.18 + aA.x * 1.5) * 50.0 * t;
  // fine ripple only: just enough irregularity to feel like hair, not curls
  float th = x * uScale / aB.y * 6.2831853 + aC.y + uTime * 0.25;
  y += cos(th) * aB.z * (0.3 + 0.9 * smoothstep(0.1, 0.9, t));
  float xx = x;
  // the cursor combs the hair apart
  // the scissors open a soft channel ALONG the hair (wide in x, narrow in y). The push is a smooth
  // function of the distance from the cursor line, so there is no hard seam or vertical streaks.
  vec2 d = vec2(xx, y) - uMouse;
  vec2 q = vec2(d.x / 360.0, d.y / 120.0);
  float f = exp(-dot(q, q));
  y += (d.y / (abs(d.y) + 38.0)) * f * 78.0;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(xx, y, 0.0, 1.0);
  // soft light bands that travel along the waves, like light rolling over real hair
  vLit = 0.5 + 0.5 * sin(ph + 0.9);
  vT = t;
  vAlpha = aC.z * uBoost * smoothstep(0.0, 0.1, t) * (1.0 - smoothstep(0.88, 1.0, t));
  vMix = aC.w;
}`;

const FRAG = /* glsl */ `
uniform vec3 uC1;
uniform vec3 uC2;
uniform vec3 uC3;
uniform float uLight;
varying float vAlpha;
varying float vMix;
varying float vLit;
varying float vT;
void main() {
  vec3 col = vMix < 0.7 ? mix(uC1, uC2, vMix / 0.7) : mix(uC2, uC3, (vMix - 0.7) / 0.3);
  float roots = mix(0.5, 1.0, smoothstep(0.0, 0.45, vT)); // darker toward the roots
  col *= (0.5 + 0.55 * vLit) * roots;
  col += vec3(1.0, 0.94, 0.84) * smoothstep(0.82, 1.0, vLit) * 0.16; // restrained sheen, not glare
  float a = vAlpha * (0.6 + 0.6 * vLit);
  if (uLight > 0.5) { col *= 0.8; a *= 1.25; }
  gl_FragColor = vec4(col, a);
}`;

function build(THREE: Three, mobile: boolean) {
  const LOCKS = mobile ? 55 : 105;
  const PER = mobile ? 9 : 14;
  const P = mobile ? 170 : 270; // fine sampling keeps curls smooth, not zigzag
  const strands = LOCKS * PER;
  const verts = strands * P;
  const aT = new Float32Array(verts);
  const aA = new Float32Array(verts * 4);
  const aB = new Float32Array(verts * 4);
  const aC = new Float32Array(verts * 4);
  const r = Math.random;
  let v = 0;
  for (let l = 0; l < LOCKS; l++) {
    const rootY = (r() + r() - 1) * 1.05; // bell-curved so the hair is fullest in the middle
    const wavePhase = rootY * 1.6 + (r() - 0.5) * 0.35; // neighbours wave together
    const waveAmp = 34 + r() * 40;
    const waveFreq = 0.0092 + r() * 0.0012; // ~600px wavelength: soft S-waves
    const speed = 0.35 + r() * 0.06;
    const pitch = 200 + r() * 200;
    const radius = 2.5 + r() * 6;
    const colorBase = Math.min(1, (rootY * 0.5 + 0.5) * 0.8 + r() * 0.2);
    for (let k = 0; k < PER; k++) {
      const jitterY = (r() - 0.5) * 12;
      const jitterPhase = (r() - 0.5) * 0.3;
      const ripplePhase = r() * 6.2832;
      const rj = radius * (0.7 + r() * 0.6);
      const alpha = 0.07 + r() * 0.17;
      const mix = Math.min(1, Math.max(0, colorBase + (r() - 0.5) * 0.2));
      for (let p = 0; p < P; p++, v++) {
        aT[v] = p / (P - 1);
        aA.set([rootY, wavePhase, waveAmp, waveFreq], v * 4);
        aB.set([speed, pitch, rj, jitterY], v * 4);
        aC.set([jitterPhase, ripplePhase, alpha, mix], v * 4);
      }
    }
  }
  const index = new Uint32Array(strands * (P - 1) * 2);
  let i = 0;
  for (let s = 0; s < strands; s++) {
    const base = s * P;
    for (let p = 0; p < P - 1; p++) {
      index[i++] = base + p;
      index[i++] = base + p + 1;
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(verts * 3), 3)); // unused, shader computes positions
  geo.setAttribute("aT", new THREE.BufferAttribute(aT, 1));
  geo.setAttribute("aA", new THREE.BufferAttribute(aA, 4));
  geo.setAttribute("aB", new THREE.BufferAttribute(aB, 4));
  geo.setAttribute("aC", new THREE.BufferAttribute(aC, 4));
  geo.setIndex(new THREE.BufferAttribute(index, 1));
  return geo;
}

export default function HairField() {
  const host = useRef<HTMLDivElement>(null);
  const live = useRef<{ THREE: Three; u: Uniforms; mat: ThreeNS.ShaderMaterial } | null>(null);
  const [failed, setFailed] = useState(false);
  const shade = useShade();
  const theme = useTheme();

  // push shade/theme into the GPU uniforms without rebuilding the hair
  useEffect(() => {
    const l = live.current;
    if (!l) return;
    const css = getComputedStyle(document.documentElement);
    const get = (n: string) => css.getPropertyValue(n).trim();
    l.u.uC1.value.set(get("--accent2"));
    l.u.uC2.value.set(get("--accent"));
    l.u.uC3.value.set(get("--counter"));
    l.u.uLight.value = theme === "light" ? 1 : 0;
  }, [shade, theme]);

  useEffect(() => {
    const el = host.current;
    if (!el) return;
    let cancelled = false;
    let raf = 0;
    let cleanup = () => {};

    import("three")
      .then((THREE) => {
        if (cancelled) return;
        const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        let renderer: ThreeNS.WebGLRenderer;
        try {
          renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
        } catch {
          setFailed(true);
          return;
        }
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
        renderer.setClearColor(0x000000, 0);
        el.appendChild(renderer.domElement);
        Object.assign(renderer.domElement.style, { position: "absolute", inset: "0", width: "100%", height: "100%" });

        const scene = new THREE.Scene();
        const camera = new THREE.OrthographicCamera(0, 1, 1, 0, -10, 10);
        const geo = build(THREE, window.innerWidth < 760);
        const u: Uniforms = {
          uTime: { value: 0 },
          uRes: { value: new THREE.Vector2(1, 1) },
          uMouse: { value: new THREE.Vector2(-9999, -9999) },
          uLight: { value: 0 },
          uScale: { value: 1 },
          uBoost: { value: 1 },
          uC1: { value: new THREE.Color() },
          uC2: { value: new THREE.Color() },
          uC3: { value: new THREE.Color() },
        };
        const mat = new THREE.ShaderMaterial({ vertexShader: VERT, fragmentShader: FRAG, uniforms: u, transparent: true, depthTest: false, depthWrite: false, blending: THREE.NormalBlending });
        const mesh = new THREE.LineSegments(geo, mat);
        mesh.frustumCulled = false;
        scene.add(mesh);
        live.current = { THREE, u, mat };

        const css = getComputedStyle(document.documentElement);
        u.uC1.value.set(css.getPropertyValue("--accent2").trim());
        u.uC2.value.set(css.getPropertyValue("--accent").trim());
        u.uC3.value.set(css.getPropertyValue("--counter").trim());
        const light = document.documentElement.dataset.theme === "light";
        u.uLight.value = light ? 1 : 0;

        const resize = () => {
          const w = el.clientWidth, h = el.clientHeight;
          renderer.setSize(w, h, false);
          camera.right = w; camera.top = h; camera.updateProjectionMatrix();
          u.uRes.value.set(w, h);
          const phone = w < 760;
          u.uScale.value = phone ? 2.1 : 1;
          u.uBoost.value = phone ? 1.7 : 1;
        };
        resize();

        const target = new THREE.Vector2(-9999, -9999);
        const onMove = (e: PointerEvent) => {
          const r = el.getBoundingClientRect();
          target.set(e.clientX - r.left, r.height - (e.clientY - r.top));
          if (u.uMouse.value.x < -9000) u.uMouse.value.copy(target);
        };
        const onLeave = () => target.set(-9999, -9999);
        let visible = true;
        const t0 = performance.now();
        const frame = (now: number) => {
          u.uTime.value = (now - t0) / 1000 + 2;
          if (target.x < -9000) u.uMouse.value.set(-9999, -9999);
          else u.uMouse.value.lerp(target, 0.1);
          renderer.render(scene, camera);
          if (!reduce && visible) raf = requestAnimationFrame(frame);
        };
        raf = requestAnimationFrame(frame);

        const io = new IntersectionObserver(([e]) => {
          visible = e.isIntersecting;
          if (visible && !reduce) { cancelAnimationFrame(raf); raf = requestAnimationFrame(frame); }
        });
        io.observe(el);
        window.addEventListener("resize", resize);
        window.addEventListener("pointermove", onMove, { passive: true });
        document.addEventListener("pointerleave", onLeave);

        cleanup = () => {
          cancelAnimationFrame(raf);
          io.disconnect();
          window.removeEventListener("resize", resize);
          window.removeEventListener("pointermove", onMove);
          document.removeEventListener("pointerleave", onLeave);
          geo.dispose();
          mat.dispose();
          renderer.dispose();
          renderer.domElement.remove();
          live.current = null;
        };
      })
      .catch(() => setFailed(true));

    return () => {
      cancelled = true;
      cleanup();
    };
  }, []);

  if (failed) return <StrandField />;
  return <div ref={host} aria-hidden className="absolute inset-0" />;
}
