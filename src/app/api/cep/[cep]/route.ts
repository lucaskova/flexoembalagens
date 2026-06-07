import { NextResponse } from "next/server";

type ViaCepResponse = {
  erro?: boolean;
  logradouro?: string;
  bairro?: string;
  localidade?: string;
  uf?: string;
};

export async function GET(_req: Request, { params }: { params: Promise<{ cep: string }> }) {
  const { cep } = await params;
  const clean = (cep ?? "").replace(/\D/g, "");
  if (clean.length !== 8) {
    return NextResponse.json({ error: "CEP inválido" }, { status: 400 });
  }

  try {
    const res = await fetch(`https://viacep.com.br/ws/${clean}/json/`, {
      headers: { Accept: "application/json" },
    });
    const data = (await res.json()) as ViaCepResponse;
    if (data?.erro) {
      return NextResponse.json({ error: "CEP não encontrado" }, { status: 404 });
    }
    return NextResponse.json({
      street: data.logradouro ?? "",
      district: data.bairro ?? "",
      city: data.localidade ?? "",
      state: data.uf ?? "",
    });
  } catch {
    return NextResponse.json({ error: "Falha ao consultar o CEP" }, { status: 502 });
  }
}
