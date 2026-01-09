import { Brain, Lock, Sparkles, UploadCloud } from "lucide-react";

const features = [
  {
    title: "Multi-modal Detection",
    description: "Analyze images, video clips, and audio overlays with a unified neural pipeline.",
    icon: Brain,
  },
  {
    title: "Secure by Design",
    description: "Encrypted uploads, automated redaction, and audit trails for compliance teams.",
    icon: Lock,
  },
  {
    title: "Instant Uploads",
    description: "Drag, drop, and scan content in seconds with optimized GPU processing.",
    icon: UploadCloud,
  },
  {
    title: "Human-Friendly Insights",
    description: "Explainability layers translate model signals into clear, actionable guidance.",
    icon: Sparkles,
  },
];

export default function FeatureHighlights() {
  return (
    <section className="mx-auto max-w-6xl px-6 py-16">
      <div className="text-center max-w-2xl mx-auto">
        <p className="text-sm uppercase tracking-[0.2em] text-indigo-600 dark:text-indigo-300">Why DeepGuard</p>
        <h2 className="text-3xl md:text-4xl font-semibold mt-3">Designed for trust, built for speed.</h2>
        <p className="text-slate-600 dark:text-slate-300 mt-4">
          Deliver reliable verification workflows for editorial teams, security analysts, and customer
          support with AI that is transparent and easy to explain.
        </p>
      </div>
      <div className="grid gap-6 mt-12 md:grid-cols-2">
        {features.map((feature) => (
          <div key={feature.title} className="glass-card rounded-3xl p-6 flex gap-4 hover:shadow-glow transition">
            <div className="h-12 w-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-500">
              <feature.icon className="h-5 w-5" aria-hidden />
            </div>
            <div>
              <h3 className="text-lg font-semibold">{feature.title}</h3>
              <p className="text-sm text-slate-600 dark:text-slate-300 mt-2">{feature.description}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
