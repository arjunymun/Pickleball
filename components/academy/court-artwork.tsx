import styles from "./court-artwork.module.css";

export function CourtArtwork({
  lift = 0,
  angle = 0,
}: {
  lift?: number;
  angle?: number;
}) {
  return (
    <div className={styles.scene} aria-hidden="true">
      <div className={styles.halo} />
      <div className={styles.courtShadow} />
      <div
        className={styles.deck}
        style={{ transform: `rotateX(57deg) rotateZ(${-28 + angle}deg)` }}
      >
        <div className={styles.surface}>
          <div className={styles.boundary}>
            <div className={styles.kitchen} />
            <div className={styles.centerLine} />
            <div className={styles.net}>
              <span />
            </div>
          </div>
        </div>
        <div className={styles.frontEdge} />
        <div className={styles.sideEdge} />
      </div>
      <div
        className={styles.paddle}
        style={{
          transform: `translateY(${lift * 0.4}px) rotate(-24deg) rotateY(${angle * 2}deg)`,
        }}
      >
        <div className={styles.paddleFace}>
          <span>DOON</span>
          <i />
        </div>
        <div className={styles.paddleNeck} />
        <div className={styles.grip} />
      </div>
      <div
        className={styles.ballShadow}
        style={{
          opacity: 0.3 + lift * 0.002,
          transform: `scale(${1 + lift * 0.004})`,
        }}
      />
      <div
        className={styles.ball}
        style={{ transform: `translateY(${lift}px) rotate(${angle * 3}deg)` }}
      >
        <svg viewBox="0 0 160 160" role="presentation">
          <defs>
            <radialGradient id="court-ball-shade" cx="32%" cy="24%" r="80%">
              <stop stopColor="#f8ffad" />
              <stop offset=".45" stopColor="#dae93a" />
              <stop offset=".78" stopColor="#b2c620" />
              <stop offset="1" stopColor="#718b13" />
            </radialGradient>
            <radialGradient id="court-ball-hole">
              <stop stopColor="#314611" />
              <stop offset=".72" stopColor="#4e6517" />
              <stop offset="1" stopColor="#92a722" />
            </radialGradient>
          </defs>
          <circle cx="80" cy="80" r="76" fill="url(#court-ball-shade)" />
          {[
            [49, 35, 9, 7, -35],
            [84, 23, 10, 5, 0],
            [119, 42, 9, 7, 35],
            [27, 71, 6, 11, -15],
            [65, 66, 12, 12, 0],
            [105, 78, 12, 12, 0],
            [137, 82, 5, 11, 10],
            [39, 109, 8, 10, -30],
            [76, 117, 11, 9, 0],
            [115, 119, 8, 8, 30],
            [82, 151, 9, 3, 0],
          ].map(([cx, cy, rx, ry, rotation], i) => (
            <ellipse
              key={i}
              cx={cx}
              cy={cy}
              rx={rx}
              ry={ry}
              transform={`rotate(${rotation} ${cx} ${cy})`}
              fill="url(#court-ball-hole)"
              stroke="#eff96e"
              strokeWidth="1.3"
            />
          ))}
          <path
            d="M22 53C33 23 63 7 89 10"
            fill="none"
            stroke="#ffffca"
            strokeOpacity=".65"
            strokeWidth="3"
            strokeLinecap="round"
          />
        </svg>
      </div>
    </div>
  );
}
