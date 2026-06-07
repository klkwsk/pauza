"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Entry, Mood } from "@/lib/types";
import { MoodFace } from "@/components/mood-faces";
import { ChevronLeftIcon, ChevronRightIcon } from "@/components/icons";
import { RangeTabs } from "@/components/range-tabs";
import {
  hasNextPeriod,
  moodSeries,
  periodLabel,
  type MoodRange,
} from "@/lib/stats";

const HEIGHT = 240;
const FACE = 18; // rozmiar ikony nastroju na osi Y
const PAD = { top: 16, right: 16, bottom: 28, left: 34 };

interface MoodChartProps {
  entries: Entry[];
}

export function MoodChart({ entries }: MoodChartProps) {
  const [range, setRange] = useState<MoodRange>("week");
  // 0 = bieżący okres, -1 = poprzedni, itd. Zerowany przy zmianie zakresu.
  const [offset, setOffset] = useState(0);
  const wrapRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(600);

  // Mierzymy realną szerokość kontenera, by słupki leżały w pikselach
  // (uniknięcie zniekształcenia przez skalowanie viewBox).
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect.width;
      if (w) setWidth(w);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const points = useMemo(
    () => moodSeries(entries, range, offset),
    [entries, range, offset]
  );
  const hasData = points.some((p) => p.value != null);
  const canGoNext = hasNextPeriod(offset);

  const innerW = Math.max(0, width - PAD.left - PAD.right);
  const innerH = HEIGHT - PAD.top - PAD.bottom;
  const baseY = PAD.top + innerH;

  // Skala 0–5: baseline (0) na dole, 5 na górze — słupek nastroju 1 wciąż widoczny.
  const y = (v: number) => baseY - (v / 5) * innerH;

  // Każdy kubełek dostaje slot; słupek to ~60% slotu, wyśrodkowany.
  const slot = points.length > 0 ? innerW / points.length : innerW;
  const barW = Math.min(36, slot * 0.6);
  const center = (i: number) => PAD.left + slot * (i + 0.5);

  // Ile etykiet osi X pokazać, żeby się nie zlewały (głównie widok miesiąca).
  const labelStep = points.length > 12 ? Math.ceil(points.length / 8) : 1;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-heading text-base font-normal">Nastrój</h2>
        <RangeTabs
          value={range}
          onChange={(r) => {
            setRange(r);
            setOffset(0);
          }}
        />
      </div>

      {/* Nawigacja okresów + nagłówek aktualnego okresu */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => setOffset((o) => o - 1)}
          aria-label="Poprzedni okres"
          className="flex size-8 cursor-pointer items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <ChevronLeftIcon className="size-5" />
        </button>
        <span className="text-sm font-medium first-letter:uppercase">
          {periodLabel(range, offset)}
        </span>
        <button
          type="button"
          onClick={() => setOffset((o) => Math.min(0, o + 1))}
          disabled={!canGoNext}
          aria-label="Następny okres"
          className="flex size-8 cursor-pointer items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:pointer-events-none disabled:opacity-30"
        >
          <ChevronRightIcon className="size-5" />
        </button>
      </div>

      <div ref={wrapRef} className="relative w-full">
        {hasData ? (
          <svg width={width} height={HEIGHT} role="img" aria-label="Wykres nastroju">
            {/* Linie pomocnicze + ikony nastroju osi Y dla wartości 1–5 */}
            {([1, 2, 3, 4, 5] as Mood[]).map((v) => (
              <g key={v}>
                <line
                  x1={PAD.left}
                  x2={width - PAD.right}
                  y1={y(v)}
                  y2={y(v)}
                  stroke="var(--border)"
                  strokeWidth={1}
                />
                <MoodFace
                  mood={v}
                  x={PAD.left - FACE - 8}
                  y={y(v) - FACE / 2}
                  width={FACE}
                  height={FACE}
                  className="text-muted-foreground"
                />
              </g>
            ))}

            {/* Słupki nastroju — brak wpisu = brak słupka */}
            {points.map((p, i) => {
              if (p.value == null) return null;
              const h = baseY - y(p.value);
              const r = Math.min(barW / 2, 5);
              return (
                <rect
                  key={p.key}
                  x={center(i) - barW / 2}
                  y={y(p.value)}
                  width={barW}
                  height={h}
                  rx={r}
                  ry={r}
                  fill="var(--primary)"
                >
                  <title>{`${p.label}: ${p.value.toFixed(1)}`}</title>
                </rect>
              );
            })}

            {/* Etykiety osi X */}
            {points.map((p, i) =>
              i % labelStep === 0 ? (
                <text
                  key={`x${p.key}`}
                  x={center(i)}
                  y={HEIGHT - 8}
                  textAnchor="middle"
                  fontSize={11}
                  fill="var(--muted-foreground)"
                >
                  {p.label}
                </text>
              ) : null
            )}
          </svg>
        ) : (
          <div
            className="flex items-center justify-center text-sm text-muted-foreground"
            style={{ height: HEIGHT }}
          >
            Brak ocen nastroju w tym okresie.
          </div>
        )}
      </div>
    </div>
  );
}
