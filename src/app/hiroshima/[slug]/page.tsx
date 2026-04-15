import { notFound } from "next/navigation";
import Header from "@/components/layout/Header";
import ArticleHero from "@/components/hero/ArticleHero";
import ArticleBody from "@/components/article/ArticleBody";
import { ARTICLES } from "@/data/articles";
import styles from "./page.module.css";

export function generateStaticParams() {
  return ARTICLES.map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const article = ARTICLES.find((a) => a.slug === slug);
  if (!article) return { title: "Flow Life" };
  return {
    title: `${article.title} — Flow Life`,
    description: article.titleEn,
  };
}

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const article = ARTICLES.find((a) => a.slug === slug);
  if (!article) notFound();

  return (
    <main className={styles.main}>
      <Header />
      <ArticleHero article={article} />
      <ArticleBody videos={article.videos} />
    </main>
  );
}
