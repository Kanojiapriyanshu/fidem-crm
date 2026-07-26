import { Suspense } from "react";
import YoutubeInsightReportPageClient from "./YoutubeInsightReportPageClient";

function ReportPageFallback() {
  return (
    <main className="min-h-screen bg-white">
      <div className="mx-auto flex min-h-screen max-w-6xl items-center justify-center px-6">
        <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <h1 className="text-xl font-bold text-slate-950">Loading YouTube Insight</h1>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            Please wait while we prepare the report.
          </p>
        </div>
      </div>
    </main>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<ReportPageFallback />}>
      <YoutubeInsightReportPageClient />
    </Suspense>
  );
}