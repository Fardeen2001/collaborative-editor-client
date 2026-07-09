import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ConfigProvider } from "@/lib/config";
import { ApiProvider } from "@/lib/ApiProvider";
import { DocumentsProvider } from "@/contexts/DocumentsContext";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Collab Editor",
  description: "Local-first collaborative document editor",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased light`}
      style={{ colorScheme: "light" }}
    >
      <body className="min-h-full flex flex-col">
        <ConfigProvider>
          <ApiProvider>
            <DocumentsProvider>{children}</DocumentsProvider>
          </ApiProvider>
        </ConfigProvider>
      </body>
    </html>
  );
}
