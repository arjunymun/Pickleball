import { useLayoutEffect, useMemo } from "react";
import { useThree } from "@react-three/fiber";
import { ThreeCanvas } from "@remotion/three";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import * as THREE from "three";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const smooth = { ...clamp, easing: Easing.bezier(0.22, 1, 0.36, 1) };
const holeDirections = Array.from({ length: 32 }, (_, i) => {
  const y = 1 - (2 * (i + 0.5)) / 32;
  const r = Math.sqrt(1 - y * y);
  const a = i * Math.PI * (3 - Math.sqrt(5));
  return new THREE.Vector3(r * Math.cos(a), y, r * Math.sin(a));
});

function perforatedSphere(radius: number) {
  const geometry = new THREE.SphereGeometry(radius, 200, 128);
  const positions = geometry.getAttribute("position");
  const indices = geometry.getIndex()!;
  const kept: number[] = [];
  const centre = new THREE.Vector3();
  const point = new THREE.Vector3();
  for (let i = 0; i < indices.count; i += 3) {
    centre.set(0, 0, 0);
    for (let j = 0; j < 3; j++) {
      point.fromBufferAttribute(positions, indices.getX(i + j));
      centre.add(point);
    }
    centre.normalize();
    if (
      !holeDirections.some(
        (direction) => direction.dot(centre) > Math.cos(0.16),
      )
    ) {
      kept.push(indices.getX(i), indices.getX(i + 1), indices.getX(i + 2));
    }
  }
  geometry.setIndex(kept);
  return geometry;
}

function acrylicTexture() {
  const size = 128;
  const pixels = new Uint8Array(size * size * 4);
  let seed = 719;
  for (let i = 0; i < size * size; i++) {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    const shade = 100 + (seed % 140);
    pixels.set([shade, shade, shade, 255], i * 4);
  }
  const texture = new THREE.DataTexture(pixels, size, size);
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(35, 70);
  texture.needsUpdate = true;
  return texture;
}

function Pickleball({ close }: { close: boolean }) {
  const frame = useCurrentFrame();
  const outer = useMemo(() => perforatedSphere(0.65), []);
  const inner = useMemo(() => perforatedSphere(0.62), []);
  const roughness = useMemo(() => acrylicTexture(), []);
  return (
    <group
      position={
        close
          ? [0.55, 1.2, 0]
          : [0.9, 0.45 + Math.sin(((frame - 80) / 90) * Math.PI) * 0.7, -2.1]
      }
      scale={close ? 1 : 0.16}
      rotation={[frame * 0.009, frame * 0.014, 0.2]}
    >
      <mesh geometry={outer} castShadow>
        <meshPhysicalMaterial
          color="#dff26b"
          roughness={0.42}
          bumpMap={roughness}
          bumpScale={0.002}
          clearcoat={0.12}
          side={THREE.DoubleSide}
        />
      </mesh>
      <mesh geometry={inner}>
        <meshStandardMaterial
          color="#b6c843"
          roughness={0.65}
          side={THREE.BackSide}
        />
      </mesh>
      {holeDirections.map((direction, i) => (
        <mesh
          key={i}
          position={direction.clone().multiplyScalar(0.641)}
          quaternion={new THREE.Quaternion().setFromUnitVectors(
            new THREE.Vector3(0, 0, 1),
            direction,
          )}
        >
          <torusGeometry args={[0.102, 0.016, 12, 48]} />
          <meshStandardMaterial color="#d8e95f" roughness={0.6} />
        </mesh>
      ))}
    </group>
  );
}

function Court() {
  const texture = useMemo(() => acrylicTexture(), []);
  const netGeometry = useMemo(() => {
    const points: number[] = [];
    for (let x = -3.2; x <= 3.2; x += 0.09) points.push(x, 0.07, 0, x, 0.89, 0);
    for (let y = 0.07; y <= 0.89; y += 0.055)
      points.push(-3.2, y, 0, 3.2, y, 0);
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(points, 3),
    );
    return geometry;
  }, []);
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[30, 36]} />
        <meshStandardMaterial
          color="#152b28"
          roughness={0.95}
          bumpMap={texture}
          bumpScale={0.024}
        />
      </mesh>
      <mesh
        position={[0, 0.004, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        receiveShadow
      >
        <planeGeometry args={[6.1, 13.4]} />
        <meshStandardMaterial
          color="#1364ae"
          roughness={0.82}
          bumpMap={texture}
          bumpScale={0.018}
        />
      </mesh>
      <mesh
        position={[0, 0.007, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        receiveShadow
      >
        <planeGeometry args={[6.1, 4.26]} />
        <meshStandardMaterial
          color="#205381"
          roughness={0.82}
          bumpMap={texture}
          bumpScale={0.018}
        />
      </mesh>
      {[-3.05, 3.05].map((x) => (
        <mesh key={x} position={[x, 0.011, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[0.05, 13.45]} />
          <meshStandardMaterial color="#eef1db" roughness={0.8} />
        </mesh>
      ))}
      {[-6.7, -2.13, 2.13, 6.7].map((z) => (
        <mesh key={z} position={[0, 0.012, z]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[6.1, 0.05]} />
          <meshStandardMaterial color="#eef1db" roughness={0.8} />
        </mesh>
      ))}
      {[-4.41, 4.41].map((z) => (
        <mesh key={z} position={[0, 0.012, z]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[0.05, 4.57]} />
          <meshStandardMaterial color="#eef1db" roughness={0.8} />
        </mesh>
      ))}
      <lineSegments geometry={netGeometry}>
        <lineBasicMaterial color="#0b1017" />
      </lineSegments>
      <mesh position={[0, 0.91, 0]} castShadow>
        <boxGeometry args={[6.55, 0.045, 0.025]} />
        <meshStandardMaterial color="#e7eadd" roughness={0.8} />
      </mesh>
      {[-3.3, 3.3].map((x) => (
        <mesh key={x} position={[x, 0.51, 0]} castShadow>
          <cylinderGeometry args={[0.035, 0.035, 1.02, 16]} />
          <meshStandardMaterial
            color="#263949"
            metalness={0.65}
            roughness={0.35}
          />
        </mesh>
      ))}
      {[-4.4, 4.4].flatMap((x) =>
        [-5.8, 5.8].map((z) => (
          <group key={`${x}/${z}`} position={[x, 0, z]}>
            <mesh position={[0, 2.8, 0]}>
              <cylinderGeometry args={[0.055, 0.08, 5.6, 12]} />
              <meshStandardMaterial
                color="#263949"
                metalness={0.6}
                roughness={0.4}
              />
            </mesh>
            <mesh position={[0, 5.5, 0]} rotation={[Math.PI / 5, 0, 0]}>
              <boxGeometry args={[0.7, 0.12, 0.4]} />
              <meshStandardMaterial
                color="#efffed"
                emissive="#e9f4ff"
                emissiveIntensity={3}
              />
            </mesh>
            <pointLight
              position={[0, 5.3, 0]}
              color="#d6e6ff"
              intensity={65}
              distance={17}
              decay={2}
            />
          </group>
        )),
      )}
    </group>
  );
}

function CameraRig() {
  const frame = useCurrentFrame();
  const { camera } = useThree();
  useLayoutEffect(() => {
    if (frame < 80) {
      const t = interpolate(frame, [0, 79], [0, 1], smooth);
      camera.position.set(2.5 - t * 0.55, 1.7 + t * 0.1, 3.1 - t * 0.35);
      camera.lookAt(-0.23, 1.1, 0);
    } else if (frame < 170) {
      const t = interpolate(frame, [80, 169], [0, 1], {
        ...clamp,
        easing: Easing.inOut(Easing.cubic),
      });
      camera.position.set(2.8 - t * 4.1, 1.75 - t * 0.55, 8.5 - t * 4.8);
      camera.lookAt(0, 0.55, -3.8);
    } else {
      const t = interpolate(frame, [170, 239], [0, 1], smooth);
      camera.position.set(8 - t, 8.8 + t * 1.3, 10.5 - t);
      camera.lookAt(0, 0, 0);
    }
    camera.updateProjectionMatrix();
  }, [camera, frame]);
  return null;
}

export function CourtFilm() {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const reveal = frame >= 170;
  return (
    <AbsoluteFill style={{ background: "#080f18", color: "#eef1e9" }}>
      <ThreeCanvas
        width={width}
        height={height}
        shadows={{ type: THREE.PCFShadowMap }}
        camera={{ fov: 43, near: 0.05, far: 80 }}
        gl={{
          antialias: true,
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.25,
        }}
      >
        <color attach="background" args={["#080f18"]} />
        <fog attach="fog" args={["#080f18", 15, 42]} />
        <ambientLight color="#b7caeb" intensity={0.45} />
        <directionalLight
          position={[2, 6, 3]}
          intensity={2.1}
          color="#fffde6"
          castShadow
          shadow-mapSize={[1024, 1024]}
          shadow-camera-left={-12}
          shadow-camera-right={12}
          shadow-camera-top={12}
          shadow-camera-bottom={-12}
          shadow-bias={-0.0002}
        />
        <directionalLight
          position={[-4, 3, -2]}
          intensity={1.4}
          color="#6bafff"
        />
        <CameraRig />
        <Court />
        <Pickleball close={frame < 80} />
      </ThreeCanvas>
      <AbsoluteFill
        style={{
          background:
            "linear-gradient(90deg, #080f1888, transparent 65%), linear-gradient(0deg, #080f1899, transparent 45%)",
        }}
      />
      <div
        style={{
          position: "absolute",
          top: 48,
          left: 64,
          right: 64,
          display: "flex",
          justifyContent: "space-between",
          fontFamily: "Arial, sans-serif",
          fontSize: 16,
          letterSpacing: "0.18em",
          color: "#bdccda",
        }}
      >
        <span>DOON PICKLEBALL ACADEMY</span>
        <span>DEHRADUN / INDIA</span>
      </div>
      {!reveal && (
        <div
          style={{
            position: "absolute",
            left: 64,
            bottom: 90,
            opacity: interpolate(
              frame,
              [0, 10, 66, 78, 80, 92, 155, 169],
              [0, 1, 1, 0, 0, 1, 1, 0],
              clamp,
            ),
            translate: `0 ${interpolate(frame < 80 ? frame : frame - 80, [0, 30], [35, 0], smooth)}px`,
            fontFamily: "Impact, 'Arial Narrow', sans-serif",
            fontSize: 99,
            lineHeight: 0.95,
            letterSpacing: "-0.025em",
          }}
        >
          {frame < 80 ? (
            <>
              <span>THE NEXT</span>
              <br />
              <span style={{ color: "#dff277" }}>GREAT GAME.</span>
            </>
          ) : (
            <>
              <span>IS JUST</span>
              <br />
              <span style={{ color: "#dff277" }}>ONE RALLY AWAY.</span>
            </>
          )}
        </div>
      )}
      {reveal && (
        <AbsoluteFill
          style={{
            justifyContent: "center",
            alignItems: "center",
            background: "#080f1870",
            opacity: interpolate(frame, [170, 190], [0, 1], smooth),
            translate: `0 ${interpolate(frame, [170, 195], [35, 0], smooth)}px`,
          }}
        >
          <div
            style={{
              color: "#dff277",
              fontFamily: "Impact, 'Arial Narrow', sans-serif",
              fontSize: 198,
              letterSpacing: "0.015em",
              lineHeight: 0.93,
            }}
          >
            DOON.
          </div>
          <div
            style={{
              marginTop: 26,
              fontFamily: "Arial, sans-serif",
              fontSize: 24,
              letterSpacing: "0.27em",
            }}
          >
            STEP OUT. PLAY ON.
          </div>
        </AbsoluteFill>
      )}
      <div
        style={{
          position: "absolute",
          left: 64,
          right: 64,
          bottom: 38,
          display: "flex",
          alignItems: "center",
          gap: 18,
          fontFamily: "Arial, sans-serif",
          fontSize: 14,
          letterSpacing: "0.12em",
          color: "#b7c6d2",
        }}
      >
        <span style={{ width: 34, height: 2, background: "#dff277" }} />
        {frame < 80
          ? "01 / FEEL THE GAME"
          : frame < 170
            ? "02 / FIND YOUR COURT"
            : "03 / MAKE IT A ROUTINE"}
      </div>
      <AbsoluteFill
        style={{
          background: "#080f18",
          opacity: interpolate(
            frame,
            [0, 8, 72, 79, 80, 88, 162, 169, 170, 178, 231, 239],
            [1, 0, 0, 1, 1, 0, 0, 1, 1, 0, 0, 1],
            clamp,
          ),
        }}
      />
    </AbsoluteFill>
  );
}
