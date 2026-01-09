import AssistantWidget from "../../components/AssistantWidget";
import ChartsPanel from "../../components/ChartsPanel";
import ResultCard from "../../components/ResultCard";
import SuspiciousOverlay from "../../components/SuspiciousOverlay";

export default function ResultsPage() {
  return (
    <div className="mx-auto max-w-6xl px-6 py-16 space-y-10">
      <div>
        <p className="text-sm uppercase tracking-[0.2em] text-indigo-600 dark:text-indigo-300">Results Visualization</p>
        <h1 className="text-3xl md:text-4xl font-semibold mt-3">Deepfake analysis dashboard</h1>
        <p className="text-slate-600 dark:text-slate-300 mt-3 max-w-2xl">
          Explore model certainty, confidence signals, and suspicious region overlays to make fast, informed
          decisions.
        </p>
      </div>
      <ResultCard />
      <ChartsPanel />
      <SuspiciousOverlay />
      <AssistantWidget />
    </div>
  );
}
