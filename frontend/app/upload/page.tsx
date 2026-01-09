import AssistantWidget from "../../components/AssistantWidget";
import ResultCard from "../../components/ResultCard";
import UploadPanel from "../../components/UploadPanel";

export default function UploadPage() {
  return (
    <div className="mx-auto max-w-6xl px-6 py-16 space-y-10">
      <div>
        <p className="text-sm uppercase tracking-[0.2em] text-indigo-600 dark:text-indigo-300">Upload & Detect</p>
        <h1 className="text-3xl md:text-4xl font-semibold mt-3">Analyze media in minutes</h1>
        <p className="text-slate-600 dark:text-slate-300 mt-3 max-w-2xl">
          Drop your media for a secure deepfake scan. DeepGuard will generate a full report with confidence
          scores and visual explanations.
        </p>
      </div>
      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <UploadPanel />
        <ResultCard />
      </div>
      <AssistantWidget />
    </div>
  );
}
