import { ShieldCheck } from "lucide-react";

export default function Footer() {
  return (
    <footer className="border-t border-white/10 bg-white/40 dark:bg-black/30">
      <div className="mx-auto max-w-6xl px-6 py-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-center gap-3">
          <span className="p-2 rounded-xl bg-indigo-500/20 text-indigo-600 dark:text-indigo-300">
            <ShieldCheck className="h-5 w-5" aria-hidden />
          </span>
          <div>
            <p className="font-semibold">DeepGuard</p>
            <p className="text-sm text-slate-600 dark:text-slate-300">Secure media authenticity with AI you can trust.</p>
          </div>
        </div>
        <div className="text-sm text-slate-600 dark:text-slate-400">
          <p>Privacy-first. SOC2-ready infrastructure. Built for teams worldwide.</p>
          <p className="mt-1">© 2024 DeepGuard. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
