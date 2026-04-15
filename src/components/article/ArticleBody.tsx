import Link from "next/link";
import SlowVideo from "./SlowVideo";
import styles from "./ArticleBody.module.css";

export interface ArticleBodyProps {
  /**
   * 段落テキスト（未指定時はプレースホルダーを使用）。
   * 映像の挿入位置は後続ステップで content/ のデータから決定する。
   */
  paragraphs?: string[];
}

/**
 * 本文レイアウト: 3段落 → 映像 → 3段落 → 映像 → return link。
 * テキストは人間が用意するまでのプレースホルダー。
 */
export default function ArticleBody({ paragraphs }: ArticleBodyProps) {
  const paras = paragraphs ?? PLACEHOLDER_PARAGRAPHS;
  // 3 + video + 3 + video の構成。段落が足りなければフォールバックで埋める。
  const filled = [...paras];
  while (filled.length < 6) {
    filled.push(PLACEHOLDER_PARAGRAPHS[filled.length % PLACEHOLDER_PARAGRAPHS.length]);
  }

  const first = filled.slice(0, 3);
  const second = filled.slice(3, 6);

  return (
    <div className={styles.body}>
      {first.map((p, i) => (
        <p key={`a-${i}`} className={styles.paragraph}>
          {p}
        </p>
      ))}
      <SlowVideo aspect="16 / 9" />
      {second.map((p, i) => (
        <p key={`b-${i}`} className={styles.paragraph}>
          {p}
        </p>
      ))}
      <SlowVideo aspect="21 / 9" />
      <div className={styles.end}>
        <div className={styles.endLine} aria-hidden="true" />
        <Link href="/hiroshima" className={styles.endLink}>
          return to Hiroshima
        </Link>
      </div>
    </div>
  );
}

/**
 * 本文プレースホルダー。人間が書くまでの仮置き。
 * 広島の静かな情景を想起させる6段落。
 */
const PLACEHOLDER_PARAGRAPHS: string[] = [
  "川のほとりを歩いていた。夕方の少し前、空はまだ青く、けれど光は落ちかけていて、水面の向こうに影がゆっくりと伸びていくのが見えた。橋の上で立ち止まり、下を流れる水を眺めていると、音もなく時間が進んでいるのが分かった。",
  "観光客のざわめきは遠くにあり、耳に届くのは風の音だけだった。橋を渡る人々の足音が石畳の上でかすかに響き、それが時折、水の流れに混じって消えていった。ここにいる理由を、うまく言葉にできなかった。",
  "鳥が一羽、川面をかすめて飛んでいった。何かを探していたのか、ただ通り過ぎただけなのかは分からない。けれどその速度が妙に印象に残った。ゆっくりではなく、かといって急いでもいない、自分の時間を持っている速度だった。",
  "夕食の時間まで、少しだけ歩くことにした。路面電車の線路に沿って、古い建物と新しい建物が交互に現れる道を、ただ前へ進んだ。誰かに会う約束もなく、目的地も決めていなかった。足が勝手に選んだ方向へ、ゆっくりと進んでいった。",
  "商店街の入口で足を止めた。中から漏れてくる匂いが、鉄板と油と、何か甘いものの混ざった匂いで、それが不思議と懐かしかった。自分の記憶にはないはずの匂いなのに、体のどこかがそれを知っているようだった。",
  "夜になっても、川は同じように流れていた。光の加減が変わっただけで、水そのものは昼の水と何も違わなかった。橋の上で再び立ち止まり、今度は何も考えずに、ただ流れていく水を見ていた。ここに来てよかったのだと、そのとき初めて思った。",
];
