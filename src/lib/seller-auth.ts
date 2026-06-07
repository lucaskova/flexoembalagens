import { randomBytes } from "crypto";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

const SELLER_COOKIE = "lambari_seller";
const SESSION_DURATION_DAYS = 7;

export type SessionSeller = {
  id: string;
  name: string;
  email: string;
};

function expiryDate(): Date {
  return new Date(Date.now() + SESSION_DURATION_DAYS * 24 * 60 * 60 * 1000);
}

export async function createSellerSession(sellerId: string): Promise<void> {
  const token = randomBytes(32).toString("hex");
  const expiresAt = expiryDate();

  await prisma.sellerSession.create({ data: { token, sellerId, expiresAt } });

  const jar = await cookies();
  jar.set(SELLER_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  });
}

export async function destroySellerSession(): Promise<void> {
  const jar = await cookies();
  const token = jar.get(SELLER_COOKIE)?.value;
  if (token) {
    await prisma.sellerSession.deleteMany({ where: { token } }).catch(() => {});
  }
  jar.delete(SELLER_COOKIE);
}

export async function getCurrentSeller(): Promise<SessionSeller | null> {
  try {
    const jar = await cookies();
    const token = jar.get(SELLER_COOKIE)?.value;
    if (!token) return null;

    const session = await prisma.sellerSession.findUnique({
      where: { token },
      include: { seller: true },
    });

    if (!session || session.expiresAt < new Date() || !session.seller.active) {
      if (session) await prisma.sellerSession.delete({ where: { id: session.id } }).catch(() => {});
      return null;
    }

    return {
      id: session.seller.id,
      name: session.seller.name,
      email: session.seller.email,
    };
  } catch {
    return null;
  }
}
