import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import ServiceWorkerRegister from "@/components/ServiceWorkerRegister";
import { getPublicSettings } from "@/lib/settings";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-inter",
  display: "swap",
});

const storeName = process.env.NEXT_PUBLIC_STORE_NAME ?? "Lambari Pesca";
const DEFAULT_BRAND = "#0F4C81";

function isHex(v: string | null | undefined): v is string {
  return !!v && /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(v);
}

// Recolore a marca: sobrescreve a paleta emerald (usada em todo o site)
// derivando os tons a partir de uma única cor base, via color-mix.
function brandStyle(hex: string): string {
  return `:root{
    --color-emerald-50: color-mix(in srgb, ${hex} 8%, white);
    --color-emerald-100: color-mix(in srgb, ${hex} 16%, white);
    --color-emerald-200: color-mix(in srgb, ${hex} 28%, white);
    --color-emerald-500: color-mix(in srgb, ${hex} 78%, white);
    --color-emerald-600: color-mix(in srgb, ${hex} 90%, white);
    --color-emerald-700: ${hex};
    --color-emerald-800: color-mix(in srgb, ${hex} 82%, black);
    --color-emerald-900: color-mix(in srgb, ${hex} 65%, black);
  }`;
}

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getPublicSettings().catch(() => null);
  const name = settings?.name ?? storeName;
  return {
    title: `${name} | Embalagens para E-commerce`,
    description:
      settings?.description ??
      "Distribuidora de embalagens, caixas de papelão, fitas e suprimentos para e-commerce. Atacado com entrega rápida para todo o Brasil.",
    manifest: "/manifest.webmanifest",
    applicationName: name,
    appleWebApp: {
      capable: true,
      statusBarStyle: "default",
      title: name,
    },
    icons: {
      icon: "/icons/icon.svg",
      shortcut: "/icons/icon.svg",
      apple: "/icons/icon.svg",
    },
  };
}

export async function generateViewport(): Promise<Viewport> {
  const settings = await getPublicSettings().catch(() => null);
  return {
    themeColor: isHex(settings?.themeColor) ? settings!.themeColor! : DEFAULT_BRAND,
  };
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const settings = await getPublicSettings().catch(() => null);
  const brand = isHex(settings?.themeColor) ? settings!.themeColor! : null;

  return (
    <html lang="pt-BR" className={inter.variable}>
      {brand && (
        <head>
          <style dangerouslySetInnerHTML={{ __html: brandStyle(brand) }} />
        </head>
      )}
      <body className="antialiased">
        {children}
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
