"use client";

import AsciiCanvas from "../ascii/AsciiCanvas";
import { dome } from "../ascii/motifs/dome";
import styles from "./HiroshimaHero.module.css";

const DOME_COLOR = "#6B7B8A";

export default function HiroshimaHero() {
  return (
    <section className={styles.hero}>
      <AsciiCanvas
        motif={dome}
        color={DOME_COLOR}
        mode="hero"
        className={styles.canvas}
        ariaLabel="原爆ドーム"
      />
      <div className={styles.fade} />
      <div className={styles.titleBlock}>
        <span className={styles.label}>Hiroshima</span>
        <h1 className={styles.title}>広島</h1>
        <span className={styles.subtitle}>flowing, still</span>
      </div>
    </section>
  );
}
