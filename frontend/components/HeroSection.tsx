"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowUpRight, Shield, Timer, Video } from "lucide-react";

const stats = [
  {
    title: "99.2%",
    subtitle: "Detection Accuracy",
    icon: Shield,
  },
  {
    title: "2.8s",
    subtitle: "Average Scan Time",
    icon: Timer,
  },
  {
    title: "Image / Video",
    subtitle: "Supported Formats",
    icon: Video,
  },
];

export default function HeroSection() {
  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 bg-hero-gradient opacity-80" />
      <div className="relative mx-auto max-w-6xl px-6 py-20 lg:py-28">
        <div className="grid gap-12 lg:grid-cols-[1.1fr_0.9fr] items-center">
          <div className="space-y-6">
            <motion.span
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="inline-flex items-center gap-2 rounded-full bg-white/70 dark:bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-indigo-600 dark:text-indigo-300"
            >
              AI-Powered Verification
            </motion.span>
            <motion.h1
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-4xl md:text-5xl lg:text-6xl font-semibold leading-tight"
            >
              Detect Deepfakes in Seconds. Trust What You See.
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-lg text-slate-600 dark:text-slate-300"
            >
              DeepGuard combines state-of-the-art neural detection with human-friendly insights to protect
              your newsroom, brand, and community from synthetic media manipulation.
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="flex flex-col sm:flex-row gap-4"
            >
              <Link
                href="/upload"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-indigo-600 text-white px-6 py-3 text-sm font-semibold shadow-glow hover:bg-indigo-500 transition"
              >
                Upload Media
                <ArrowUpRight className="h-4 w-4" aria-hidden />
              </Link>
              <Link
                href="/results"
                className="inline-flex items-center justify-center gap-2 rounded-full border border-indigo-200 dark:border-indigo-400/40 px-6 py-3 text-sm font-semibold text-indigo-700 dark:text-indigo-200 hover:border-indigo-400 transition"
              >
                Try Demo
              </Link>
            </motion.div>
          </div>
          <div className="grid gap-6">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.title}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 + index * 0.1 }}
                className="glass-card gradient-border rounded-3xl p-6 flex items-center gap-4 shadow-xl"
              >
                <span className="h-12 w-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-500">
                  <stat.icon className="h-5 w-5" aria-hidden />
                </span>
                <div>
                  <p className="text-2xl font-semibold">{stat.title}</p>
                  <p className="text-sm text-slate-600 dark:text-slate-300">{stat.subtitle}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
