import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { exchangeBlingCode } from "@/lib/integrations/bling";

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  const error = req.nextUrl.searchParams.get("error");

  if (error || !code) {
    return NextResponse.redirect(
      new URL(`/admin?err=${encodeURIComponent(error ?? "oauth_cancelado")}`, req.url),
    );
  }

  try {
    const tokens = await exchangeBlingCode(code);
    const expiresAt = new Date(Date.now() + tokens.expires_in * 1000);

    await prisma.integration.upsert({
      where: { provider: "BLING" },
      update: {
        status: "CONNECTED",
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        tokenExpiresAt: expiresAt,
        lastError: null,
      },
      create: {
        provider: "BLING",
        status: "CONNECTED",
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        tokenExpiresAt: expiresAt,
      },
    });

    return NextResponse.redirect(new URL("/admin?ok=bling", req.url));
  } catch (e) {
    const msg = e instanceof Error ? e.message : "erro_oauth";
    return NextResponse.redirect(new URL(`/admin?err=${encodeURIComponent(msg)}`, req.url));
  }
}
