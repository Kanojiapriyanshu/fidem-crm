// File: src/app/admin/invite/page.tsx
"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

function toApiUrl(path: string) {
  const base = API_BASE.endsWith("/") ? API_BASE : `${API_BASE}/`;
  const cleanPath = path.startsWith("/") ? path.slice(1) : path;
  return `${base}${cleanPath}`;
}

function getVerificationErrorMessage(reason: string | null) {
  if (reason === "expired_token") {
    return "Your request to verify your email has expired or the link has already been used.";
  }

  if (reason === "missing_token") {
    return "The verification link is missing a valid token. Please request a new invite.";
  }

  if (reason === "invalid_token") {
    return "This verification link is invalid or has already been used. Please request a new invite.";
  }

  if (reason === "server_error") {
    return "We could not verify your email due to a server error. Please try again.";
  }

  return "Email verification failed. Please try again.";
}

function AnimatedSuccessTick() {
  return (
    <>
      <div className="success-tick-wrap mx-auto mb-8">
        <span className="success-dot success-dot-1" />
        <span className="success-dot success-dot-2" />
        <span className="success-dot success-dot-3" />
        <span className="success-dot success-dot-4" />
        <span className="success-dot success-dot-5" />
        <span className="success-dot success-dot-6" />

        <div className="success-tick-circle">
          <svg
            viewBox="0 0 52 52"
            className="success-tick-svg"
            aria-hidden="true"
          >
            <path
              className="success-tick-check"
              fill="none"
              d="M15 27.5L23 35L38 18"
            />
          </svg>
        </div>
      </div>

      <style>{`
        .success-tick-wrap {
          position: relative;
          width: 96px;
          height: 96px;
        }

        .success-tick-circle {
          position: absolute;
          inset: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 9999px;
          background: #37b24d;
          box-shadow: 0 16px 40px rgba(55, 178, 77, 0.28);
          animation: success-pop 520ms cubic-bezier(0.2, 1.4, 0.35, 1) both;
        }

        .success-tick-svg {
          width: 54px;
          height: 54px;
        }

        .success-tick-check {
          stroke: #ffffff;
          stroke-width: 6;
          stroke-linecap: round;
          stroke-linejoin: round;
          stroke-dasharray: 52;
          stroke-dashoffset: 52;
          animation: success-draw 520ms ease-out 280ms forwards;
        }

        .success-dot {
          position: absolute;
          width: 8px;
          height: 8px;
          border-radius: 9999px;
          opacity: 0;
          animation: success-spark 900ms ease-out 180ms forwards;
        }

        .success-dot-1 {
          left: 10px;
          top: 17px;
          background: #2f80ed;
        }

        .success-dot-2 {
          right: 8px;
          top: 20px;
          background: #f2c94c;
          animation-delay: 230ms;
        }

        .success-dot-3 {
          left: 22px;
          bottom: 8px;
          background: #9b51e0;
          animation-delay: 260ms;
        }

        .success-dot-4 {
          right: 18px;
          bottom: 10px;
          background: #eb5757;
          animation-delay: 300ms;
        }

        .success-dot-5 {
          left: 3px;
          top: 48px;
          width: 6px;
          height: 6px;
          background: #27ae60;
          animation-delay: 320ms;
        }

        .success-dot-6 {
          right: 2px;
          top: 50px;
          width: 6px;
          height: 6px;
          background: #56ccf2;
          animation-delay: 350ms;
        }

        @keyframes success-pop {
          0% {
            transform: scale(0.2);
            opacity: 0;
          }
          65% {
            transform: scale(1.1);
            opacity: 1;
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }

        @keyframes success-draw {
          to {
            stroke-dashoffset: 0;
          }
        }

        @keyframes success-spark {
          0% {
            transform: scale(0) translateY(8px);
            opacity: 0;
          }
          45% {
            transform: scale(1.25) translateY(0);
            opacity: 1;
          }
          100% {
            transform: scale(1) translateY(0);
            opacity: 0.9;
          }
        }
      `}</style>
    </>
  );
}

export default function AdminInvitePage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const token = useMemo(() => searchParams.get("token") || "", [searchParams]);
  const verified = useMemo(() => searchParams.get("verified") || "", [searchParams]);
  const reason = useMemo(() => searchParams.get("reason"), [searchParams]);

  const isEmailVerified = verified === "1";
  const isVerificationFailed = verified === "0";

  const [showPasswordForm, setShowPasswordForm] = useState(false);

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!token) {
      setError("Invite token is missing.");
      return;
    }

    if (!isEmailVerified) {
      setError("Please verify your email before setting password.");
      return;
    }

    if (!password.trim()) {
      setError("Password is required.");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(toApiUrl("admins/accept-invite"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token,
          password,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data?.message || "Failed to set password.");
      }

      setSuccess(data?.message || "Password set successfully. Redirecting to login...");

      setTimeout(() => {
        router.replace("/admin/login");
      }, 1800);
    } catch (err: any) {
      setError(err?.message || "Failed to set password.");
    } finally {
      setLoading(false);
    }
  }

  function renderContent() {
    if (success) {
      return (
        <div className="mx-auto max-w-2xl text-center">
          <AnimatedSuccessTick />

          <h1 className="text-3xl font-semibold tracking-tight text-black md:text-4xl">
            Password set successfully
          </h1>

          <p className="mx-auto mt-8 max-w-xl text-lg leading-8 text-black/80 md:text-xl">
            {success}
          </p>
        </div>
      );
    }

    if (isVerificationFailed) {
      return (
        <div className="mx-auto max-w-2xl text-center">
          <h1 className="text-3xl font-semibold tracking-tight text-black md:text-4xl">
            Try verifying your email again
          </h1>

          <p className="mx-auto mt-8 max-w-xl text-lg leading-8 text-black/80 md:text-xl">
            {getVerificationErrorMessage(reason)}
          </p>
        </div>
      );
    }

    if (!token) {
      return (
        <div className="mx-auto max-w-2xl text-center">
          <h1 className="text-3xl font-semibold tracking-tight text-black md:text-4xl">
            Invalid invite link
          </h1>

          <p className="mx-auto mt-8 max-w-xl text-lg leading-8 text-black/80 md:text-xl">
            This invite link is missing a valid token. Please request a new invite.
          </p>
        </div>
      );
    }

    if (!isEmailVerified) {
      return (
        <div className="mx-auto max-w-2xl text-center">
          <h1 className="text-3xl font-semibold tracking-tight text-black md:text-4xl">
            Verify your email first
          </h1>

          <p className="mx-auto mt-8 max-w-xl text-lg leading-8 text-black/80 md:text-xl">
            Please open the verification link sent to your email. Once your email is verified, you can set your password.
          </p>
        </div>
      );
    }

    if (isEmailVerified && !showPasswordForm) {
      return (
        <div className="mx-auto max-w-2xl text-center">
          <AnimatedSuccessTick />

          <h1 className="text-3xl font-semibold tracking-tight text-black md:text-4xl">
            Email verification successful
          </h1>

          <p className="mx-auto mt-8 max-w-xl text-lg leading-8 text-black/80 md:text-xl">
            Your email has been verified successfully. Set your new password to login.
          </p>

          <div className="mt-10 flex justify-center">
            <button
              type="button"
              onClick={() => setShowPasswordForm(true)}
              className="rounded-xl bg-teal-600 px-8 py-3 text-base font-medium text-white transition hover:opacity-90"
            >
              Set New Password
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="mx-auto w-full max-w-md">
        <div className="text-center">
          <AnimatedSuccessTick />

          <h1 className="text-3xl font-semibold tracking-tight text-black md:text-4xl">
            Set your new password
          </h1>

          <p className="mx-auto mt-6 max-w-md text-lg leading-8 text-black/80">
            Enter a secure password to complete your admin onboarding.
          </p>
        </div>

        <form onSubmit={onSubmit} className="mt-10 space-y-5">
          <div>
            <label className="mb-2 block text-sm font-medium text-black">
              New Password
            </label>

            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              className="w-full rounded-xl border border-black/20 px-4 py-3 text-sm outline-none focus:border-teal-600/60"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-black">
              Confirm Password
            </label>

            <input
              type={showPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm password"
              className="w-full rounded-xl border border-black/20 px-4 py-3 text-sm outline-none focus:border-teal-600/60"
            />
          </div>

          <label className="flex items-center justify-center gap-2 text-sm text-black/70">
            <input
              type="checkbox"
              checked={showPassword}
              onChange={() => setShowPassword((v) => !v)}
            />
            Show password
          </label>

          {error ? (
            <p className="text-center text-sm text-red-600">
              {error}
            </p>
          ) : null}

          <div className="flex justify-center">
            <button
              type="submit"
              disabled={loading}
              className="rounded-xl bg-teal-600 px-8 py-3 text-base font-medium text-white transition hover:opacity-90 disabled:opacity-50"
            >
              {loading ? "Setting Password..." : "Submit Password"}
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#fafafa] px-4 py-10">
      {renderContent()}
    </main>
  );
}