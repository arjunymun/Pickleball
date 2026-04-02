"use client";

import { useEffect, useState } from "react";
import { Download } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

export function PwaInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    function handlePrompt(event: Event) {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
    }

    function handleInstalled() {
      setIsInstalled(true);
      setDeferredPrompt(null);
    }

    window.addEventListener("beforeinstallprompt", handlePrompt);
    window.addEventListener("appinstalled", handleInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handlePrompt);
      window.removeEventListener("appinstalled", handleInstalled);
    };
  }, []);

  if (!deferredPrompt || isInstalled) {
    return null;
  }

  return (
    <button
      type="button"
      className="secondary-button px-4 py-2 text-sm"
      onClick={async () => {
        await deferredPrompt.prompt();
        await deferredPrompt.userChoice;
        setDeferredPrompt(null);
      }}
    >
      <Download className="h-4 w-4" />
      Install app
    </button>
  );
}
