"use client";

import { useEffect, useState } from "react";
import { defaultSiteSettings, type PublicSiteSettings } from "@/lib/site-settings/defaults";

let cache: PublicSiteSettings | null = null;

export function useSiteSettings() {
  const [settings, setSettings] = useState<PublicSiteSettings>(cache ?? defaultSiteSettings);
  const [loading, setLoading] = useState(cache === null);

  useEffect(() => {
    let active = true;
    if (cache) {
      setLoading(false);
      return;
    }
    void fetch("/api/site/settings", { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) throw new Error("Unable to load site settings.");
        return (await response.json()) as PublicSiteSettings;
      })
      .then((payload) => {
        cache = payload;
        if (!active) return;
        setSettings(payload);
      })
      .catch(() => {
        if (!active) return;
        setSettings(defaultSiteSettings);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  return { settings, loading };
}

