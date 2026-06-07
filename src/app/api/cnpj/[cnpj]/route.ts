import { NextResponse } from "next/server";

type BrasilApiCnpj = {
  razao_social?: string;
  nome_fantasia?: string;
  email?: string;
  ddd_telefone_1?: string;
  cep?: string;
  logradouro?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  municipio?: string;
  uf?: string;
  message?: string;
};

export async function GET(_req: Request, { params }: { params: Promise<{ cnpj: string }> }) {
  const { cnpj } = await params;
  const clean = (cnpj ?? "").replace(/\D/g, "");
  if (clean.length !== 14) {
    return NextResponse.json({ error: "CNPJ inválido" }, { status: 400 });
  }

  try {
    const res = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${clean}`, {
      headers: { Accept: "application/json" },
    });

    if (!res.ok) {
      return NextResponse.json({ error: "CNPJ não encontrado" }, { status: 404 });
    }

    const data = (await res.json()) as BrasilApiCnpj;

    return NextResponse.json({
      name: data.razao_social ?? data.nome_fantasia ?? "",
      tradeName: data.nome_fantasia ?? "",
      email: data.email ?? "",
      phone: data.ddd_telefone_1 ?? "",
      zipCode: (data.cep ?? "").replace(/\D/g, ""),
      street: data.logradouro ?? "",
      number: data.numero ?? "",
      complement: data.complemento ?? "",
      district: data.bairro ?? "",
      city: data.municipio ?? "",
      state: data.uf ?? "",
    });
  } catch {
    return NextResponse.json({ error: "Falha ao consultar o CNPJ" }, { status: 502 });
  }
}
