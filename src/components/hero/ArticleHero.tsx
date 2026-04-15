"use client";

import AsciiCanvas from "../ascii/AsciiCanvas";
import { getMotif } from "../ascii/motifs";
import type { ArticleData } from "@/data/articles";
import styles from "./ArticleHero.module.css";

export interface ArticleHeroProps {
  article: ArticleData;
}

/**
 * 記事ページのヒーロー。高さ55vh、カードと同一のモチーフ・色を mode="hero" で
 * フルワイド表示する。左下に日本語タイトル + 英語タイトル。
 */
export default function ArticleHero({ article }: ArticleHeroProps) {
  const motif = getMotif(article.motif);
  return (
    <section className={styles.hero}>
      <AsciiCanvas
        motif={motif}
        color={article.color}
        mode="hero"
        className={styles.canvas}
        ariaLabel={article.title}
      />
      <div className={styles.fade} />
      <div className={styles.titleBlock}>
        <h1 className={styles.title}>{article.title}</h1>
        <span className={styles.titleEn}>{article.titleEn}</span>
      </div>
    </section>
  );
}
