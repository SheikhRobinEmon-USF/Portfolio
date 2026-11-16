import type { Metadata, Viewport } from "next";
import { Assistant } from "@/components/assistant/assistant";
import { Scene } from "@/components/canvas/scene";
import { CaseDrawer } from "@/components/sections/case-drawer";
import { CommandPalette } from "@/components/command/command-palette";
import { Footer } from "@/components/layout/footer";
import { Nav } from "@/components/layout/nav";
import { ScrollProgress } from "@/components/layout/scroll-progress";
import { AppProvider, bootScript } from "@/components/providers/app-provider";
import { profile } from "@/content/profile";
import { siteUrl } from "@/lib/site";
import "./globals.css";

const title = `${profile.name} · AI Product Manager and Forward Deployed AI Engineer`;
const description =
  "Portfolio of Sheikh Robin Emon. Six years taking AI products from customer discovery to production: LLM agents, RAG and evals, backed by product strategy and analytics.";

export const metadata: Metadata = {
  metadataBase: new URL(`${siteUrl}/`),
  title: { default: title, template: `%s · ${profile.name}` },
  description,
  authors: [{ name: profile.name, url: profile.links.linkedin }],
  keywords: [
    "AI Product Manager",
    "Forward Deployed AI Engineer",
    "Business Analyst",
    "LLM",
    "RAG",
    "AI agents",
    "LLM evals",
    "Sheikh Robin Emon",
  ],
  openGraph: {
    type: "website",
    title,
    description,
    siteName: profile.name,
    images: [{ url: "og.png", width: 1200, height: 630, alt: title }],
  },
  twitter: { card: "summary_large_image", title, description, images: ["og.png"] },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#07080b" },
    { media: "(prefers-color-scheme: light)", color: "#f3f2ec" },
  ],
  colorScheme: "dark light",
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Person",
  name: profile.name,
  email: `mailto:${profile.email}`,
  jobTitle: profile.roles.join(", "),
  url: siteUrl,
  address: { "@type": "PostalAddress", addressLocality: "Tampa", addressRegion: "FL", addressCountry: "US" },
  alumniOf: [
    { "@type": "CollegeOrUniversity", name: "University of South Florida" },
    { "@type": "CollegeOrUniversity", name: "Independent University, Bangladesh" },
  ],
  sameAs: [profile.links.linkedin, profile.links.github],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" data-theme="dark" data-lens="pm" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: bootScript }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      </head>
      <body>
        <a
          href="#main"
          className="fixed left-4 top-4 z-[80] -translate-y-24 rounded-full bg-accent px-4 py-2 text-sm font-medium text-accent-ink transition-transform focus:translate-y-0"
        >
          Skip to content
        </a>
        <AppProvider>
          <Scene />
          <ScrollProgress />
          <Nav />
          <main id="main">{children}</main>
          <Footer />
          <CaseDrawer />
          <Assistant />
          <CommandPalette />
        </AppProvider>
        <div className="grain" aria-hidden />
      </body>
    </html>
  );
}
