import type { Metadata, Viewport } from "next";
import { Fraunces, Manrope } from "next/font/google";
import { bootScript } from "@/lib/shade";
import { shades } from "@/lib/shades";
import { getContent } from "@/lib/content";
import { rootMetadata } from "@/lib/seo";
import { ContentProvider } from "@/components/ContentProvider";
import Scissors from "@/components/Scissors";
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
  const { settings } = await getContent();
  return rootMetadata(settings);
}
export const viewport: Viewport = { themeColor: "#1a0f1a" };

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const content = await getContent();
  const { defaultTheme } = content.settings;
  // saved shade from an older palette? fall back to the first natural color
  const defaultShade = shades.some((x) => x.id === content.settings.defaultShade) ? content.settings.defaultShade : "honey";
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
        <Scissors />
      </body>
    </html>
  );
}
