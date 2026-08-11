import type { Metadata } from "next";
import { Bodoni_Moda, Public_Sans } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/auth-context";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";

const bodoniModa = Bodoni_Moda({
  variable: "--font-bodoni-moda",
  subsets: ["latin"],
});

const publicSans = Public_Sans({
  variable: "--font-public-sans",
  subsets: ["latin"],
});

// Intended production URL (M9 will confirm/adjust once real hosting is
// chosen) -- needed so relative OG image URLs and canonical links resolve
// correctly rather than falling back to whatever host serves the request.
export const metadata: Metadata = {
  metadataBase: new URL("https://alchemystudios.co.in"),
  title: {
    default: "Alchemy Studio — Fantasy & Sci-Fi Miniatures, Individually Numbered",
    template: "%s",
  },
  description:
    "Resin-cast fantasy and sci-fi miniatures, hand-finished and released in limited numbered runs. Shipping across India.",
  openGraph: {
    siteName: "Alchemy Studio",
    type: "website",
    locale: "en_IN",
  },
  twitter: {
    card: "summary_large_image",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${bodoniModa.variable} ${publicSans.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:bg-surface focus:text-gold focus:px-4 focus:py-2 focus:border focus:border-gold"
        >
          Skip to content
        </a>
        <AuthProvider>
          <SiteHeader />
          {/* display:contents keeps this id/focus target invisible to layout -- flex-1 on each page's own <main> still applies against the body flex container */}
          <div id="main-content" tabIndex={-1} className="contents focus:outline-none">
            {children}
          </div>
          <SiteFooter />
        </AuthProvider>
      </body>
    </html>
  );
}
