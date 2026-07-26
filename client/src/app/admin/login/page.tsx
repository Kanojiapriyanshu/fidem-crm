"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/adminbutton";
import { Label } from "@/components/ui/label";
import { HiEye, HiEyeSlash } from "react-icons/hi2";
import { post } from "@/lib/api";
import { clearClientAuthStorage } from "@/lib/clearClientAuth";

type AdminUser = {
  _id: string;
  email: string;
  name?: string;
  role?: string;
  status?: string;
};

export default function AdminLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      clearClientAuthStorage();

      const data = await post<{
        token: string;
        admin: AdminUser;
      }>("/admins/login", { email, password });

      const admin = data?.admin;

      if (!data?.token || !admin?._id) {
        throw new Error("Invalid login response");
      }

      localStorage.setItem("token", data.token);
      localStorage.setItem("adminId", admin._id);
      localStorage.setItem("userType", "admin");
      localStorage.setItem("userEmail", admin.email || email);

      // Needed for revenue_head UI logic
      localStorage.setItem("adminRole", admin.role || "");
      localStorage.setItem("admin", JSON.stringify(admin));

      // Optional convenience keys
      if (admin.name) localStorage.setItem("adminName", admin.name);
      if (admin.status) localStorage.setItem("adminStatus", admin.status);

      router.replace("/admin/pitch-folders");
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Invalid credentials"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#f8fafc] px-4 py-10">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(0,150,136,0.20),transparent_35%),radial-gradient(circle_at_bottom_right,rgba(205,220,57,0.18),transparent_35%)]" />

      <div className="absolute left-10 top-10 h-32 w-32 rounded-full bg-teal-300/20 blur-3xl" />
      <div className="absolute bottom-10 right-10 h-40 w-40 rounded-full bg-lime-400/20 blur-3xl" />

      <Card className="relative w-full max-w-md overflow-hidden rounded-3xl border border-white/70 bg-white/90 shadow-2xl shadow-slate-200/80 backdrop-blur-xl">
        <div className="h-1.5 w-full bg-gradient-to-r from-teal-500 via-lime-400 to-brand-500" />

        <CardHeader className="space-y-5 px-8 pb-4 pt-8 text-center">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl border border-slate-100 bg-white shadow-lg shadow-slate-200/70">
            <img
              src="/logo.png"
              alt="Admin Logo"
              width={58}
              height={58}
              className="object-contain"
            />
          </div>

          <div className="space-y-2">
            <CardTitle className="text-3xl font-bold tracking-tight text-slate-950">
              Admin Sign In
            </CardTitle>

            <CardDescription className="text-sm leading-6 text-slate-500">
              Welcome back. Enter your admin credentials to continue.
            </CardDescription>
          </div>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-5 px-8 pt-2">
            <div className="space-y-2">
              <Label
                htmlFor="email"
                className="text-sm font-medium text-slate-700"
              >
                Email address
              </Label>

              <Input
                id="email"
                type="email"
                placeholder="admin@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
                className="h-12 rounded-xl border-slate-200 bg-slate-50/70 px-4 text-sm text-slate-900 outline-none transition focus-visible:ring-2 focus-visible:ring-teal-500"
              />
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="password"
                className="text-sm font-medium text-slate-700"
              >
                Password
              </Label>

              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  required
                  className="h-12 rounded-xl border-slate-200 bg-slate-50/70 px-4 pr-12 text-sm text-slate-900 outline-none transition focus-visible:ring-2 focus-visible:ring-teal-500"
                />

                <button
                  type="button"
                  onClick={() => setShowPassword((p) => !p)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 rounded-md text-slate-400 transition hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <HiEyeSlash className="h-5 w-5" />
                  ) : (
                    <HiEye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-center text-sm font-medium text-red-600">
                {error}
              </div>
            )}
          </CardContent>

          <CardFooter className="px-8 pb-8 pt-6">
            <Button
              type="submit"
              disabled={loading}
              className="h-12 w-full rounded-xl bg-teal-600 text-base font-semibold text-white shadow-lg shadow-teal-200/50 transition hover:-translate-y-0.5 hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:translate-y-0"
            >
              {loading ? "Signing in..." : "Sign In"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </main>
  );
}