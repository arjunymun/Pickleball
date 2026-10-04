import { ImageResponse } from "next/og";
export const runtime = "nodejs";
export const alt = "Doon Pickleball Academy — GMS Road, Dehradun";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export default function OpengraphImage() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: "64px 72px",
        background: "#123a6b",
        color: "#fff",
        fontFamily: "sans-serif",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
        <div
          style={{
            width: 34,
            height: 34,
            borderRadius: "50%",
            background: "#dfff00",
          }}
        />
        <span style={{ fontSize: 28, letterSpacing: 3 }}>
          DOON PICKLEBALL ACADEMY
        </span>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
        <span style={{ fontSize: 88, fontWeight: 800, lineHeight: 1.05 }}>
          YOUR NEXT GAME
          <br />
          STARTS HERE.
        </span>
        <span style={{ fontSize: 30 }}>
          Four outdoor courts. GMS Road, Dehradun.
        </span>
      </div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          fontSize: 24,
          color: "#d9eaff",
        }}
      >
        <span>Every day · 6 AM – midnight</span>
        <span>Court hire from ₹400 for members</span>
      </div>
    </div>,
    size,
  );
}
