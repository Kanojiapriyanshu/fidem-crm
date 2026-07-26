"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { AlertCircle, ArrowLeft, Home, Search } from "lucide-react";

type NotFoundScreenProps = {
  title: string;
  message: string;
  primaryHref: string;
  primaryLabel: string;
  secondaryHref?: string;
  secondaryLabel?: string;
  badge?: string;
};

export default function NotFoundScreen({
  title,
  message,
  primaryHref,
  primaryLabel,
  secondaryHref = "/",
  secondaryLabel = "Go Home",
  badge = "404 Error",
}: NotFoundScreenProps) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 text-white">
      {/* Background glow */}
      <div className="absolute inset-0">
        <div className="absolute left-1/2 top-[-120px] h-[320px] w-[320px] -translate-x-1/2 rounded-full bg-blue-500/20 blur-3xl" />
        <div className="absolute bottom-[-80px] right-[-40px] h-[260px] w-[260px] rounded-full bg-cyan-400/10 blur-3xl" />
        <div className="absolute left-[-40px] top-[60%] h-[220px] w-[220px] rounded-full bg-fuchsia-500/10 blur-3xl" />
      </div>

      {/* Grid overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-[size:32px_32px]" />

      <div className="relative z-10 flex min-h-screen items-center justify-center px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="w-full max-w-3xl"
        >
          <div className="rounded-3xl border border-white/10 bg-white/8 p-8 shadow-2xl backdrop-blur-xl md:p-12">
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.05 }}
              className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-4 py-2 text-sm font-medium text-white/90"
            >
              <AlertCircle className="h-4 w-4 text-red-400" />
              {badge}
            </motion.div>

            {/* Icon + 404 */}
            <div className="flex flex-col items-center text-center">
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
                className="mb-6 flex h-24 w-24 items-center justify-center rounded-3xl border border-red-400/20 bg-red-500/10 shadow-lg shadow-red-500/10"
              >
                <AlertCircle className="h-12 w-12 text-red-400" />
              </motion.div>

              <motion.h1
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 220, damping: 18 }}
                className="mb-2 text-7xl font-black tracking-tight text-white md:text-8xl"
              >
                404
              </motion.h1>

              <h2 className="mb-4 text-2xl font-bold text-white md:text-3xl">
                {title}
              </h2>

              <p className="mb-8 max-w-xl text-base leading-7 text-slate-300 md:text-lg">
                {message}
              </p>

              {/* Action buttons */}
              <div className="flex flex-col items-center gap-4 sm:flex-row">
                <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                  <Link
                    href={primaryHref}
                    className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white shadow-lg shadow-blue-500/25 transition hover:bg-blue-500"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    {primaryLabel}
                  </Link>
                </motion.div>

                <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                  <Link
                    href={secondaryHref}
                    className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-6 py-3 font-semibold text-white/90 transition hover:bg-white/10"
                  >
                    <Home className="h-4 w-4" />
                    {secondaryLabel}
                  </Link>
                </motion.div>
              </div>

              {/* Small hint card */}
              <motion.div
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="mt-8 w-full max-w-lg rounded-2xl border border-white/10 bg-slate-900/40 p-4 text-left"
              >
                <div className="flex items-start gap-3">
                  <div className="rounded-xl bg-white/10 p-2">
                    <Search className="h-5 w-5 text-cyan-300" />
                  </div>
                  <div>
                    <p className="font-semibold text-white">Try one of these</p>
                    <p className="mt-1 text-sm leading-6 text-slate-300">
                      Check the URL, go back to your dashboard, or return to the
                      homepage and continue from there.
                    </p>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}