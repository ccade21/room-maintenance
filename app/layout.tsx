import "./globals.css";
import TopNav from "@/components/TopNav";
import type { Metadata } from "next";

export const metadata: Metadata = {
  metadataBase: new URL("https://room-maintenance-seven.vercel.app"),
  title: "Room Data Sheet",
  description: "Room Data Sheet 시스템",
  openGraph: {
    title: "Room Data Sheet",
    description: "Room Data Sheet 시스템",
    url: "https://room-maintenance-seven.vercel.app",
    siteName: "Room Data Sheet",
    locale: "ko_KR",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Room Data Sheet",
    description: "Room Data Sheet 시스템",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body>
        <TopNav />
        <main className="container">{children}</main>
      </body>
    </html>
  );
}