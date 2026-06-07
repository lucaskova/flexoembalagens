"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Props = {
  storeName: string;
  /** Texto claro (para usar sobre a barra colorida). */
  light?: boolean;
  /** Empilha o nome embaixo do logo em vez de ao lado. */
  stacked?: boolean;
  /** Logo/nome maiores para header premium. */
  large?: boolean;
};

export default function BrandLogo({
  storeName,
  light = false,
  stacked = false,
  large = false,
}: Props) {
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [name, setName] = useState(storeName);

  useEffect(() => {
    fetch("/api/settings", { cache: "no-store" })
      .then((r) => r.json())
      .then((s) => {
        if (s?.logoUrl) setLogoUrl(s.logoUrl);
        if (s?.name) setName(s.name);
      })
      .catch(() => {});
  }, []);

  return (
    <Link
      href="/"
      className={`flex ${stacked ? "flex-col items-start" : "items-center"} gap-2.5 ${
        light ? "text-white" : "text-[#082b4d]"
      }`}
    >
      {logoUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={logoUrl}
          alt={name}
          className={`${large ? "h-12 sm:h-14" : "h-11"} w-auto max-w-[220px] object-contain`}
        />
      )}
      <span className={`font-extrabold leading-tight ${large ? "text-xl sm:text-2xl" : "text-xl"}`}>
        {name}
      </span>
    </Link>
  );
}
