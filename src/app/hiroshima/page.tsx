import HiroshimaHero from "@/components/hero/HiroshimaHero";
import CardGrid from "@/components/cards/CardGrid";
import { ARTICLES } from "@/data/articles";
import styles from "./page.module.css";

export default function HiroshimaPage() {
  return (
    <main className={styles.main}>
      <HiroshimaHero />
      <CardGrid articles={ARTICLES} />
    </main>
  );
}
