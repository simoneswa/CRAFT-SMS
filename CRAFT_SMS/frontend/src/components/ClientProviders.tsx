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
          console.log('[SW] Controller changed — new service worker controlling.');
          // Avoid forcing a hard reload. Only reload when explicitly requested by the SW
          // (e.g., message { type: 'RELOAD_PAGE' }) to preserve user state.
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
                  console.log('[SW] New version installed — asking SW to skip waiting.');
                  // Tell the service worker to skip waiting, but do not force a page reload.
                  // The SW can notify the page via postMessage when it wants the page to reload.
                  installingWorker.postMessage({ type: "SKIP_WAITING" });
                }
              };
            }
          };
        })
        .catch((err) => console.error("SW registration failed:", err));
      // Listen for explicit reload messages from the service worker
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event?.data?.type === 'RELOAD_PAGE') {
          console.log('[SW] Received RELOAD_PAGE — reloading now');
          window.location.reload();
        }
      });
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
