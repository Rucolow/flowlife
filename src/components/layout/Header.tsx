import Link from "next/link";
import styles from "./Header.module.css";

export interface HeaderProps {
  /** Back link destination. Defaults to /hiroshima. */
  backHref?: string;
  /** Back link label. */
  backLabel?: string;
}

/**
 * 記事ページの固定ヘッダー。
 * 高さ42px、blur背景、左に戻るリンク、右にブランド名。
 */
export default function Header({
  backHref = "/hiroshima",
  backLabel = "← Hiroshima",
}: HeaderProps) {
  return (
    <header className={styles.header}>
      <Link href={backHref} className={styles.back}>
        {backLabel}
      </Link>
      <span className={styles.brand}>Flow Life</span>
    </header>
  );
}
