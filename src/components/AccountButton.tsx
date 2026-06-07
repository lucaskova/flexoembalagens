"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useAuth } from "@/store/auth";

export default function AccountButton({ light = false }: { light?: boolean }) {
  const customer = useAuth((s) => s.customer);
  const loaded = useAuth((s) => s.loaded);
  const refresh = useAuth((s) => s.refresh);

  useEffect(() => {
    if (!loaded) refresh();
  }, [loaded, refresh]);

  const firstName = customer?.name?.split(" ")[0] ?? "";

  return (
    <Link
      href={customer ? "/minha-conta" : "/login"}
      className={`inline-flex items-center gap-1 rounded-lg px-2 py-1 ${
        light ? "text-white hover:text-white/80" : "text-slate-600 hover:text-emerald-700"
      }`}
      aria-label={customer ? "Minha conta" : "Entrar"}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-5 w-5"
      >
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
      <span className="hidden sm:inline">{customer ? firstName || "Conta" : "Entrar"}</span>
    </Link>
  );
}
