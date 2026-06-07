import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth";
import { getCurrentSeller } from "@/lib/seller-auth";

const schema = z.object({
  name: z.string().min(2, "Informe o nome / razão social."),
  email: z.string().email("E-mail inválido."),
  password: z.string().min(6, "A senha deve ter ao menos 6 caracteres."),
  document: z.string().optional(),
  phone: z.string().optional(),
  type: z.enum(["PF", "PJ"]).default("PJ"),
  zipCode: z.string().optional(),
  street: z.string().optional(),
  number: z.string().optional(),
  complement: z.string().optional(),
  district: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const seller = await getCurrentSeller();
  if (!seller) {
    return NextResponse.json({ error: "Sessão expirada. Entre novamente." }, { status: 401 });
  }

  const json = await req.json().catch(() => null);
  const parsed = schema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Dados inválidos." }, { status: 400 });
  }

  const d = parsed.data;
  const email = d.email.toLowerCase();

  try {
    const existing = await prisma.customer.findUnique({ where: { email } });
    if (existing?.passwordHash) {
      return NextResponse.json({ error: "Já existe um cliente com este e-mail." }, { status: 409 });
    }

    const passwordHash = await hashPassword(d.password);
    const data = {
      name: d.name,
      email,
      passwordHash,
      type: d.type,
      sellerId: seller.id,
      document: d.document || null,
      phone: d.phone || null,
      zipCode: (d.zipCode || "").replace(/\D/g, "") || null,
      street: d.street || null,
      number: d.number || null,
      complement: d.complement || null,
      district: d.district || null,
      city: d.city || null,
      state: d.state || null,
    };

    const customer = existing
      ? await prisma.customer.update({ where: { id: existing.id }, data })
      : await prisma.customer.create({ data });

    return NextResponse.json({ ok: true, customer: { id: customer.id, name: customer.name } });
  } catch {
    return NextResponse.json({ error: "Não foi possível cadastrar o cliente." }, { status: 500 });
  }
}
