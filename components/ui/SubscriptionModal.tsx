"use client";

import React, { useEffect, useState } from "react";
import { X, Check, ShieldCheck, Zap, Sparkles } from "lucide-react";
import styles from "./SubscriptionModal.module.css";
import { Button } from "./Button";

interface SubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  featureName: string;
}

export function SubscriptionModal({ isOpen, onClose, featureName }: SubscriptionModalProps) {
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
            <Zap size={14} /> Full Access
          </div>
          <h2 className={styles.title}>Unlock Premium Vehicle History</h2>
          <p className={styles.subtitle}>
            To unlock the <span className={styles.bold}>{featureName}</span> and other premium data, you have to purchase a report or subscription.
          </p>
        </div>

        <div className={styles.plans}>
          <div className={`${styles.planCard} ${styles.planActive}`}>
            <div className={styles.planHeader}>
              <div className={styles.planName}>Premium Single</div>
              <div className={styles.planPrice}>€9.95<span>/report</span></div>
            </div>
            <ul className={styles.features}>
              <li><Check size={14} className={styles.checkIcon} /> Full {featureName}</li>
              <li><Check size={14} className={styles.checkIcon} /> NAP Odometer History</li>
              <li><Check size={14} className={styles.checkIcon} /> 24/7 Stolen Check</li>
            </ul>
            <Button variant="primary" className={styles.planBtn}>Get Single Report</Button>
          </div>

          <div className={styles.planCard}>
            <div className={styles.planHeader}>
              <div className={styles.planName}>Business Pro</div>
              <div className={styles.planPrice}>€29.95<span>/mo</span></div>
            </div>
            <ul className={styles.features}>
              <li><Check size={14} className={styles.checkIcon} /> Unlimited lookups</li>
              <li><Check size={14} className={styles.checkIcon} /> Full B2B RDW Access</li>
              <li><Check size={14} className={styles.checkIcon} /> API & Export tools</li>
            </ul>
            <Button variant="outline" className={styles.planBtn}>Start Business Pro</Button>
          </div>
        </div>

        <div className={styles.footer}>
          <div className={styles.trustItem}>
            <ShieldCheck size={16} /> Verified RDW Data
          </div>
          <div className={styles.trustItem}>
            <Sparkles size={16} /> Best Price Guaranteed
          </div>
        </div>
      </div>
    </div>
  );
}
