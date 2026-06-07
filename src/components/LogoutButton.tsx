"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/store/auth";

export default function LogoutButton() {
  const router = useRouter();
  const logout = useAuth((s) => s.logout);
  const [loading, setLoading] = useState(false);

  async function handle() {
    setLoading(true);
    await logout();
    router.push("/");
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={handle}
      disabled={loading}
      className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
    >
      {loading ? "Saindo..." : "Sair"}
    </button>
  );
}
