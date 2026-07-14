import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import localFont from "next/font/local";
import { ClerkProvider } from "@clerk/nextjs";
import { AppNav } from "@/components/navigation/AppNav";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const polandKaito = localFont({
  src: "./fonts/PolandCannedIntoKaito-j9OjM.ttf",
  variable: "--font-poland-kaito",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Evespace",
    template: "%s | Evespace",
  },
  description:
    "A cosmic digital memory board where every event is a star and every star holds memories.",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/evespace-favicon.png", sizes: "40x40", type: "image/png" },
    ],
    shortcut: "/evespace-favicon.png",
    apple: "/evespace-favicon.png",
  },
};

export default function RootLayout({
  children,
  explorePanel,
  notificationsPanel,
}: Readonly<{
  children: React.ReactNode;
  explorePanel: React.ReactNode;
  notificationsPanel: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${polandKaito.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-slate-950 text-slate-50">
        <ClerkProvider>
          <AppNav
            explorePanel={explorePanel}
            notificationsPanel={notificationsPanel}
          />
          {children}
        </ClerkProvider>
      </body>
    </html>
  );
}
