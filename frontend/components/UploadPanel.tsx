"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import { FileVideo, ImagePlus, Loader2, UploadCloud } from "lucide-react";

export default function UploadPanel() {
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<"idle" | "uploading" | "analyzing" | "done">("idle");

  const startUpload = () => {
    setStatus("uploading");
    setProgress(0);
    const timer = setInterval(() => {
      setProgress((prev) => {
        const next = prev + 10;
        if (next >= 100) {
          clearInterval(timer);
          setStatus("analyzing");
          setTimeout(() => {
            setStatus("done");
          }, 2000);
        }
        return Math.min(next, 100);
      });
    }, 200);
  };

  return (
    <div className="glass-card rounded-3xl p-8 space-y-6">
      <div>
        <p className="text-sm uppercase tracking-[0.2em] text-indigo-600 dark:text-indigo-300">Upload & Detect</p>
        <h2 className="text-2xl font-semibold mt-2">Drag & drop your media</h2>
        <p className="text-sm text-slate-600 dark:text-slate-300 mt-2">
          Supported formats: JPG, PNG, MP4, MOV. Your files are encrypted at rest.
        </p>
      </div>
      <div className="border-2 border-dashed border-indigo-300/60 dark:border-indigo-400/40 rounded-3xl p-8 text-center space-y-4">
        <UploadCloud className="h-10 w-10 text-indigo-500 mx-auto" aria-hidden />
        <p className="text-sm text-slate-600 dark:text-slate-300">Drop your file here or browse to upload</p>
        <div className="flex flex-col sm:flex-row justify-center gap-3">
          <button
            type="button"
            onClick={startUpload}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-indigo-600 text-white px-5 py-2 text-sm font-semibold hover:bg-indigo-500"
          >
            <ImagePlus className="h-4 w-4" aria-hidden />
            Upload Image
          </button>
          <button
            type="button"
            onClick={startUpload}
            className="inline-flex items-center justify-center gap-2 rounded-full border border-indigo-200 dark:border-indigo-400/40 px-5 py-2 text-sm font-semibold text-indigo-700 dark:text-indigo-200"
          >
            <FileVideo className="h-4 w-4" aria-hidden />
            Upload Video
          </button>
        </div>
      </div>
      <div className="space-y-3">
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-600 dark:text-slate-300">Upload Progress</span>
          <span className="font-semibold text-indigo-600 dark:text-indigo-300">{progress}%</span>
        </div>
        <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-white/10 overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            className="h-full bg-indigo-500"
          />
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
          {status === "idle" && "Awaiting upload..."}
          {status === "uploading" && "Uploading securely..."}
          {status === "analyzing" && (
            <span className="inline-flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              Analyzing with DeepGuard AI
            </span>
          )}
          {status === "done" && "Analysis complete. View your results below."}
        </div>
      </div>
    </div>
  );
}
