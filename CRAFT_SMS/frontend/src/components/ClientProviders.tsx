"use client"

import { useEffect } from "react";
import { TenantProvider } from "../providers/TenantProvider";
import { ToastProvider } from "../providers/ToastProvider";
import { DemoModeProvider } from "../providers/DemoModeProvider";

export default function ClientProviders({ children }: { children: React.ReactNode }) {
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
    <TenantProvider>
      <ToastProvider>
        <DemoModeProvider>{children}</DemoModeProvider>
      </ToastProvider>
    </TenantProvider>
  );
}
