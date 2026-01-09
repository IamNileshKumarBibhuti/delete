"use client";

import Link from "next/link";
import { ShieldCheck, Sparkles } from "lucide-react";
import ThemeToggle from "./ThemeToggle";
import { motion } from "framer-motion";

const navItems = [
  { href: "/", label: "Home" },
  { href: "/upload", label: "Upload" },
  { href: "/results", label: "Results" },
  { href: "/trust", label: "Trust & Education" },
];

export default function Navbar() {
  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="sticky top-0 z-50 backdrop-blur-lg bg-white/60 dark:bg-black/30 border-b border-white/20"
    >
      <nav className="mx-auto max-w-6xl px-6 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 font-semibold text-lg">
          <span className="p-2 rounded-xl bg-indigo-500/20 text-indigo-600 dark:text-indigo-300">
            <ShieldCheck className="h-5 w-5" aria-hidden />
          </span>
          DeepGuard
          <Sparkles className="h-4 w-4 text-emerald-400" aria-hidden />
        </Link>
        <div className="hidden md:flex items-center gap-6 text-sm font-medium">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-slate-600 dark:text-slate-200 hover:text-indigo-500 dark:hover:text-indigo-300 transition"
            >
              {item.label}
            </Link>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/upload"
            className="hidden sm:inline-flex items-center gap-2 rounded-full bg-indigo-600 text-white px-4 py-2 text-sm shadow-glow hover:bg-indigo-500 transition"
          >
            Get Started
          </Link>
          <ThemeToggle />
        </div>
      </nav>
    </motion.header>
  );
}
