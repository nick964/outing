import type { Metadata, Viewport } from "next";
import Link from "next/link";
import { Libre_Caslon_Display, Libre_Caslon_Text, Libre_Franklin, Oswald } from "next/font/google";
import { OutingProvider, ProblemBanner } from "@/components/OutingProvider";
import { Header } from "@/components/Header";
import "./globals.css";

const caslonDisplay = Libre_Caslon_Display({ variable: "--font-caslon-display", subsets: ["latin"], weight: "400" });
const caslonText = Libre_Caslon_Text({ variable: "--font-caslon-text", subsets: ["latin"], weight: ["400", "700"], style: ["normal", "italic"] });
const oswald = Oswald({ variable: "--font-oswald", subsets: ["latin"], weight: ["400", "500", "600"] });
const franklin = Libre_Franklin({ variable: "--font-franklin", subsets: ["latin"], weight: ["400", "500", "600", "700"] });

export const metadata: Metadata = {
  title: "Tittyboyz Golf Outing 2026",
  description: "Live team scoring and leaderboard · Saturday, October 24, 2026 · John F. Byrne Golf Course",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#0b3b28",
  colorScheme: "light",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${caslonDisplay.variable} ${caslonText.variable} ${oswald.variable} ${franklin.variable}`}>
      <body>
        <OutingProvider>
          <Header />
          <main>
            <div className="wrap">
              <ProblemBanner />
              {children}
            </div>
          </main>
          <footer>
            <div className="wrap">Patrons are reminded: no running, no phones on the backswing. · <Link href="/admin">Committee</Link></div>
          </footer>
        </OutingProvider>
      </body>
    </html>
  );
}
