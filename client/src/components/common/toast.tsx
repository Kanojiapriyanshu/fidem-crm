"use client";

import React from "react";
import Swal from "sweetalert2";
import "sweetalert2/dist/sweetalert2.css";

export type ToastIcon = "success" | "error" | "warning" | "info";

export type ToastOptions = {
    icon: ToastIcon;
    title: string;
    text?: string;
    timer?: number;
};

const THEME: Record<
    ToastIcon,
    { bg: string; border: string; title: string; text: string }
> = {
    error: {
        bg: "rgba(252, 238, 236, 0.50)",
        border: "rgba(252, 238, 236, 0.50)",
        title: "#191919",
        text: "#8B8B8B",
    },
    warning: {
        bg: "#FFEDE5",
        border: "#FFF7F3",
        title: "#191919",
        text: "#8B8B8B",
    },
    success: {
        bg: "#EAF6EC",
        border: "#BCE4C5",
        title: "#191919",
        text: "#8B8B8B",
    },
    info: {
        bg: "#E3F2FD",
        border: "#D4E7FF",
        title: "#191919",
        text: "#8B8B8B",
    },
};

const ICONS: Record<ToastIcon, string> = {
    error: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
    <path d="M15 9L9 15" stroke="#E35141" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M9 9L15 15" stroke="#E35141" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M12 21C16.9706 21 21 16.9706 21 12C21 7.02944 16.9706 3 12 3C7.02944 3 3 7.02944 3 12C3 16.9706 7.02944 21 12 21Z" stroke="#E35141" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`,

    warning: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
    <path d="M12 21C16.9706 21 21 16.9706 21 12C21 7.02944 16.9706 3 12 3C7.02944 3 3 7.02944 3 12C3 16.9706 7.02944 21 12 21Z" stroke="#FF8751" stroke-width="2" stroke-miterlimit="10"/>
    <path d="M12 12.75V7.5" stroke="#FF8751" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M12 15.0625C12.5868 15.0625 13.0625 15.5382 13.0625 16.125C13.0625 16.7118 12.5868 17.1875 12 17.1875C11.4132 17.1875 10.9375 16.7118 10.9375 16.125C10.9375 15.5382 11.4132 15.0625 12 15.0625Z" fill="#FF8751" stroke="#FF8751" stroke-width="0.125"/>
  </svg>`,

    success: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
    <path d="M3.75 13.5L9 18.75L21 6.75" stroke="#28A745" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`,

    // info (blue) – matches your info theme
    info: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
    <path d="M12 21C16.9706 21 21 16.9706 21 12C21 7.02944 16.9706 3 12 3C7.02944 3 3 7.02944 3 12C3 16.9706 7.02944 21 12 21Z" stroke="#2F80ED" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M12 10.5V16" stroke="#2F80ED" stroke-width="2" stroke-linecap="round"/>
    <path d="M12 7.5h.01" stroke="#2F80ED" stroke-width="3" stroke-linecap="round"/>
  </svg>`,
};

const escapeHtml = (s: string) =>
    s.replace(/[&<>"']/g, (m) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[m]!));

/** Drop this once anywhere in your app (layout providers, etc.) */
export function ToastStyles() {
    return (
        <style jsx global>{`
      .emc-toast {
        will-change: transform, opacity;
      }
      .emc-toast-in {
        animation: emcToastIn 220ms ease-out forwards !important;
      }
      .emc-toast-out {
        animation: emcToastOut 180ms ease-in forwards !important;
      }
      @keyframes emcToastIn {
        from {
          opacity: 0;
          transform: translateX(18px);
        }
        to {
          opacity: 1;
          transform: translateX(0);
        }
      }
      @keyframes emcToastOut {
        from {
          opacity: 1;
          transform: translateX(0);
        }
        to {
          opacity: 0;
          transform: translateX(18px);
        }
      }
    `}</style>
    );
}

/** Call this anywhere: toast({ icon:"success", title:"...", text:"..." }) */
export function toast({ icon, title, text, timer = 2500 }: ToastOptions) {
    const t = THEME[icon];

    // Optional: avoid stacking / jitter by closing previous toast
    Swal.close();

    return Swal.fire({
        toast: true,
        position: "top-end",
        showConfirmButton: false,
        showCloseButton: true,
        timer,
        timerProgressBar: false,

        width: 480,
        padding: "14px 16px",
        background: t.bg,

        customClass: {
            popup: "emc-toast",
            htmlContainer: "m-0 p-0 text-left",
        },
        showClass: { popup: "emc-toast-in" },
        hideClass: { popup: "emc-toast-out" },

        title: "",
        html: `
      <div style="display:flex; gap:12px; align-items:flex-start; padding-right:6px;">
        <div style="margin-top:2px; flex:0 0 auto;">
          ${ICONS[icon]}
        </div>
        <div style="min-width:0;">
          <div style="font-size:20px; font-weight:600; line-height:1.2; color:${t.title};">
            ${escapeHtml(title)}
          </div>
          ${text
                ? `<div style="margin-top:6px; font-size:16px; line-height:1.35; color:${t.text};">
                   ${escapeHtml(text)}
                 </div>`
                : ""
            }
        </div>
      </div>
    `,
        didOpen: (popup) => {
            popup.style.border = `0.5px solid ${t.border}`;
            popup.style.borderRadius = "8px";
            popup.style.boxShadow = "0 10px 30px rgba(0,0,0,.08)";

            // ✅ Force close button to top-right corner
            const close = popup.querySelector(".swal2-close") as HTMLElement | null;
            if (close) {
                close.style.position = "absolute";
                close.style.top = "8px";
                close.style.right = "10px";

                close.style.width = "28px";
                close.style.height = "28px";
                close.style.display = "flex";
                close.style.alignItems = "center";
                close.style.justifyContent = "center";

                close.style.padding = "0";
                close.style.margin = "0";
                close.style.border = "none";
                close.style.background = "transparent";

                close.style.color = "#191919";
                close.style.opacity = "1";
                close.style.fontSize = "22px";
                close.style.lineHeight = "1";
                close.style.boxShadow = "none";
                close.style.cursor = "pointer";
            }

            // ✅ Optional: keep content away from close icon
            const container = popup.querySelector(".swal2-html-container") as HTMLElement | null;
            if (container) {
                container.style.paddingRight = "28px";
            }
        },
    });
}
