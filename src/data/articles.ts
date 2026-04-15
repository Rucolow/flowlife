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
}

export const ARTICLES: ArticleData[] = [
  { slug: "paper-crane", title: "千羽鶴の重さ", titleEn: "Paper Crane Weight", motif: "crane", color: "#B5564A" },
  { slug: "tram-silence", title: "路面電車の沈黙", titleEn: "Tram Silence", motif: "tram", color: "#4A6B5E" },
  { slug: "floating-torii", title: "浮かぶ鳥居", titleEn: "Floating Torii", motif: "torii", color: "#C4563A" },
  { slug: "deer-island", title: "鹿のいる島", titleEn: "Deer Island", motif: "deer", color: "#8B7355" },
  { slug: "autumn-leaf", title: "もみじの時間", titleEn: "Maple Time", motif: "maple", color: "#C4443A" },
  { slug: "oyster-morning", title: "牡蠣筏の朝", titleEn: "Oyster Raft Morning", motif: "oyster", color: "#7A8B8E" },
  { slug: "bridge-count", title: "橋を数える", titleEn: "Bridge Count", motif: "bridge", color: "#5A6A7A" },
  { slug: "eternal-flame", title: "消えない灯", titleEn: "Eternal Flame", motif: "flame", color: "#D4A245" },
  { slug: "iron-spatula", title: "鉄板の上の手", titleEn: "Okonomiyaki Hands", motif: "spatula", color: "#6B5A45" },
  { slug: "island-ferry", title: "島へのフェリー", titleEn: "Island Ferry", motif: "ferry", color: "#4A6580" },
];

export const HERO_CONFIG = {
  motif: "dome" as const,
  color: "#6B7B8A",
};
