import { AlertTriangle, BadgeCheck, ShieldAlert } from "lucide-react";

const result = {
  probability: 87,
  verdict: "Likely Deepfake",
  confidence: 0.91,
  explanation:
    "The model detected irregular eye reflections and inconsistent facial warping across frames. These anomalies align with common generative artifacts.",
};

export default function ResultCard() {
  return (
    <div className="glass-card rounded-3xl p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-indigo-600 dark:text-indigo-300">Detection Result</p>
          <h3 className="text-2xl font-semibold mt-2">{result.verdict}</h3>
        </div>
        <div className="h-12 w-12 rounded-2xl bg-rose-500/10 flex items-center justify-center text-rose-500">
          <ShieldAlert className="h-5 w-5" aria-hidden />
        </div>
      </div>
      <div className="flex flex-col sm:flex-row gap-6">
        <div className="flex-1 space-y-2">
          <p className="text-sm text-slate-600 dark:text-slate-300">Deepfake Probability</p>
          <p className="text-4xl font-semibold text-rose-500">{result.probability}%</p>
        </div>
        <div className="flex-1 space-y-2">
          <p className="text-sm text-slate-600 dark:text-slate-300">Confidence Meter</p>
          <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-white/10 overflow-hidden">
            <div className="h-full bg-emerald-500" style={{ width: `${result.confidence * 100}%` }} />
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
            <BadgeCheck className="h-4 w-4 text-emerald-500" aria-hidden />
            {(result.confidence * 100).toFixed(0)}% model certainty
          </div>
        </div>
      </div>
      <div className="rounded-2xl bg-white/70 dark:bg-white/10 p-4 text-sm text-slate-700 dark:text-slate-200 flex gap-3">
        <AlertTriangle className="h-5 w-5 text-amber-400" aria-hidden />
        <p>{result.explanation}</p>
      </div>
    </div>
  );
}
