"use client";

import { Player, type PlayerRef } from "@remotion/player";
import { useEffect, useRef, useState } from "react";
import { useInView, useReducedMotion } from "framer-motion";
import { Pause, Play } from "lucide-react";
import { CourtComposition } from "./court-composition";
import { CourtArtwork } from "./court-artwork";
import styles from "./home.module.css";

export default function MotionCourt() {
  const container = useRef<HTMLDivElement>(null);
  const player = useRef<PlayerRef>(null);
  const visible = useInView(container, { amount: 0.2 });
  const reducedMotion = useReducedMotion();
  const [paused, setPaused] = useState(false);
  useEffect(() => {
    const sync = () => {
      if (visible && !paused && !reducedMotion && !document.hidden)
        player.current?.play();
      else player.current?.pause();
    };
    sync();
    document.addEventListener("visibilitychange", sync);
    return () => document.removeEventListener("visibilitychange", sync);
  }, [visible, paused, reducedMotion]);
  return (
    <div ref={container} className={styles.artPlayer}>
      <div aria-hidden="true">
        {reducedMotion ? (
          <div className={styles.poster}>
            <CourtArtwork />
          </div>
        ) : (
          <Player
            ref={player}
            component={CourtComposition}
            durationInFrames={240}
            fps={30}
            compositionWidth={680}
            compositionHeight={560}
            loop
            controls={false}
            clickToPlay={false}
            doubleClickToFullscreen={false}
            spaceKeyToPlayOrPause={false}
            style={{ width: "100%", background: "transparent" }}
          />
        )}
      </div>
      {!reducedMotion && (
        <button
          className={styles.motionToggle}
          onClick={() => setPaused((value) => !value)}
          aria-label={paused ? "Play court animation" : "Pause court animation"}
        >
          {paused ? <Play size={14} /> : <Pause size={14} />}
          <span>{paused ? "Play motion" : "Pause motion"}</span>
        </button>
      )}
    </div>
  );
}
