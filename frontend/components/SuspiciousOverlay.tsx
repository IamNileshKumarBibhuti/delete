import { Eye } from "lucide-react";

export default function SuspiciousOverlay() {
  return (
    <div className="glass-card rounded-3xl p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-indigo-600 dark:text-indigo-300">Region Highlight</p>
          <h3 className="text-xl font-semibold mt-2">Suspicious regions</h3>
        </div>
        <Eye className="h-5 w-5 text-indigo-500" aria-hidden />
      </div>
      <div className="relative aspect-video rounded-2xl bg-slate-900/80 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(59,130,246,0.45),transparent_55%)]" />
        <div className="absolute inset-0 flex items-center justify-center text-white/80 text-sm">
          Mocked media preview
        </div>
        <div className="absolute top-[30%] left-[35%] h-24 w-28 border-2 border-rose-400 rounded-xl bg-rose-400/20" />
        <div className="absolute top-[55%] left-[55%] h-16 w-20 border-2 border-amber-300 rounded-xl bg-amber-300/20" />
      </div>
      <p className="text-sm text-slate-600 dark:text-slate-300 mt-4">
        Heatmap overlay flags inconsistent pixel patterns around facial landmarks and jawline edges.
      </p>
    </div>
  );
}
