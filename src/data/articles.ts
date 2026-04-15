export interface ArticleVideo {
  /** public/ からの絶対パス (例: "/videos/paper-crane-1.mp4") */
  src: string;
  /** CSS aspect-ratio (例: "16 / 9", "21 / 9", "2 / 1")。既定 "16 / 9"。 */
  aspect?: string;
  /** 読み上げ用ラベル。無くても可。 */
  ariaLabel?: string;
}

export interface ArticleData {
  slug: string;
  title: string;
  titleEn: string;
  motif:
    | "crane"
    | "tram"
    | "torii"
    | "deer"
    | "maple"
    | "oyster"
    | "bridge"
    | "flame"
    | "spatula"
    | "ferry";
  color: string;
  /**
   * 本文に挿入するスロー映像。2本想定（3段落のあとに1本目、次の3段落のあとに2本目）。
   * 1本だけ、または 0 本にしても動作する（足りない枠はプレースホルダーが表示される）。
   */
  videos?: ArticleVideo[];
}

export const ARTICLES: ArticleData[] = [
  {
    slug: "paper-crane",
    title: "千羽鶴の重さ",
    titleEn: "Paper Crane Weight",
    motif: "crane",
    color: "#B5564A",
    videos: [
      { src: "/videos/paper-crane-1.mp4", aspect: "16 / 9" },
      { src: "/videos/paper-crane-2.mp4", aspect: "21 / 9" },
    ],
  },
  {
    slug: "tram-silence",
    title: "路面電車の沈黙",
    titleEn: "Tram Silence",
    motif: "tram",
    color: "#4A6B5E",
    videos: [
      { src: "/videos/tram-silence-1.mp4", aspect: "16 / 9" },
      { src: "/videos/tram-silence-2.mp4", aspect: "21 / 9" },
    ],
  },
  {
    slug: "floating-torii",
    title: "浮かぶ鳥居",
    titleEn: "Floating Torii",
    motif: "torii",
    color: "#C4563A",
    videos: [
      { src: "/videos/floating-torii-1.mp4", aspect: "16 / 9" },
      { src: "/videos/floating-torii-2.mp4", aspect: "21 / 9" },
    ],
  },
  {
    slug: "deer-island",
    title: "鹿のいる島",
    titleEn: "Deer Island",
    motif: "deer",
    color: "#8B7355",
    videos: [
      { src: "/videos/deer-island-1.mp4", aspect: "16 / 9" },
      { src: "/videos/deer-island-2.mp4", aspect: "21 / 9" },
    ],
  },
  {
    slug: "autumn-leaf",
    title: "もみじの時間",
    titleEn: "Maple Time",
    motif: "maple",
    color: "#C4443A",
    videos: [
      { src: "/videos/autumn-leaf-1.mp4", aspect: "16 / 9" },
      { src: "/videos/autumn-leaf-2.mp4", aspect: "21 / 9" },
    ],
  },
  {
    slug: "oyster-morning",
    title: "牡蠣筏の朝",
    titleEn: "Oyster Raft Morning",
    motif: "oyster",
    color: "#7A8B8E",
    videos: [
      { src: "/videos/oyster-morning-1.mp4", aspect: "16 / 9" },
      { src: "/videos/oyster-morning-2.mp4", aspect: "21 / 9" },
    ],
  },
  {
    slug: "bridge-count",
    title: "橋を数える",
    titleEn: "Bridge Count",
    motif: "bridge",
    color: "#5A6A7A",
    videos: [
      { src: "/videos/bridge-count-1.mp4", aspect: "16 / 9" },
      { src: "/videos/bridge-count-2.mp4", aspect: "21 / 9" },
    ],
  },
  {
    slug: "eternal-flame",
    title: "消えない灯",
    titleEn: "Eternal Flame",
    motif: "flame",
    color: "#D4A245",
    videos: [
      { src: "/videos/eternal-flame-1.mp4", aspect: "16 / 9" },
      { src: "/videos/eternal-flame-2.mp4", aspect: "21 / 9" },
    ],
  },
  {
    slug: "iron-spatula",
    title: "鉄板の上の手",
    titleEn: "Okonomiyaki Hands",
    motif: "spatula",
    color: "#6B5A45",
    videos: [
      { src: "/videos/iron-spatula-1.mp4", aspect: "16 / 9" },
      { src: "/videos/iron-spatula-2.mp4", aspect: "21 / 9" },
    ],
  },
  {
    slug: "island-ferry",
    title: "島へのフェリー",
    titleEn: "Island Ferry",
    motif: "ferry",
    color: "#4A6580",
    videos: [
      { src: "/videos/island-ferry-1.mp4", aspect: "16 / 9" },
      { src: "/videos/island-ferry-2.mp4", aspect: "21 / 9" },
    ],
  },
];

export const HERO_CONFIG = {
  motif: "dome" as const,
  color: "#6B7B8A",
};
