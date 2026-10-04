import type { Metadata, Viewport } from "next";
import { Fraunces, Manrope } from "next/font/google";
import { bootScript } from "@/lib/shade";
import { getContent } from "@/lib/content";
import { ContentProvider } from "@/components/ContentProvider";
import HairBrush from "@/components/HairBrush";
import "./globals.css";

export const revalidate = 30; // content edits in /admin also trigger an instant revalidate

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  axes: ["SOFT", "WONK", "opsz"],
  style: ["normal", "italic"],
});
const manrope = Manrope({ variable: "--font-manrope", subsets: ["latin"] });

export async function generateMetadata(): Promise<Metadata> {
  const { settings: s } = await getContent();
  return {
    title: `${s.name} ${s.tagline} — Color, Cuts & Styling in ${s.city}`,
    description: `Book ${s.stylist} at ${s.name} ${s.tagline} in ${s.city}. Custom color, precision cuts and bridal styling. Browse the portfolio and reserve your chair online.`,
  };
}
export const viewport: Viewport = { themeColor: "#1a0f1a" };

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const content = await getContent();
  const { defaultShade, defaultTheme } = content.settings;
  return (
    <html
      lang="en"
      data-shade={defaultShade}
      data-theme={defaultTheme}
      className={`${fraunces.variable} ${manrope.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: bootScript }} />
      </head>
      <body className="min-h-dvh overflow-x-hidden">
        <ContentProvider content={content}>{children}</ContentProvider>
        <HairBrush />
      </body>
    </html>
  );
}
