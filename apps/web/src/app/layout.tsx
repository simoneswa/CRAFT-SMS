"use client"

import { Inter } from "next/font/google";
import "./globals.css";
import { useEffect } from "react";
import { TenantProvider } from "@/providers/TenantProvider";
import { AuthProvider } from "@/providers/AuthProvider";
import { ToastProvider } from "@/providers/ToastProvider";
import { DemoModeProvider } from "@/providers/DemoModeProvider";
import { SyncProvider } from "@/providers/SyncProvider";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .then((registration) => console.log("SW registered:", registration))
        .catch((err) => console.log("SW registration failed:", err));
    }
  }, []);

  return (
    <html lang="en" className="dark">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#0F4C81" />
      </head>
      <body className={`${inter.variable} font-sans antialiased`}>
        <AuthProvider>
          <TenantProvider>
            <SyncProvider>
              <ToastProvider>
                <DemoModeProvider>
                  {children}
                </DemoModeProvider>
              </ToastProvider>
            </SyncProvider>
          </TenantProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
