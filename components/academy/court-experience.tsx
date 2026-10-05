"use client";

import dynamic from "next/dynamic";
import {
  motion,
  useMotionValue,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
} from "framer-motion";
import { useRef } from "react";
import { CourtArtwork } from "./court-artwork";
import styles from "./home.module.css";

const MotionCourt = dynamic(() => import("./motion-court"), {
  ssr: false,
  loading: () => (
    <div className={styles.poster}>
      <CourtArtwork />
    </div>
  ),
});
export function CourtExperience() {
  const scene = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: scene,
    offset: ["start start", "end start"],
  });
  const cameraY = useTransform(scrollYProgress, [0, 1], [0, 65]);
  const cameraScale = useTransform(scrollYProgress, [0, 1], [1, 1.12]);
  const cameraAngle = useTransform(scrollYProgress, [0, 1], [0, -7]);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotateX = useSpring(x, { stiffness: 85, damping: 22 });
  const rotateY = useSpring(y, { stiffness: 85, damping: 22 });
  const reducedMotion = useReducedMotion();
  return (
    <div
      ref={scene}
      className={styles.interactiveArt}
      onPointerMove={(event) => {
        if (reducedMotion || event.pointerType !== "mouse") return;
        const bounds = event.currentTarget.getBoundingClientRect();
        x.set(((event.clientY - bounds.top) / bounds.height - 0.5) * -7);
        y.set(((event.clientX - bounds.left) / bounds.width - 0.5) * 9);
      }}
      onPointerLeave={() => {
        x.set(0);
        y.set(0);
      }}
    >
      <motion.div
        style={{
          y: reducedMotion ? 0 : cameraY,
          scale: reducedMotion ? 1 : cameraScale,
          rotateZ: reducedMotion ? 0 : cameraAngle,
        }}
      >
        <motion.div
          style={{
            rotateX: reducedMotion ? 0 : rotateX,
            rotateY: reducedMotion ? 0 : rotateY,
          }}
        >
          <MotionCourt />
        </motion.div>
      </motion.div>
    </div>
  );
}
