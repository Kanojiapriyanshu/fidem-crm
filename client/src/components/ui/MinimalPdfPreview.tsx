"use client";

import { useEffect, useRef, useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";

pdfjs.GlobalWorkerOptions.workerSrc =
  `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

const options = {
  standardFontDataUrl: `https://unpkg.com/pdfjs-dist@${pdfjs.version}/standard_fonts/`,
};

type MinimalPdfPreviewProps = {
  file: Blob;
};

export default function MinimalPdfPreview({ file }: MinimalPdfPreviewProps) {
  const [numPages, setNumPages] = useState(0);
  const [pageWidth, setPageWidth] = useState(720);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const update = () => {
      const nextWidth = Math.max(320, Math.min(el.clientWidth, 1200));
      setPageWidth(nextWidth);
    };

    update();

    const observer = new ResizeObserver(update);
    observer.observe(el);

    return () => observer.disconnect();
  }, []);

  return (
    <div className="h-full w-full overflow-auto bg-[#FFF9E6] p-6">
      <div
        ref={containerRef}
        className="max-w-7xl w-full overflow-auto mx-auto rounded-xl border border-neutral-200"
      >
        <Document
          file={file}
          options={options}
          onLoadSuccess={({ numPages }) => setNumPages(numPages)}
          onSourceError={(error) => {
            console.error("PDF source error:", error);
          }}
          onLoadError={(error) => {
            console.error("PDF load error:", error);
          }}
          loading={
            <div className="py-10 text-center text-sm text-neutral-500">
              Loading PDF...
            </div>
          }
          error={
            <div className="py-10 text-center text-sm text-red-500">
              Failed to load PDF. Check console for the exact error.
            </div>
          }
        >
          <div className="w-full flex flex-col items-center">
            {Array.from({ length: numPages }, (_, index) => (
              <div
                key={index}
                className="w-full overflow-hidden rounded-sm bg-white shadow-[0_8px_30px_rgba(0,0,0,0.08)]"
              >
                <Page
                  pageNumber={index + 1}
                  width={pageWidth}
                  renderTextLayer={false}
                  renderAnnotationLayer={false}
                />
              </div>
            ))}
          </div>
        </Document>
      </div>
    </div>
  );
}