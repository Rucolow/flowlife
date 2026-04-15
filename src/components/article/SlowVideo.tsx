"use client";

import { useEffect, useRef } from "react";
import styles from "./SlowVideo.module.css";

export interface SlowVideoProps {
  /** MP4/WEBM 等の映像URL。未指定ならプレースホルダーのみ表示。 */
  src?: string;
  /** アスペクト比（例: "16 / 9", "21 / 9", "2 / 1"）。既定: 16/9。 */
  aspect?: string;
  /** アクセシビリティ向けラベル（素材差し替え時に記述用途を説明）。 */
  ariaLabel?: string;
}

/**
 * 本文中に配置するスロー映像。
 *
 * - autoplay / muted / loop / playsinline
 * - IntersectionObserver で画面内のみ再生
 * - CSS filter: brightness(0.95)
 * - 左右に出血（本文幅より広い）
 * - 素材未提供の場合はグラデーション + "slow motion" ラベルで代替
 */
export default function SlowVideo({
  src,
  aspect = "16 / 9",
  ariaLabel,
}: SlowVideoProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const wrapRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const video = videoRef.current;
    const wrap = wrapRef.current;
    if (!video || !wrap) return;

    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            video.play().catch(() => {
              /* autoplay may be blocked; ignore */
            });
          } else {
            video.pause();
          }
        }
      },
      { threshold: 0.25 },
    );
    io.observe(wrap);
    return () => io.disconnect();
  }, [src]);

  return (
    <div
      ref={wrapRef}
      className={styles.wrap}
      style={{ aspectRatio: aspect }}
      aria-label={ariaLabel}
    >
      {src ? (
        <video
          ref={videoRef}
          className={styles.video}
          src={src}
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
        />
      ) : (
        <div className={styles.placeholder} aria-hidden="true">
          <span className={styles.label}>slow motion</span>
        </div>
      )}
    </div>
  );
}
