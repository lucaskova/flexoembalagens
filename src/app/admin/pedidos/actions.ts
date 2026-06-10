"use server";

import { revalidatePath } from "next/cache";
import { shipOrderWithJt } from "@/lib/integrations/ship-jt";

export async function generateJtShipment(orderId: string): Promise<{ ok: boolean; message: string }> {
  const result = await shipOrderWithJt(orderId);
  revalidatePath("/admin/pedidos");

  if (!result.ok) {
    return { ok: false, message: result.error };
  }

  const labelMsg = result.labelUrl ? ` Etiqueta: ${result.labelUrl}` : "";
  return {
    ok: true,
    message: `Envio J&T criado. Rastreio: ${result.billCode}.${labelMsg}`,
  };
}
