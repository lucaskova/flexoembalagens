// Autenticação simples do painel admin: uma senha única (ADMIN_PASSWORD).
// O cookie guarda um token derivado de ADMIN_SESSION_SECRET (não a senha em si).
// As funções puras aqui rodam tanto no Node quanto no Edge (middleware).

export const ADMIN_COOKIE = "lambari_admin";

function getSecret(): string {
  return process.env.ADMIN_SESSION_SECRET || process.env.ADMIN_PASSWORD || "lambari-admin-dev-secret";
}

// Token determinístico derivado do segredo. Usa Web Crypto (Edge + Node 18+).
export async function expectedAdminToken(): Promise<string> {
  const data = new TextEncoder().encode(`${getSecret()}::lambari-admin`);
  const buf = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function isValidAdminToken(token: string | undefined | null): Promise<boolean> {
  if (!token) return false;
  const expected = await expectedAdminToken();
  // comparação simples; tokens têm o mesmo tamanho (hex sha-256)
  if (token.length !== expected.length) return false;
  let diff = 0;
  for (let i = 0; i < expected.length; i++) {
    diff |= token.charCodeAt(i) ^ expected.charCodeAt(i);
  }
  return diff === 0;
}

export function checkAdminPassword(password: string): boolean {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) return false;
  return password === expected;
}
