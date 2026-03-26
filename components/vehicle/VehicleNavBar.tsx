"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CarFront, Lock } from "lucide-react";
import styles from "./VehicleNavBar.module.css";

const navItems = [
  { href: "", label: "Overview", isPremium: false },
  { href: "technical-specs", label: "Tech Specs", isPremium: false },
  { href: "risk-overview", label: "Risk Overview", isPremium: true },
  { href: "mileage-history", label: "Mileage", isPremium: true },
  { href: "inspection-timeline", label: "APK Timeline", isPremium: false },
  { href: "damage-history", label: "Damage", isPremium: true },
  { href: "ownership-history", label: "Ownership", isPremium: false },
  { href: "market-analysis", label: "Market", isPremium: true }
];

type Props = {
  plate: string;
  subtitle?: string;
};

export function VehicleNavBar({ plate, subtitle = "Open detailed reports" }: Props) {
  const pathname = usePathname() ?? "";
  const base = `/search/${plate}`;

  return (
    <div className={styles.topbar}>
      <div className={styles.brandBlock}>
        <div className={styles.brandMark}>
          <CarFront size={18} />
        </div>
        <div className={styles.brandCopy}>
          <div className={styles.brandTitle}>Vehicle Overview</div>
          <div className={styles.brandSubtitle}>{subtitle}</div>
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

