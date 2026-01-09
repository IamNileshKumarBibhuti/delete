"use client";

import {
  ResponsiveContainer,
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";
import { Download } from "lucide-react";

const confidenceData = [
  { metric: "Identity", score: 78 },
  { metric: "Lighting", score: 64 },
  { metric: "Artifacts", score: 92 },
  { metric: "Motion", score: 58 },
  { metric: "Audio", score: 71 },
];

const timelineData = [
  { frame: "00s", certainty: 72 },
  { frame: "03s", certainty: 85 },
  { frame: "06s", certainty: 91 },
  { frame: "09s", certainty: 79 },
  { frame: "12s", certainty: 88 },
];

export default function ChartsPanel() {
  return (
    <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
      <div className="glass-card rounded-3xl p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-indigo-600 dark:text-indigo-300">Confidence Score</p>
            <h3 className="text-xl font-semibold mt-2">Explainability Signals</h3>
          </div>
        </div>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={confidenceData} outerRadius="80%">
              <PolarGrid stroke="#CBD5F5" />
              <PolarAngleAxis dataKey="metric" stroke="#64748B" tick={{ fontSize: 12 }} />
              <Radar dataKey="score" stroke="#6366F1" fill="#6366F1" fillOpacity={0.6} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
        <p className="text-sm text-slate-600 dark:text-slate-300 mt-4">
          Highest anomaly concentration detected in artifact and identity alignment signals.
        </p>
      </div>
      <div className="glass-card rounded-3xl p-6 flex flex-col">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-indigo-600 dark:text-indigo-300">Model Certainty</p>
            <h3 className="text-xl font-semibold mt-2">Frame-by-frame analysis</h3>
          </div>
          <button
            type="button"
            className="inline-flex items-center gap-2 text-sm font-semibold text-indigo-600 dark:text-indigo-300"
          >
            <Download className="h-4 w-4" aria-hidden />
            Download Report
          </button>
        </div>
        <div className="h-56 mt-6">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={timelineData}>
              <XAxis dataKey="frame" stroke="#94A3B8" tick={{ fontSize: 12 }} />
              <YAxis stroke="#94A3B8" tick={{ fontSize: 12 }} />
              <Tooltip
                contentStyle={{
                  background: "rgba(15, 23, 42, 0.85)",
                  borderRadius: "12px",
                  border: "none",
                  color: "white",
                }}
              />
              <Line type="monotone" dataKey="certainty" stroke="#22C55E" strokeWidth={3} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-6 rounded-2xl bg-white/70 dark:bg-white/10 p-4 text-sm text-slate-600 dark:text-slate-300">
          Suspicious regions are highlighted in the preview overlay to support rapid editorial decisions.
        </div>
      </div>
    </div>
  );
}
