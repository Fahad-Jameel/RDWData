"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CarFront, Lock } from "lucide-react";
import { useI18n } from "@/lib/i18n/context";
import styles from "./VehicleNavBar.module.css";

type Props = {
  plate: string;
  subtitle?: string;
};

export function VehicleNavBar({ plate, subtitle = "Open detailed reports" }: Props) {
  const { locale } = useI18n();
  const resolvedSubtitle = subtitle === "Open detailed reports" ? (locale === "nl" ? "Open gedetailleerde rapporten" : subtitle) : subtitle;
  const pathname = usePathname() ?? "";
  const base = `/search/${plate}`;
  const navItems =
    locale === "nl"
      ? [
          { href: "", label: "Overzicht", isPremium: false },
          { href: "technical-specs", label: "Technische specs", isPremium: false },
          { href: "risk-overview", label: "Risico-overzicht", isPremium: true },
          { href: "mileage-history", label: "Kilometerstand", isPremium: true },
          { href: "inspection-timeline", label: "APK-tijdlijn", isPremium: false },
          { href: "damage-history", label: "Schade", isPremium: true },
          { href: "ownership-history", label: "Eigendom", isPremium: false },
          { href: "market-analysis", label: "Markt", isPremium: true },
          { href: "negotiation-copilot", label: "Onderhandelcoach", isPremium: true },
          { href: "apk-failure-intelligence", label: "APK Intelligence", isPremium: true },
          { href: "post-purchase-watch", label: "Watch mode", isPremium: true }
        ]
      : [
          { href: "", label: "Overview", isPremium: false },
          { href: "technical-specs", label: "Tech Specs", isPremium: false },
          { href: "risk-overview", label: "Risk Overview", isPremium: true },
          { href: "mileage-history", label: "Mileage", isPremium: true },
          { href: "inspection-timeline", label: "APK Timeline", isPremium: false },
          { href: "damage-history", label: "Damage", isPremium: true },
          { href: "ownership-history", label: "Ownership", isPremium: false },
          { href: "market-analysis", label: "Market", isPremium: true },
          { href: "negotiation-copilot", label: "Negotiation Copilot", isPremium: true },
          { href: "apk-failure-intelligence", label: "APK Intelligence", isPremium: true },
          { href: "post-purchase-watch", label: "Watch mode", isPremium: true }
        ];

  return (
    <div className={styles.topbar}>
      <div className={styles.brandBlock}>
        <div className={styles.brandMark}>
          <CarFront size={18} />
        </div>
        <div className={styles.brandCopy}>
          <div className={styles.brandTitle}>{locale === "nl" ? "Voertuigoverzicht" : "Vehicle Overview"}</div>
          <div className={styles.brandSubtitle}>{resolvedSubtitle}</div>
        </div>
      </div>
      <div className={styles.topbarRight}>
        {navItems.map((item) => {
          const href = item.href ? `${base}/${item.href}` : base;
          const isActive = pathname === href || pathname === `${href}/`;
          return (
            <Link
              key={item.href}
              href={href}
              className={`${styles.navPill} ${isActive ? styles.navPillActive : ""} ${item.isPremium ? styles.navPillPremium : ""}`}
            >
              {item.label}
              {item.isPremium && <Lock size={10} className={styles.lockIcon} />}
            </Link>
          );
        })}
      </div>
    </div>
  );
}

