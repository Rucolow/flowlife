"use client";

import Link from "next/link";
import AsciiCanvas from "../ascii/AsciiCanvas";
import { getMotif } from "../ascii/motifs";
import type { ArticleData } from "@/data/articles";
import styles from "./ArticleCard.module.css";

export interface ArticleCardProps {
  article: ArticleData;
}

export default function ArticleCard({ article }: ArticleCardProps) {
  const motif = getMotif(article.motif);
  return (
    <Link
      href={`/hiroshima/${article.slug}`}
      className={styles.card}
      aria-label={`${article.title} — ${article.titleEn}`}
    >
      <div className={styles.canvasWrap}>
        <AsciiCanvas
          motif={motif}
          color={article.color}
          mode="card"
          className={styles.canvas}
          ariaLabel={article.title}
        />
      </div>
      <div className={styles.meta}>
        <span className={styles.title}>{article.title}</span>
        <span className={styles.titleEn}>{article.titleEn}</span>
      </div>
    </Link>
  );
}
