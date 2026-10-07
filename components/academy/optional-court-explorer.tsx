"use client";

import dynamic from "next/dynamic";
import { ChevronDown } from "lucide-react";
import { useState } from "react";
import styles from "./home.module.css";

const CourtExplorer = dynamic(
  () => import("./court-explorer").then((module) => module.CourtExplorer),
  { ssr: false, loading: () => <p role="status">Opening the court view…</p> },
);

export function OptionalCourtExplorer() {
  const [open, setOpen] = useState(false);
  return (
    <div className={styles.courtUtility}>
      <button
        className={styles.explorerToggle}
        type="button"
        aria-expanded={open}
        aria-controls="optional-court-view"
        onClick={() => setOpen(!open)}
      >
        <span>Explore the four courts</span>
        <ChevronDown
          size={22}
          style={{ rotate: open ? "180deg" : "0deg" }}
          aria-hidden="true"
        />
      </button>
      <div id="optional-court-view" hidden={!open}>
        {open && <CourtExplorer />}
      </div>
    </div>
  );
}
