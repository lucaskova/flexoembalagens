import { NextRequest, NextResponse } from "next/server";
import { ADMIN_COOKIE, isValidAdminToken } from "@/lib/admin-auth";

const SELLER_COOKIE = "lambari_seller";

function pass(req: NextRequest): NextResponse {
  const headers = new Headers(req.headers);
  headers.set("x-pathname", req.nextUrl.pathname);
  return NextResponse.next({ request: { headers } });
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // ----- Painel admin -----
  if (pathname.startsWith("/admin")) {
    if (pathname === "/admin/login") return pass(req);
    const token = req.cookies.get(ADMIN_COOKIE)?.value;
    const ok = await isValidAdminToken(token);
    if (!ok) {
      const url = req.nextUrl.clone();
      url.pathname = "/admin/login";
      url.searchParams.set("next", pathname);
      return NextResponse.redirect(url);
    }
    return pass(req);
  }

  // ----- Portal do vendedor -----
  if (pathname.startsWith("/vendedor")) {
    if (pathname === "/vendedor/login") return pass(req);
    // Validação leve: presença do cookie. A sessão real é checada no layout.
    const token = req.cookies.get(SELLER_COOKIE)?.value;
    if (!token) {
      const url = req.nextUrl.clone();
      url.pathname = "/vendedor/login";
      url.searchParams.set("next", pathname);
      return NextResponse.redirect(url);
    }
    return pass(req);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/vendedor/:path*"],
};
