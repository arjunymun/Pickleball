"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { buildCourtWorld, COURT_CENTERS } from "./court-world";
import styles from "./court-explorer.module.css";

export type CourtView = "overview" | "overhead" | "courtside";
export interface CourtCanvasProps {
  night: boolean;
  court: number;
  view: CourtView;
  reducedMotion: boolean;
  onReady: () => void;
  onUnavailable: () => void;
}

export default function CourtCanvas(props: CourtCanvasProps) {
  const host = useRef<HTMLDivElement>(null);
  const settings = useRef(props);
  const requestRender = useRef<(() => void) | null>(null);
  useEffect(() => {
    settings.current = props;
    requestRender.current?.();
  }, [props]);
  useEffect(() => {
    const element = host.current;
    if (!element) return;
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        powerPreference: "low-power",
      });
    } catch {
      settings.current.onUnavailable();
      return;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    renderer.domElement.setAttribute("aria-hidden", "true");
    element.appendChild(renderer.domElement);
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(39, 1, 0.1, 300);
    camera.position.set(32, 34, 44);
    let world: ReturnType<typeof buildCourtWorld>;
    try {
      world = buildCourtWorld(scene);
    } catch {
      renderer.dispose();
      renderer.domElement.remove();
      settings.current.onUnavailable();
      return;
    }
    let frame = 0;
    let visible = true;
    let disposed = false;
    let ready = false;
    let previousTime = 0;
    let horizontal = 0;
    let vertical = 0;
    const lookingAt = new THREE.Vector3(0, 0, 0);
    const destination = new THREE.Vector3();
    const aim = new THREE.Vector3();
    function draw(time: number) {
      frame = 0;
      if (disposed || !visible || document.hidden) return;
      const current = settings.current;
      const [x, z] = COURT_CENTERS[current.court];
      const narrow = element!.clientWidth < 700;
      aim.set(
        current.view === "courtside" ? x : 0,
        0,
        current.view === "courtside" ? z : 0,
      );
      if (current.view === "overhead")
        destination.set(0, narrow ? 63 : 52, 0.01);
      else if (current.view === "courtside")
        destination.set(x + 10, 5.7, z + 13);
      else
        destination.set(narrow ? 34 : 27, narrow ? 40 : 29, narrow ? 49 : 35);
      if (!current.reducedMotion && current.view !== "overhead") {
        destination.x += horizontal * 4;
        destination.y += vertical * 2;
      }
      const amount = current.reducedMotion
        ? 1
        : 1 -
          Math.exp(-Math.min((time - previousTime) / 1000 || 0.016, 0.05) * 7);
      previousTime = time;
      camera.position.lerp(destination, amount);
      lookingAt.lerp(aim, amount);
      camera.lookAt(lookingAt);
      world.update(current.night, current.court);
      renderer.render(scene, camera);
      if (!ready) {
        ready = true;
        current.onReady();
      }
      if (
        camera.position.distanceTo(destination) > 0.005 ||
        lookingAt.distanceTo(aim) > 0.005
      )
        schedule();
    }
    function schedule() {
      if (!frame && !disposed && visible && !document.hidden)
        frame = requestAnimationFrame(draw);
    }
    requestRender.current = schedule;
    const resize = new ResizeObserver(() => {
      const width = element.clientWidth;
      const height = element.clientHeight;
      if (!width || !height) return;
      renderer.setSize(width, height);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      schedule();
    });
    resize.observe(element);
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible) {
        previousTime = 0;
        schedule();
      } else {
        cancelAnimationFrame(frame);
        frame = 0;
      }
    });
    observer.observe(element);
    function pointerMove(event: PointerEvent) {
      if (settings.current.reducedMotion || event.pointerType !== "mouse")
        return;
      const bounds = element!.getBoundingClientRect();
      horizontal = (event.clientX - bounds.left) / bounds.width - 0.5;
      vertical = (event.clientY - bounds.top) / bounds.height - 0.5;
      schedule();
    }
    function pointerLeave() {
      horizontal = 0;
      vertical = 0;
      schedule();
    }
    function visibility() {
      if (document.hidden) {
        cancelAnimationFrame(frame);
        frame = 0;
      } else {
        previousTime = 0;
        schedule();
      }
    }
    function contextLost(event: Event) {
      event.preventDefault();
      settings.current.onUnavailable();
    }
    element.addEventListener("pointermove", pointerMove);
    element.addEventListener("pointerleave", pointerLeave);
    renderer.domElement.addEventListener("webglcontextlost", contextLost);
    document.addEventListener("visibilitychange", visibility);
    schedule();
    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      requestRender.current = null;
      resize.disconnect();
      observer.disconnect();
      element.removeEventListener("pointermove", pointerMove);
      element.removeEventListener("pointerleave", pointerLeave);
      document.removeEventListener("visibilitychange", visibility);
      renderer.domElement.removeEventListener("webglcontextlost", contextLost);
      world.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, []);
  return <div className={styles.canvas} ref={host} />;
}
