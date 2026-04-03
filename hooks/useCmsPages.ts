"use client";

import { useEffect, useState } from "react";

export type CmsPageLink = {
  _id: string;
  title: string;
  slug: string;
  showInHeader: boolean;
  showInFooter: boolean;
};

let cache: CmsPageLink[] | null = null;

export function useCmsPages() {
  const [pages, setPages] = useState<CmsPageLink[]>(cache ?? []);

  useEffect(() => {
    let active = true;
    if (cache) return;
    void fetch("/api/pages", { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) throw new Error("Failed");
        return (await response.json()) as CmsPageLink[];
      })
      .then((payload) => {
        cache = payload;
        if (!active) return;
        setPages(payload);
      })
      .catch(() => {
        if (!active) return;
        setPages([]);
      });
    return () => {
      active = false;
    };
  }, []);

  return pages;
}

