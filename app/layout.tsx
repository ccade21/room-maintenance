import "./globals.css";
import TopNav from "@/components/TopNav";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Room Data Sheet",
  description: "Room Data Sheet",
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