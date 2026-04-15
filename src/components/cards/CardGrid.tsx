"use client";

import { useCallback, useRef, useState } from "react";
import ArticleCard from "./ArticleCard";
import type { ArticleData } from "@/data/articles";
import {
  runShuffle,
  shuffleArray,
  type CardSlot,
} from "../ascii/shuffleAnimation";
import styles from "./CardGrid.module.css";

export interface CardGridProps {
  articles: ArticleData[];
}

/**
 * 3列均一グリッド（タブレット2列 / モバイル1列）。
 * シャッフルボタンで粒子アニメーションを発火し、記事順序を入れ替える。
 */
export default function CardGrid({ articles }: CardGridProps) {
  const [order, setOrder] = useState<ArticleData[]>(articles);
  const [isShuffling, setIsShuffling] = useState(false);
  const [hidden, setHidden] = useState(false);
  const cellRefs = useRef<Array<HTMLDivElement | null>>([]);

  const handleShuffle = useCallback(async () => {
    if (isShuffling) return;
    // Rects at the moment of click（グリッドは不動のため source/target 共通）
    const rects: DOMRect[] = cellRefs.current.map((el) =>
      el ? el.getBoundingClientRect() : new DOMRect(),
    );
    const slots: CardSlot[] = order.map((article, i) => ({
      article,
      rect: rects[i],
      key: article.slug,
    }));
    const newAssignment = shuffleArray(order);

    setIsShuffling(true);
    await runShuffle({
      slots,
      newAssignment,
      onBeforeScatter: () => setHidden(true),
      onReorder: () => setOrder(newAssignment),
      onComplete: () => {
        setHidden(false);
        setIsShuffling(false);
      },
    });
  }, [order, isShuffling]);

  return (
    <div className={styles.wrap}>
      <div className={styles.toolbar}>
        <button
          type="button"
          className={styles.shuffleBtn}
          onClick={handleShuffle}
          disabled={isShuffling}
          aria-label="Shuffle articles"
        >
          Shuffle
        </button>
      </div>
      <div className={`${styles.grid} ${hidden ? styles.hiddenCards : ""}`}>
        {order.map((article, i) => (
          // key={i} keeps the grid cell's DOM position stable across reorders.
          // Only the article prop changes, so rects captured before shuffle
          // still match rects after React re-renders.
          <div
            key={i}
            className={styles.gridCell}
            ref={(el) => {
              cellRefs.current[i] = el;
            }}
          >
            <ArticleCard article={article} />
          </div>
        ))}
      </div>
    </div>
  );
}
