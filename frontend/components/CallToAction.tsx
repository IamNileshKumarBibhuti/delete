import Link from "next/link";

export default function CallToAction() {
  return (
    <section className="mx-auto max-w-6xl px-6 pb-20">
      <div className="glass-card rounded-3xl p-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-indigo-600 dark:text-indigo-300">Ready to verify?</p>
          <h2 className="text-3xl font-semibold mt-3">Build trust with every frame.</h2>
          <p className="text-slate-600 dark:text-slate-300 mt-3">
            Start with a free demo or connect your team for enterprise-grade deepfake monitoring.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-4">
          <Link
            href="/upload"
            className="inline-flex items-center justify-center rounded-full bg-indigo-600 text-white px-6 py-3 text-sm font-semibold hover:bg-indigo-500"
          >
            Upload Media
          </Link>
          <Link
            href="/trust"
            className="inline-flex items-center justify-center rounded-full border border-indigo-200 dark:border-indigo-400/40 px-6 py-3 text-sm font-semibold text-indigo-700 dark:text-indigo-200"
          >
            Learn More
          </Link>
        </div>
      </div>
    </section>
  );
}
