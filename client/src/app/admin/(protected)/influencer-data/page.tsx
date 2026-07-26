"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import YoutubeHandlePanel from "../../components/YoutubeHandlePanel";
import ModashDataPanel from "../../components/ModashDataPanel";
import YoutubePage from "../youtube/Youtube";

type Tab = "youtube" | "modash";

export default function InfluencerDataPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const tab = useMemo<Tab>(() => {
    const t = searchParams.get("tab");
    return t === "modash" ? "modash" : "youtube";
  }, [searchParams]);

  const [mounted, setMounted] = useState<{ youtube: boolean; modash: boolean }>({
    youtube: tab === "youtube",
    modash: tab === "modash",
  });

  useEffect(() => {
    setMounted((m) => ({ ...m, [tab]: true }));
  }, [tab]);

  const setTab = (next: Tab) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", next);
    router.replace(`?${params.toString()}`, { scroll: false });
  };

  const btnBase = "px-4 py-2 rounded-lg text-sm font-semibold transition";
  const btnActive = "bg-teal-600 text-white";
  const btnInactive =
    "bg-white text-black/80 border border-black/10 hover:bg-teal-600 hover:text-white";

  return (
    <div className="p-4 md:p-6">
      {/* Heading + Toggle */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 text-center">
          Influencer Data
        </h1>

        {/* Centered Toggle */}
        <div className="mt-5 flex justify-center">
          <div className="flex gap-2 p-1 rounded-lg bg-white border border-black/10">
            <button
              type="button"
              className={`${btnBase} ${tab === "youtube" ? btnActive : btnInactive}`}
              onClick={() => setTab("youtube")}
            >
              Youtube Handle
            </button>
            <button
              type="button"
              className={`${btnBase} ${tab === "modash" ? btnActive : btnInactive}`}
              onClick={() => setTab("modash")}
            >
              Modash Data
            </button>
          </div>
        </div>
      </div>

      {/* Panels */}
      {mounted.youtube && (
        <div className={tab === "youtube" ? "block" : "hidden"}>
          <YoutubePage />
        </div>
      )}

      {mounted.modash && (
        <div className={tab === "modash" ? "block" : "hidden"}>
          <ModashDataPanel />
        </div>
      )}
    </div>
  );
}