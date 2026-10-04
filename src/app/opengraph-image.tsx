import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { getContent } from "@/lib/content";

export const alt = "Salon preview";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const revalidate = 3600;

export default async function Image() {
  const { settings: s } = await getContent();
  let logo = "";
  try {
    logo = `data:image/png;base64,${(await readFile(path.join(process.cwd(), "public", "logo-mark.png"))).toString("base64")}`;
  } catch {}
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", background: "linear-gradient(135deg, #1a0f1a 0%, #2b1a2a 60%, #3a2432 100%)", padding: 80 }}>
        <div style={{ display: "flex", width: 360, height: 360, borderRadius: 999, alignItems: "center", justifyContent: "center", background: "rgba(243,208,138,0.10)", border: "2px solid rgba(243,208,138,0.35)" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {logo ? <img src={logo} width={300} height={300} alt="" /> : null}
        </div>
        <div style={{ display: "flex", flexDirection: "column", marginLeft: 70 }}>
          <div style={{ display: "flex", fontSize: 96, fontWeight: 700, color: "#f6e7c4", lineHeight: 1 }}>{s.name}</div>
          <div style={{ display: "flex", marginTop: 14, fontSize: 34, letterSpacing: 10, color: "#d9a441", textTransform: "uppercase" }}>{s.tagline}</div>
          <div style={{ display: "flex", marginTop: 36, fontSize: 36, color: "#e8dccb" }}>Color · Cuts · Bridal</div>
          <div style={{ display: "flex", marginTop: 10, fontSize: 30, color: "#b9a99a" }}>{s.city} · Book online</div>
        </div>
      </div>
    ),
    size,
  );
}
