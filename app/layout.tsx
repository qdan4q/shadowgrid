import type { Metadata, Viewport } from "next";
import { headers } from "next/headers";
import { IBM_Plex_Mono, Inter } from "next/font/google";
import { RussianTextLayer } from "../components/RussianTextLayer";
import "./globals.css";

const interfaceSans = Inter({ variable: "--font-interface", subsets: ["cyrillic", "latin"] });
const terminalMono = IBM_Plex_Mono({ variable: "--font-terminal", subsets: ["cyrillic", "latin"], weight: ["400", "500", "600"] });

const description = "ZERO/TERM — нелегальная текстовая BBS для теневых контрактов, мёртвых каналов и безымянных раннеров.";

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers();
  const host = (requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host") ?? "localhost:3000").split(",")[0].trim();
  const forwardedProtocol = requestHeaders.get("x-forwarded-proto")?.split(",")[0].trim();
  const protocol = forwardedProtocol ?? (host.startsWith("localhost") || host.startsWith("127.0.0.1") ? "http" : "https");
  let metadataBase: URL;
  try {
    metadataBase = new URL(`${protocol}://${host}`);
  } catch {
    metadataBase = new URL("http://localhost:3000");
  }
  const socialImage = new URL("/og.png", metadataBase).toString();
  return {
    metadataBase,
    title: { default: "ZERO/TERM // ShadowGrid", template: "%s // ZERO/TERM" },
    description,
    applicationName: "ShadowGrid",
    robots: { index: false, follow: false },
    openGraph: {
      title: "ZERO/TERM // ShadowGrid",
      description,
      siteName: "ShadowGrid",
      type: "website",
      images: [{ url: socialImage, width: 1760, height: 900, alt: "Фосфорный BBS-терминал ZERO/TERM сети ShadowGrid" }],
    },
    twitter: { card: "summary_large_image", title: "ZERO/TERM // ShadowGrid", description, images: [socialImage] },
  };
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  colorScheme: "dark",
  themeColor: "#010300",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ru" suppressHydrationWarning>
      <head><script dangerouslySetInnerHTML={{ __html: `try{document.documentElement.dataset.language=localStorage.getItem("shadowgrid.language")==="en"?"en":"ru"}catch(_){document.documentElement.dataset.language="ru"}` }} /></head>
      <body className={`${interfaceSans.variable} ${terminalMono.variable}`}><RussianTextLayer />{children}</body>
    </html>
  );
}
