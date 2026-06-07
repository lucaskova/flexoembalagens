/**
 * Cliente Bling API v3 (OAuth 2.0).
 * Documentação: https://developer.bling.com.br/
 *
 * Fluxo:
 * 1. GET /api/integrations/bling/connect → redireciona para OAuth
 * 2. Callback troca code por tokens e salva em Integration
 * 3. POST /api/integrations/bling/sync → puxa produtos/estoque/categorias
 */

const BLING_API = process.env.BLING_API_URL ?? "https://api.bling.com.br/Api/v3";
const BLING_AUTH = "https://www.bling.com.br/Api/v3/oauth/authorize";
const BLING_TOKEN = "https://www.bling.com.br/Api/v3/oauth/token";

export function getBlingAuthUrl(state: string): string {
  const clientId = process.env.BLING_CLIENT_ID;
  if (!clientId) throw new Error("BLING_CLIENT_ID não configurado.");
  const redirect = encodeURIComponent(process.env.BLING_REDIRECT_URI ?? "");
  return `${BLING_AUTH}?response_type=code&client_id=${clientId}&state=${state}&redirect_uri=${redirect}`;
}

export async function exchangeBlingCode(code: string) {
  const clientId = process.env.BLING_CLIENT_ID;
  const clientSecret = process.env.BLING_CLIENT_SECRET;
  const redirectUri = process.env.BLING_REDIRECT_URI;
  if (!clientId || !clientSecret || !redirectUri) {
    throw new Error("Credenciais Bling incompletas.");
  }

  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    redirect_uri: redirectUri,
  });

  const res = await fetch(BLING_TOKEN, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
    },
    body,
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Bling OAuth falhou: ${err}`);
  }

  return res.json() as Promise<{
    access_token: string;
    refresh_token: string;
    expires_in: number;
  }>;
}

export async function blingFetch<T>(accessToken: string, path: string): Promise<T> {
  const res = await fetch(`${BLING_API}${path}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/json",
    },
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Bling API ${path}: ${err}`);
  }
  return res.json() as Promise<T>;
}

/** Lista produtos do Bling (paginado). */
export async function fetchBlingProducts(accessToken: string, page = 1) {
  return blingFetch<{ data: BlingProduct[] }>(
    accessToken,
    `/produtos?pagina=${page}&limite=100&criterio=2`,
  );
}

export type BlingProduct = {
  id: number;
  nome: string;
  codigo: string;
  preco: number;
  situacao: string;
  estoque?: { saldoVirtualTotal?: number };
  midia?: { imagens?: { externas?: Array<{ link: string }> } };
  categoria?: { id: number; descricao: string };
};
