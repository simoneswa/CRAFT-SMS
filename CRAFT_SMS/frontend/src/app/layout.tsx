"use client"

import { Inter } from "next/font/google";
import "./globals.css";
import { useEffect } from "react";
import { TenantProvider } from "../providers/TenantProvider";
import { ToastProvider } from "../providers/ToastProvider";
import { DemoModeProvider } from "../providers/DemoModeProvider";

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
      let refreshing = false;
      navigator.serviceWorker.addEventListener("controllerchange", () => {
        if (!refreshing) {
          refreshing = true;
          console.log('[SW] Controller changed — reloading for fresh cache');
          window.location.reload();
        }
      });

      navigator.serviceWorker
        .register("/sw.js")
        .then((registration) => {
          console.log("SW registered:", registration.scope);
          registration.update();

          registration.onupdatefound = () => {
            const installingWorker = registration.installing;
            if (installingWorker) {
              installingWorker.onstatechange = () => {
                if (installingWorker.state === "installed" && navigator.serviceWorker.controller) {
                  console.log('[SW] New version installed — sending SKIP_WAITING');
                  installingWorker.postMessage({ type: "SKIP_WAITING" });
                }
              };
            }
          };
        })
        .catch((err) => console.error("SW registration failed:", err));
    }
  }, []);

  return (
    <html lang="en" className="dark">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#0F4C81" />
        <meta httpEquiv="Cache-Control" content="no-cache, no-store, must-revalidate" />
        <meta httpEquiv="Pragma" content="no-cache" />
        <meta httpEquiv="Expires" content="0" />
      </head>
      <body className={`${inter.variable} font-sans antialiased bg-[var(--brand-surface)] text-[var(--brand-heading)]`}>
        <TenantProvider>
          <ToastProvider>
            <DemoModeProvider>{children}</DemoModeProvider>
          </ToastProvider>
        </TenantProvider>
      </body>
    </html>
  );
}
