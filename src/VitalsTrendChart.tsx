import { useState } from "react";
import type { NursingRecord, VitalSigns } from "./types";
import "./VitalsTrendChart.css";

type VitalField = keyof VitalSigns;
type MetricId = "T" | "P" | "R" | "BP" | "SPO2";

type MetricSeries = {
  key: VitalField;
  label: string;
  color: string;
};

type MetricConfig = {
  label: string;
  unit: string;
  decimals: number;
  series: MetricSeries[];
};

const METRICS: Record<MetricId, MetricConfig> = {
  T: {
    label: "体温",
    unit: "℃",
    decimals: 1,
    series: [{ key: "T", label: "体温", color: "#0066cc" }],
  },
  P: {
    label: "脈拍",
    unit: "回/分",
    decimals: 0,
    series: [{ key: "P", label: "脈拍", color: "#0066cc" }],
  },
  R: {
    label: "呼吸数",
    unit: "回/分",
    decimals: 0,
    series: [{ key: "R", label: "呼吸数", color: "#0066cc" }],
  },
  BP: {
    label: "血圧",
    unit: "mmHg",
    decimals: 0,
    series: [
      { key: "SBP", label: "収縮期", color: "#0066cc" },
      { key: "DBP", label: "拡張期", color: "#e4572e" },
    ],
  },
  SPO2: {
    label: "SpO2",
    unit: "%",
    decimals: 0,
    series: [{ key: "SPO2", label: "SpO2", color: "#0066cc" }],
  },
};

const isFiniteNumber = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value);

const formatNumber = (value: number, decimals: number) =>
  value.toFixed(decimals);

type VitalsTrendChartProps = {
  records: NursingRecord[];
};

export default function VitalsTrendChart({
  records,
}: VitalsTrendChartProps) {
  const [selectedMetric, setSelectedMetric] = useState<MetricId>("T");
  const metric = METRICS[selectedMetric];
  const orderedRecords = [...records].sort(
    (a, b) => a.date.localeCompare(b.date) || a.id.localeCompare(b.id),
  );
  const plottedRecords = orderedRecords.filter((record) =>
    metric.series.some((series) =>
      isFiniteNumber(record.vitals?.[series.key]),
    ),
  );
  const values = plottedRecords.flatMap((record) =>
    metric.series
      .map((series) => record.vitals?.[series.key])
      .filter(isFiniteNumber),
  );

  const width = 720;
  const height = 320;
  const margin = { top: 24, right: 24, bottom: 52, left: 68 };
  const plotWidth = width - margin.left - margin.right;
  const plotHeight = height - margin.top - margin.bottom;
  const rawMin = Math.min(...values);
  const rawMax = Math.max(...values);
  const rawRange = rawMax - rawMin;
  const padding = rawRange === 0 ? Math.max(Math.abs(rawMax) * 0.05, 1) : rawRange * 0.12;
  const minValue = rawMin - padding;
  const maxValue = rawMax + padding;
  const xForIndex = (index: number) =>
    plottedRecords.length === 1
      ? margin.left + plotWidth / 2
      : margin.left + (index / (plottedRecords.length - 1)) * plotWidth;
  const yForValue = (value: number) =>
    margin.top + ((maxValue - value) / (maxValue - minValue)) * plotHeight;
  const tickValues = Array.from(
    { length: 5 },
    (_, index) => maxValue - ((maxValue - minValue) * index) / 4,
  );
  const dateLabelIndexes = [
    ...new Set([
      0,
      Math.floor((plottedRecords.length - 1) / 2),
      plottedRecords.length - 1,
    ]),
  ];

  return (
    <section className="vitals-trend card" aria-labelledby="vitals-trend-title">
      <div className="vitals-trend-header">
        <div>
          <h2 id="vitals-trend-title">バイタル推移</h2>
          <p className="vitals-trend-description">
            記録された数値を日付順に表示します。医学的な判定は行いません。
          </p>
        </div>
        <div className="vitals-trend-control">
          <label htmlFor="vitals-metric" className="form-label">
            表示する項目
          </label>
          <select
            id="vitals-metric"
            value={selectedMetric}
            onChange={(event) =>
              setSelectedMetric(event.target.value as MetricId)
            }
          >
            <option value="T">体温</option>
            <option value="P">脈拍</option>
            <option value="R">呼吸数</option>
            <option value="BP">血圧</option>
            <option value="SPO2">SpO2</option>
          </select>
        </div>
      </div>

      {plottedRecords.length === 0 ? (
        <p className="vitals-trend-empty" role="status">
          {metric.label}の記録はありません。
        </p>
      ) : (
        <>
          <div className="vitals-trend-legend" aria-label="グラフの凡例">
            {metric.series.map((series) => (
              <span className="vitals-trend-legend-item" key={series.key}>
                <span
                  className="vitals-trend-legend-swatch"
                  style={{ backgroundColor: series.color }}
                  aria-hidden="true"
                />
                {series.label}
              </span>
            ))}
            <span className="vitals-trend-unit">{metric.unit}</span>
          </div>

          <div className="vitals-trend-chart-scroll">
            <svg
              className="vitals-trend-chart"
              viewBox={`0 0 ${width} ${height}`}
              role="img"
              aria-label={`${metric.label}の時系列グラフ`}
            >
              <title>{metric.label}の推移</title>
              <desc>
                {plottedRecords.length}件の記録を古い日付から順に表示しています。
              </desc>

              {tickValues.map((tick, index) => {
                const y = margin.top + (index / 4) * plotHeight;
                return (
                  <g key={index}>
                    <line
                      x1={margin.left}
                      x2={width - margin.right}
                      y1={y}
                      y2={y}
                      className="vitals-trend-grid-line"
                    />
                    <text
                      x={margin.left - 10}
                      y={y + 4}
                      textAnchor="end"
                      className="vitals-trend-axis-label"
                    >
                      {formatNumber(tick, metric.decimals)}
                    </text>
                  </g>
                );
              })}

              <line
                x1={margin.left}
                x2={margin.left}
                y1={margin.top}
                y2={height - margin.bottom}
                className="vitals-trend-axis-line"
              />
              <line
                x1={margin.left}
                x2={width - margin.right}
                y1={height - margin.bottom}
                y2={height - margin.bottom}
                className="vitals-trend-axis-line"
              />

              {dateLabelIndexes.map((index) => (
                <text
                  key={index}
                  x={xForIndex(index)}
                  y={height - margin.bottom + 26}
                  textAnchor="middle"
                  className="vitals-trend-axis-label"
                >
                  {plottedRecords[index].date}
                </text>
              ))}

              {metric.series.map((series) => {
                const points = plottedRecords.flatMap((record, index) => {
                  const value = record.vitals?.[series.key];
                  if (!isFiniteNumber(value)) return [];
                  return [{
                    x: xForIndex(index),
                    y: yForValue(value),
                    value,
                    date: record.date,
                  }];
                });

                return (
                  <g key={series.key}>
                    {points.length > 1 && (
                      <polyline
                        points={points.map((point) => `${point.x},${point.y}`).join(" ")}
                        fill="none"
                        stroke={series.color}
                        strokeWidth="3"
                        strokeLinejoin="round"
                        strokeLinecap="round"
                      />
                    )}
                    {points.map((point, index) => (
                      <circle
                        key={`${series.key}-${point.date}-${index}`}
                        cx={point.x}
                        cy={point.y}
                        r="5"
                        fill={series.color}
                        stroke="white"
                        strokeWidth="2"
                      >
                        <title>
                          {point.date}: {series.label}{" "}
                          {formatNumber(point.value, metric.decimals)}
                          {metric.unit}
                        </title>
                      </circle>
                    ))}
                  </g>
                );
              })}
            </svg>
          </div>
        </>
      )}
    </section>
  );
}
