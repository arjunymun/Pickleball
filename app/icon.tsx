import { ImageResponse } from "next/og";
export const runtime = "nodejs";
export const size = { width: 512, height: 512 };
export const contentType = "image/png";
export default function Icon() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#123a6b",
      }}
    >
      <div
        style={{
          width: 350,
          height: 350,
          borderRadius: "50%",
          background: "#dfff00",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#123a6b",
          fontSize: 144,
          fontWeight: 800,
        }}
      >
        D
      </div>
    </div>,
    size,
  );
}
