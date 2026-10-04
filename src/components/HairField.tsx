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
  uC1: { value: ThreeNS.Color };
  uC2: { value: ThreeNS.Color };
  uC3: { value: ThreeNS.Color };
};

/* Each strand is a helix wrapped around a flowing centre line, so locks of hair read as
   springy ringlets. Strands in a lock share phase, so they twist together and clump like
   real hair. Everything is animated on the GPU; the cursor parts the hair. */
const VERT = /* glsl */ `
uniform float uTime;
uniform vec2 uRes;
uniform vec2 uMouse;
attribute float aT;
attribute vec4 aA; // rootY, lockPhase, lockAmp, lockFreq
attribute vec4 aB; // speed, pitch, curlRadius, jitterY
attribute vec4 aC; // jitterPhase, curlPhase, alpha, colorMix
varying float vAlpha;
varying float vMix;
varying float vLit;
void main() {
  float t = aT;
  float W = uRes.x;
  float H = uRes.y;
  float x = mix(-0.04 * W, 1.06 * W, t);
  float fan = 0.12 + 0.88 * pow(t, 0.8);
  float y = H * 0.5 + aA.x * H * 0.36 * fan + aB.w * t;
  // body: big slow waves so the mass of hair breathes
  y += sin(x * aA.w + uTime * aB.x + aA.y + aC.x) * aA.z * t;
  y += sin(x * 0.0006 - uTime * 0.2 + aA.y * 2.0) * 60.0 * t;
  // curl: helix around the flow line; radius grows toward the ends like a real ringlet
  float th = x / aB.y * 6.2831853 + aC.y + uTime * 0.4;
  float R = aB.z * (0.2 + 1.05 * smoothstep(0.0, 0.75, t));
  float depth = sin(th);
  y += cos(th) * R + depth * R * 0.18;
  float xx = x + depth * R * 0.35;
  // the cursor combs the hair apart
  vec2 d = vec2(xx, y) - uMouse;
  float f = exp(-dot(d, d) / (210.0 * 210.0));
  y += (d.y >= 0.0 ? 1.0 : -1.0) * f * 85.0;
  xx += d.x * f * 0.12;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(xx, y, 0.0, 1.0);
  vLit = depth * 0.5 + 0.5;
  vAlpha = aC.z * smoothstep(0.0, 0.12, t) * (1.0 - smoothstep(0.86, 1.0, t)) * (0.5 + 0.7 * vLit);
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
void main() {
  vec3 col = vMix < 0.7 ? mix(uC1, uC2, vMix / 0.7) : mix(uC2, uC3, (vMix - 0.7) / 0.3);
  col *= 0.6 + 0.55 * vLit;
  col += vec3(1.0, 0.95, 0.85) * smoothstep(0.86, 1.0, vLit) * 0.35; // specular sheen on the curl crest
  float a = vAlpha;
  if (uLight > 0.5) { col *= 0.72; a *= 1.2; }
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
    const lockPhase = r() * 6.2832;
    const lockAmp = 30 + r() * 95;
    const lockFreq = 0.0011 + r() * 0.0016;
    const speed = 0.14 + r() * 0.32;
    const pitch = 78 + r() * 90;
    const radius = 10 + r() * 26;
    const colorBase = r();
    for (let k = 0; k < PER; k++) {
      const jitterY = (r() - 0.5) * 14;
      const jitterPhase = (r() - 0.5) * 0.7;
      const curlPhase = lockPhase + (r() - 0.5) * 0.9;
      const rj = radius * (0.75 + r() * 0.5);
      const alpha = 0.08 + r() * 0.22;
      const mix = Math.min(1, Math.max(0, colorBase + (r() - 0.5) * 0.25));
      for (let p = 0; p < P; p++, v++) {
        aT[v] = p / (P - 1);
        aA.set([rootY, lockPhase, lockAmp, lockFreq], v * 4);
        aB.set([speed, pitch, rj, jitterY], v * 4);
        aC.set([jitterPhase, curlPhase, alpha, mix], v * 4);
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
    l.mat.blending = theme === "light" ? l.THREE.NormalBlending : l.THREE.AdditiveBlending;
    l.mat.needsUpdate = true;
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
          uC1: { value: new THREE.Color() },
          uC2: { value: new THREE.Color() },
          uC3: { value: new THREE.Color() },
        };
        const mat = new THREE.ShaderMaterial({ vertexShader: VERT, fragmentShader: FRAG, uniforms: u, transparent: true, depthTest: false, depthWrite: false, blending: THREE.AdditiveBlending });
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
        mat.blending = light ? THREE.NormalBlending : THREE.AdditiveBlending;

        const resize = () => {
          const w = el.clientWidth, h = el.clientHeight;
          renderer.setSize(w, h, false);
          camera.right = w; camera.top = h; camera.updateProjectionMatrix();
          u.uRes.value.set(w, h);
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
