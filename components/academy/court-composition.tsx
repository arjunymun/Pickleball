import { interpolate, useCurrentFrame } from "remotion";
import { CourtArtwork } from "./court-artwork";

export function CourtComposition() {
  const frame = useCurrentFrame();
  const phase = (frame / 240) * Math.PI * 2;
  return (
    <CourtArtwork
      lift={Math.sin(phase) * 14}
      angle={interpolate(Math.cos(phase), [-1, 1], [-3, 3])}
    />
  );
}
