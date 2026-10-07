"use client";

import { Pause, Play } from "lucide-react";
import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import styles from "./academy-film.module.css";

const FILM_SRC = "/media/doon-film.mp4";
const POSTER_SRC = "/media/doon-film-poster.jpg";

export function AcademyFilm() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const manuallyPaused = useRef(false);
  const [automaticPlayback, setAutomaticPlayback] = useState(false);
  const [manualPlayRequested, setManualPlayRequested] = useState(false);
  const [intersecting, setIntersecting] = useState(false);
  const [autoplayVisible, setAutoplayVisible] = useState(false);
  const [pageVisible, setPageVisible] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [unavailable, setUnavailable] = useState(false);
  const [automaticPlaybackBlocked, setAutomaticPlaybackBlocked] =
    useState(false);

  useEffect(() => {
    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const connection = (
      navigator as Navigator & { connection?: { saveData?: boolean } }
    ).connection;
    const updatePlaybackPreference = () => {
      setAutomaticPlayback(
        !motionQuery.matches && connection?.saveData !== true,
      );
    };

    updatePlaybackPreference();
    motionQuery.addEventListener("change", updatePlaybackPreference);
    return () =>
      motionQuery.removeEventListener("change", updatePlaybackPreference);
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || unavailable) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        const visible = entry.isIntersecting && entry.intersectionRatio > 0;
        if (!visible) setManualPlayRequested(false);
        setIntersecting(visible);
        setAutoplayVisible(visible && entry.intersectionRatio >= 0.25);
      },
      { threshold: [0, 0.25] },
    );
    observer.observe(video);
    const updateVisibility = () => {
      const visible = document.visibilityState === "visible";
      if (!visible) setManualPlayRequested(false);
      setPageVisible(visible);
    };
    updateVisibility();
    document.addEventListener("visibilitychange", updateVisibility);

    return () => {
      observer.disconnect();
      document.removeEventListener("visibilitychange", updateVisibility);
    };
  }, [unavailable]);

  const showFallback = useCallback(() => {
    setUnavailable(true);
    setPlaying(false);
  }, []);

  const handlePlayRejection = useCallback((error: unknown) => {
    const errorName =
      typeof error === "object" && error !== null && "name" in error
        ? error.name
        : undefined;
    if (errorName === "AbortError") return;

    setAutomaticPlaybackBlocked(true);
    setManualPlayRequested(false);
    setPlaying(false);
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || unavailable) return;

    if (!intersecting || !pageVisible) {
      video.pause();
      return;
    }

    if (
      (automaticPlayback &&
        autoplayVisible &&
        !automaticPlaybackBlocked &&
        !manuallyPaused.current) ||
      manualPlayRequested
    ) {
      void video.play().catch(handlePlayRejection);
    } else {
      video.pause();
    }
  }, [
    automaticPlayback,
    intersecting,
    autoplayVisible,
    pageVisible,
    manualPlayRequested,
    automaticPlaybackBlocked,
    unavailable,
    handlePlayRejection,
  ]);

  const togglePlayback = () => {
    const video = videoRef.current;
    if (!video || unavailable) return;

    if (!video.paused) {
      manuallyPaused.current = true;
      setManualPlayRequested(false);
      video.pause();
      return;
    }

    manuallyPaused.current = false;
    setManualPlayRequested(true);
    if (intersecting && pageVisible) {
      void video.play().catch(handlePlayRejection);
    }
  };

  return (
    <section className={styles.film} aria-label="Doon film">
      <div className={styles.frame}>
        <div className={styles.media}>
          <Image
            className={styles.poster}
            src={POSTER_SRC}
            alt=""
            width={1280}
            height={720}
            unoptimized
          />
          {!unavailable && (
            <video
              ref={videoRef}
              className={styles.video}
              src={FILM_SRC}
              poster={POSTER_SRC}
              muted
              loop
              playsInline
              preload="none"
              aria-label="Animated pickleball, blue court and Doon brand reveal"
              onPlay={() => setPlaying(true)}
              onPause={() => setPlaying(false)}
              onError={showFallback}
            />
          )}
          <div className={styles.overlay}>
            <p className={styles.label}>Doon / court film</p>
            {unavailable ? (
              <p className={styles.status} role="status">
                Film unavailable · poster shown
              </p>
            ) : (
              <button
                className={styles.toggle}
                type="button"
                aria-label={playing ? "Pause film" : "Play film"}
                onClick={togglePlayback}
              >
                {playing ? (
                  <Pause size={18} aria-hidden="true" />
                ) : (
                  <Play size={18} aria-hidden="true" />
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
