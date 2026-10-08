import { ThreeCanvas } from "@remotion/three";
import { AbsoluteFill } from "remotion";
import { Pickleball } from "./court-film";

export function HeroBall() {
  return (
    <AbsoluteFill>
      <ThreeCanvas
        width={1024}
        height={1024}
        camera={{ position: [0, 0, 2.5], fov: 42 }}
        gl={{ alpha: true, antialias: true }}
      >
        <ambientLight intensity={0.35} />
        <directionalLight
          position={[-3, 4, 5]}
          intensity={2.7}
          color="#fffce4"
        />
        <directionalLight
          position={[3, -1, 2]}
          intensity={0.75}
          color="#d6e8ff"
        />
        <group position={[-0.55, -1.2, 0]}>
          <Pickleball close />
        </group>
      </ThreeCanvas>
    </AbsoluteFill>
  );
}
