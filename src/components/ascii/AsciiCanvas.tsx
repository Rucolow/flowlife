"use client";

import { useEffect, useRef } from "react";
import { BAYER4, CHARS, type MotifFunction } from "./motifs/types";

export interface AsciiCanvasProps {
  motif: MotifFunction;
  /** hex color, e.g. "#6B7B8A" */
  color: string;
  mode: "card" | "hero";
  className?: string;
  style?: React.CSSProperties;
  ariaLabel?: string;
}

interface ModeConfig {
  fps: number;
  resolutionScale: number;
  cellSize: number;
  cellSizeMobile: number;
  visibilityThreshold: number;
  mouseTracking: boolean;
}

const MODE_CONFIG: Record<"card" | "hero", ModeConfig> = {
  card: {
    fps: 15,
    resolutionScale: 0.6,
    cellSize: 5,
    cellSizeMobile: 7,
    visibilityThreshold: 0.05,
    mouseTracking: false,
  },
  hero: {
    fps: 60,
    resolutionScale: 0.75,
    cellSize: 8,
    cellSizeMobile: 10,
    visibilityThreshold: 0.1,
    mouseTracking: true,
  },
};

function parseHex(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return [r, g, b];
}

function isMobile(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(max-width: 560px)").matches;
}

export default function AsciiCanvas({
  motif,
  color,
  mode,
  className,
  style,
  ariaLabel,
}: AsciiCanvasProps) {
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const wrapper = wrapperRef.current;
    const canvas = canvasRef.current;
    if (!wrapper || !canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const cfg = MODE_CONFIG[mode];
    const [baseR, baseG, baseB] = parseHex(color);
    const frameInterval = 1000 / cfg.fps;

    let cellSize = isMobile() ? cfg.cellSizeMobile : cfg.cellSize;
    let cols = 0;
    let rows = 0;
    let cw = 0;
    let ch = 0;

    let rafId: number | null = null;
    let lastFrame = 0;
    let startTime = performance.now();
    let visible = true;
    let mx = 0.5;
    let my = 0.5;
    let targetMx = 0.5;
    let targetMy = 0.5;

    /** (Re)compute canvas pixel size based on wrapper size. */
    function resize() {
      if (!wrapper || !canvas || !ctx) return;
      const rect = wrapper.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;

      cellSize = isMobile() ? cfg.cellSizeMobile : cfg.cellSize;

      const pixelW = Math.max(1, Math.floor(rect.width * cfg.resolutionScale));
      const pixelH = Math.max(1, Math.floor(rect.height * cfg.resolutionScale));
      canvas.width = pixelW;
      canvas.height = pixelH;
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;

      // セルサイズは表示ピクセルベース。描画はcanvas座標系なので scale する
      const scaledCell = cellSize * cfg.resolutionScale;
      cw = scaledCell;
      ch = scaledCell * 1.6;
      cols = Math.max(1, Math.floor(pixelW / cw));
      rows = Math.max(1, Math.floor(pixelH / ch));

      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.font = `${Math.max(8, scaledCell * 1.35)}px "Courier New", monospace`;
    }

    function draw(now: number) {
      if (!ctx || !canvas) return;
      if (!visible) {
        rafId = requestAnimationFrame(draw);
        return;
      }
      if (now - lastFrame < frameInterval) {
        rafId = requestAnimationFrame(draw);
        return;
      }
      lastFrame = now;

      const t = (now - startTime) / 1000;

      // mouse smoothing
      if (cfg.mouseTracking) {
        mx += (targetMx - mx) * 0.08;
        my += (targetMy - my) * 0.08;
      } else {
        mx = 0.5;
        my = 0.5;
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (let y = 0; y < rows; y++) {
        const ny = (y + 0.5) / rows;
        const bayerRow = (y & 3) * 4;
        for (let x = 0; x < cols; x++) {
          const nx = (x + 0.5) / cols;
          let b = motif(nx, ny, t, mx, my);
          if (b <= 0) continue;
          // Bayer dither
          const threshold = (BAYER4[bayerRow + (x & 3)] / 16 - 0.5) * 0.25;
          b = b + threshold;
          if (b <= 0) continue;
          if (b > 1) b = 1;
          const charIdx = Math.floor(b * (CHARS.length - 1));
          if (charIdx <= 0) continue;
          const ch2 = CHARS[charIdx];
          // 線形アルファ [0.35, 0.95]。
          // エッジも最低 0.35 で確実に見せ、中心はほぼ baseColor を出す。
          const alpha = 0.35 + b * 0.6;
          ctx.fillStyle = `rgba(${baseR},${baseG},${baseB},${alpha.toFixed(3)})`;
          ctx.fillText(ch2, x * cw + cw / 2, y * ch + ch / 2);
        }
      }

      rafId = requestAnimationFrame(draw);
    }

    // --- Intersection observer for pausing off-screen ---
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          visible = e.isIntersecting;
        }
      },
      { threshold: cfg.visibilityThreshold },
    );
    io.observe(wrapper);

    // --- Resize observer ---
    const ro = new ResizeObserver(() => resize());
    ro.observe(wrapper);

    // --- Mouse tracking (hero only) ---
    function onPointerMove(e: PointerEvent) {
      if (!wrapper) return;
      const rect = wrapper.getBoundingClientRect();
      targetMx = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      targetMy = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));
    }
    function onPointerLeave() {
      targetMx = 0.5;
      targetMy = 0.5;
    }
    if (cfg.mouseTracking) {
      window.addEventListener("pointermove", onPointerMove);
      wrapper.addEventListener("pointerleave", onPointerLeave);
    }

    resize();
    startTime = performance.now();
    rafId = requestAnimationFrame(draw);

    return () => {
      if (rafId !== null) cancelAnimationFrame(rafId);
      io.disconnect();
      ro.disconnect();
      if (cfg.mouseTracking) {
        window.removeEventListener("pointermove", onPointerMove);
        wrapper.removeEventListener("pointerleave", onPointerLeave);
      }
    };
  }, [motif, color, mode]);

  return (
    <div
      ref={wrapperRef}
      className={className}
      style={style}
      aria-label={ariaLabel}
      role="img"
    >
      <canvas
        ref={canvasRef}
        style={{ display: "block", width: "100%", height: "100%" }}
      />
    </div>
  );
}
