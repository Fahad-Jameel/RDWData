"use client";

import type { RdwRecord } from "@/lib/rdw/types";
import { ShieldCheck, AlertTriangle } from "lucide-react";
import { useI18n } from "@/lib/i18n/context";

type Props = { items: RdwRecord[] };

export function RecallList({ items }: Props) {
  const { locale } = useI18n();

  if (items.length === 0) {
    return (
      <div className="flex items-center gap-4 rounded-xl border border-emerald-100 bg-emerald-50/60 px-5 py-4">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-emerald-100">
          <ShieldCheck className="h-4.5 w-4.5 text-emerald-600" />
        </div>
        <div>
          <p className="text-sm font-semibold text-emerald-800">{locale === "nl" ? "Geen actieve veiligheids-terugroepacties" : "No active safety recalls"}</p>
          <p className="text-xs text-emerald-600">{locale === "nl" ? "Kentekenrapport toont geen open terugroepcampagnes voor dit voertuig." : "Kentekenrapport shows no open recall campaigns for this vehicle."}</p>
        </div>
      </div>
    );
  }

  return (
    <ul className="space-y-2.5">
      {items.slice(0, 12).map((item, idx) => (
        <li key={`recall-${idx}`} className="overflow-hidden rounded-xl border border-amber-100 bg-amber-50">
          <div className="flex items-start gap-3.5 px-4 py-3.5">
            <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white shadow-sm ring-1 ring-amber-100">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-amber-900">
                {String(item.beschrijving_terugroepactie ?? item.omschrijving ?? item.code_omschrijving ?? (locale === "nl" ? "Veiligheids-terugroepactie" : "Safety recall"))}
              </p>
              {item.referentiecode_rdw && (
                <p className="mt-0.5 font-mono text-xs text-amber-600">
                  {locale === "nl" ? "Ref" : "Ref"}: {String(item.referentiecode_rdw)}
                </p>
              )}
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}
