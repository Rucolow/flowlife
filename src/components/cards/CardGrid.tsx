import ArticleCard from "./ArticleCard";
import type { ArticleData } from "@/data/articles";
import styles from "./CardGrid.module.css";

export interface CardGridProps {
  articles: ArticleData[];
}

/**
 * 3列均一グリッド（タブレット2列 / モバイル1列）。
 * シャッフルUIは後続ステップで追加する。
 */
export default function CardGrid({ articles }: CardGridProps) {
  return (
    <div className={styles.wrap}>
      <div className={styles.grid}>
        {articles.map((article) => (
          <ArticleCard key={article.slug} article={article} />
        ))}
      </div>
    </div>
  );
}
