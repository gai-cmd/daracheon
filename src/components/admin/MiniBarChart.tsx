'use client';

import { useState } from 'react';

interface DataPoint {
  label: string;
  value: number;
}

interface MiniBarChartProps {
  data: DataPoint[];
  color?: string;
  title?: string;
  unit?: string;
}

const BAR_WIDTH = 28;
const BAR_GAP = 8;
const CHART_HEIGHT = 80;
const PADDING_TOP = 8;
const PADDING_BOTTOM = 24;
const PADDING_X = 4;

export default function MiniBarChart({
  data,
  color = '#b5892a',
  title,
  unit = '건',
}: MiniBarChartProps) {
  const [tooltip, setTooltip] = useState<{ x: number; y: number; item: DataPoint } | null>(null);

  const maxValue = Math.max(...data.map((d) => d.value), 1);
  const svgWidth = data.length * (BAR_WIDTH + BAR_GAP) - BAR_GAP + PADDING_X * 2;
  const svgHeight = CHART_HEIGHT + PADDING_TOP + PADDING_BOTTOM;

  return (
    <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
      {title && (
        <h3 className="font-serif text-lg font-semibold text-gray-900 mb-4">{title}</h3>
      )}

      <div className="relative select-none">
        <svg
          width="100%"
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="overflow-visible"
          onMouseLeave={() => setTooltip(null)}
        >
          {data.map((item, i) => {
            const barH = Math.max((item.value / maxValue) * CHART_HEIGHT, item.value > 0 ? 4 : 0);
            const x = PADDING_X + i * (BAR_WIDTH + BAR_GAP);
            const y = PADDING_TOP + (CHART_HEIGHT - barH);
            const cx = x + BAR_WIDTH / 2;

            return (
              <g key={item.label}>
                {/* Background track */}
                <rect
                  x={x}
                  y={PADDING_TOP}
                  width={BAR_WIDTH}
                  height={CHART_HEIGHT}
                  rx={4}
                  fill="#f3f4f6"
                />
                {/* Value bar */}
                <rect
                  x={x}
                  y={y}
                  width={BAR_WIDTH}
                  height={barH}
                  rx={4}
                  fill={color}
                  opacity={0.85}
                  className="transition-all duration-300"
                  onMouseEnter={(e) => {
                    const svgEl = (e.target as SVGElement).closest('svg') as SVGSVGElement;
                    const rect = svgEl.getBoundingClientRect();
                    const vbWidth = svgWidth;
                    const vbHeight = svgHeight;
                    const scaleX = rect.width / vbWidth;
                    const scaleY = rect.height / vbHeight;
                    setTooltip({
                      x: (cx) * scaleX,
                      y: (y - 4) * scaleY,
                      item,
                    });
                  }}
                  onMouseLeave={() => setTooltip(null)}
                  style={{ cursor: 'default' }}
                />
                {/* Label */}
                <text
                  x={cx}
                  y={PADDING_TOP + CHART_HEIGHT + 14}
                  textAnchor="middle"
                  fontSize="9"
                  fill="#9ca3af"
                  fontFamily="inherit"
                >
                  {item.label}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Tooltip */}
        {tooltip && (
          <div
            className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full rounded-lg bg-gray-900 px-2.5 py-1.5 text-xs font-medium text-white shadow-lg whitespace-nowrap"
            style={{
              left: tooltip.x,
              top: tooltip.y - 4,
            }}
          >
            {tooltip.item.label}: {tooltip.item.value.toLocaleString()}{unit}
            <div className="absolute left-1/2 top-full -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
          </div>
        )}
      </div>
    </div>
  );
}
