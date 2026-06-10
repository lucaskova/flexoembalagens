"use client";

import { useState, useTransition } from "react";
import { generateJtShipment } from "@/app/admin/pedidos/actions";

type Props = {
  orderId: string;
  hasTracking: boolean;
  status: string;
};

export default function ShipJtButton({ orderId, hasTracking, status }: Props) {
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  if (hasTracking || status === "CANCELLED") return null;

  return (
    <div className="inline-flex flex-col items-end gap-1">
      <button
        type="button"
        disabled={pending}
        onClick={() => {
          setMessage(null);
          startTransition(async () => {
            const res = await generateJtShipment(orderId);
            setMessage(res.message);
          });
        }}
        className="rounded-lg bg-sky-700 px-2.5 py-1 text-xs font-semibold text-white hover:bg-sky-800 disabled:opacity-60"
      >
        {pending ? "Gerando…" : "Gerar envio J&T"}
      </button>
      {message && (
        <span className={`max-w-xs text-right text-xs ${message.startsWith("Envio") ? "text-emerald-700" : "text-rose-600"}`}>
          {message}
        </span>
      )}
    </div>
  );
}
