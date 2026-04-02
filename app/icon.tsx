import { ImageResponse } from "next/og";

export const runtime = "edge";

export const size = {
  width: 512,
  height: 512,
};

export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background:
            "linear-gradient(145deg, rgb(19,34,31) 0%, rgb(31,106,84) 52%, rgb(228,121,76) 100%)",
          color: "white",
          fontSize: 190,
          fontWeight: 700,
          letterSpacing: -18,
        }}
      >
        SO
      </div>
    ),
    size,
  );
}
