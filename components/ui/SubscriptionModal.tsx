"use client";

import React, { useEffect, useState } from "react";
import { X, Check, ShieldCheck, Zap, Sparkles } from "lucide-react";
import styles from "./SubscriptionModal.module.css";
import { Button } from "./Button";
import { useI18n } from "@/lib/i18n/context";

interface SubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  featureName: string;
}

export function SubscriptionModal({ isOpen, onClose, featureName }: SubscriptionModalProps) {
  const { locale } = useI18n();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted || !isOpen) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <button className={styles.closeBtn} onClick={onClose}>
          <X size={20} />
        </button>

        <div className={styles.header}>
          <div className={styles.badge}>
            <Zap size={14} /> {locale === "nl" ? "Volledige toegang" : "Full Access"}
          </div>
          <h2 className={styles.title}>{locale === "nl" ? "Ontgrendel premium voertuighistorie" : "Unlock Premium Vehicle History"}</h2>
          <p className={styles.subtitle}>
            {locale === "nl"
              ? <>Om <span className={styles.bold}>{featureName}</span> en andere premium data te ontgrendelen, koop je een rapport of abonnement.</>
              : <>To unlock <span className={styles.bold}>{featureName}</span> and other premium data, you need a report or subscription.</>}
          </p>
        </div>

        <div className={styles.plans}>
          <div className={`${styles.planCard} ${styles.planActive}`}>
            <div className={styles.planHeader}>
              <div className={styles.planName}>{locale === "nl" ? "Premium enkel rapport" : "Premium Single"}</div>
              <div className={styles.planPrice}>EUR 9.95<span>/{locale === "nl" ? "rapport" : "report"}</span></div>
            </div>
            <ul className={styles.features}>
              <li><Check size={14} className={styles.checkIcon} /> {locale === "nl" ? `Volledige ${featureName}` : `Full ${featureName}`}</li>
              <li><Check size={14} className={styles.checkIcon} /> {locale === "nl" ? "NAP kilometerhistorie" : "NAP Odometer History"}</li>
              <li><Check size={14} className={styles.checkIcon} /> {locale === "nl" ? "24/7 diefstalcontrole" : "24/7 Stolen Check"}</li>
            </ul>
            <Button variant="primary" className={styles.planBtn}>{locale === "nl" ? "Koop enkel rapport" : "Get Single Report"}</Button>
          </div>

          <div className={styles.planCard}>
            <div className={styles.planHeader}>
              <div className={styles.planName}>Business Pro</div>
              <div className={styles.planPrice}>EUR 29.95<span>/{locale === "nl" ? "maand" : "mo"}</span></div>
            </div>
            <ul className={styles.features}>
              <li><Check size={14} className={styles.checkIcon} /> {locale === "nl" ? "Onbeperkt opzoeken" : "Unlimited lookups"}</li>
              <li><Check size={14} className={styles.checkIcon} /> {locale === "nl" ? "Volledige B2B RDW-toegang" : "Full B2B RDW Access"}</li>
              <li><Check size={14} className={styles.checkIcon} /> {locale === "nl" ? "API- en exporttools" : "API & Export tools"}</li>
            </ul>
            <Button variant="outline" className={styles.planBtn}>{locale === "nl" ? "Start Business Pro" : "Start Business Pro"}</Button>
          </div>
        </div>

        <div className={styles.footer}>
          <div className={styles.trustItem}>
            <ShieldCheck size={16} /> {locale === "nl" ? "Geverifieerde RDW-data" : "Verified RDW Data"}
          </div>
          <div className={styles.trustItem}>
            <Sparkles size={16} /> {locale === "nl" ? "Beste prijs garantie" : "Best Price Guaranteed"}
          </div>
        </div>
      </div>
    </div>
  );
}
