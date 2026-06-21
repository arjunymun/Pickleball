import { ImageResponse } from "next/og";

// Next 16 idiomatic OG card: generated in code (no committed binary).
// Renders the Sideout wordmark, tagline, and the warm-sand / terracotta / forest palette.
export const runtime = "edge";
export const alt = "Sideout — Dehradun Pickleball Club OS";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Brand palette (mirrors the light theme tokens in app/globals.css).
const SAND = "#f5ecde";
const SAND_STRONG = "#eadbc7";
const TERRACOTTA = "#dd6938";
const FOREST = "#145238";
const FOREST_SOFT = "#1f6a54";
const GOLD = "#c49853";
const INK = "#15201b";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px 80px",
          background: `linear-gradient(135deg, ${SAND} 0%, ${SAND_STRONG} 100%)`,
          color: INK,
          fontFamily: "sans-serif",
        }}
      >
        {/* Wordmark row: terracotta dot + Sideout, matching components/ui/wordmark.tsx */}
        <div style={{ display: "flex", alignItems: "center", gap: "22px" }}>
          <div
            style={{
              width: "26px",
              height: "26px",
              borderRadius: "9999px",
              background: TERRACOTTA,
            }}
          />
          <div
            style={{
              fontSize: "34px",
              fontWeight: 600,
              letterSpacing: "16px",
              textTransform: "uppercase",
            }}
          >
            Sideout
          </div>
        </div>

        {/* Headline + tagline */}
        <div style={{ display: "flex", flexDirection: "column", gap: "28px", maxWidth: "900px" }}>
          <div
            style={{
              fontSize: "78px",
              fontWeight: 700,
              lineHeight: 1.04,
              letterSpacing: "-3px",
              color: INK,
            }}
          >
            A real pickleball club, run well.
          </div>
          <div style={{ fontSize: "32px", lineHeight: 1.4, color: FOREST_SOFT }}>
            Booking for players, a console for the front desk. Made in Dehradun.
          </div>
        </div>

        {/* Footer accent bar: forest → terracotta → gold */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", gap: "14px" }}>
            <div style={{ width: "120px", height: "10px", borderRadius: "9999px", background: FOREST }} />
            <div style={{ width: "72px", height: "10px", borderRadius: "9999px", background: TERRACOTTA }} />
            <div style={{ width: "44px", height: "10px", borderRadius: "9999px", background: GOLD }} />
          </div>
          <div style={{ fontSize: "26px", fontWeight: 500, color: FOREST }}>pickleball-xi.vercel.app</div>
        </div>
      </div>
    ),
    { ...size },
  );
}
