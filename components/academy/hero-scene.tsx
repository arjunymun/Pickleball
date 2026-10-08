"use client";

import Image from "next/image";
import { useRef, type PointerEvent } from "react";
import styles from "./hero-scene.module.css";

export function HeroScene() {
  const scene = useRef<HTMLDivElement>(null);

  function move(event: PointerEvent<HTMLDivElement>) {
    if (
      event.pointerType !== "mouse" ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    )
      return;
    const bounds = event.currentTarget.getBoundingClientRect();
    scene.current?.style.setProperty(
      "--shift-x",
      `${((event.clientX - bounds.left) / bounds.width - 0.5) * 18}px`,
    );
    scene.current?.style.setProperty(
      "--shift-y",
      `${((event.clientY - bounds.top) / bounds.height - 0.5) * 14}px`,
    );
  }

  function reset() {
    scene.current?.style.setProperty("--shift-x", "0px");
    scene.current?.style.setProperty("--shift-y", "0px");
  }

  return (
    <div
      className={styles.scene}
      ref={scene}
      onPointerMove={move}
      onPointerLeave={reset}
      aria-hidden="true"
    >
      <div className={styles.orbit} />
      <svg className={styles.court} viewBox="0 0 800 640" fill="none">
        <defs>
          <pattern
            id="doon-hero-net"
            width="6"
            height="6"
            patternUnits="userSpaceOnUse"
          >
            <path d="M0 0H6M0 0V6" stroke="#12251e" strokeWidth="0.8" />
          </pattern>
        </defs>
        <path d="M-80 359 359 99 864 377 407 680Z" fill="#155ee8" />
        <path d="m-80 359 487 321 457-303v24L407 704-80 383Z" fill="#1048b6" />
        <path
          d="m98 360 272-161 306 172-273 179Z"
          stroke="#f6f7f2"
          strokeWidth="3"
        />
        <path
          d="m239 278 307 177M241 454l272-169M305 316l-136 80m221-32 136-82"
          stroke="#f6f7f2"
          strokeWidth="3"
        />
        <path
          d="m231 278 306 177v25L231 303Z"
          fill="url(#doon-hero-net)"
          stroke="#12251e"
          strokeWidth="1.5"
        />
        <path d="M231 270v43m306 134v43" stroke="#12251e" strokeWidth="5" />
        <path d="m231 278 306 177" stroke="#f6f7f2" strokeWidth="4" />
      </svg>
      <div className={styles.shadow} />
      <Image
        className={styles.ball}
        src="/media/doon-ball.webp"
        alt=""
        width={1024}
        height={1024}
        sizes="(max-width:700px) 85vw, 48vw"
        priority
      />
      <div className={styles.mark}>
        DOON <span>PLAY OUTSIDE.</span>
      </div>
    </div>
  );
}
