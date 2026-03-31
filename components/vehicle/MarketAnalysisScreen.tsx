"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  Pencil,
  TrendingUp
} from "lucide-react";
import { useVehicleLookup } from "@/hooks/useVehicleLookup";
import { formatDisplayPlate } from "@/lib/rdw/normalize";
import styles from "./MarketAnalysisScreen.module.css";
import { VehicleNavBar } from "./VehicleNavBar";
import { PremiumLock } from "../ui/PremiumLock";
import { useI18n } from "@/lib/i18n/context";


type Props = {
  plate: string;
};

function formatCurrency(value: number | null) {
  if (value === null || Number.isNaN(value)) return "-";
  return new Intl.NumberFormat("nl-NL", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0
  }).format(value);
}

function formatNumber(value: number | null) {
  if (value === null || Number.isNaN(value)) return "-";
  return value.toLocaleString("nl-NL");
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

export function MarketAnalysisScreen({ plate }: Props) {
  const { locale } = useI18n();
  const { normalized, isValid, data, isLoading, isError } = useVehicleLookup(plate);
  const [sellerPrice, setSellerPrice] = useState<string>("");

  const marketValue = data?.enriched?.estimatedValueNow ?? data?.vehicle.cataloguePrice ?? null;
  const marketValueMin = data?.enriched?.estimatedValueMin ?? null;
  const marketValueMax = data?.enriched?.estimatedValueMax ?? null;
  const marketConfidence = data?.enriched?.marketValueConfidence ?? null;

  useEffect(() => {
    if (!sellerPrice && marketValue) {
      setSellerPrice(String(Math.round(marketValue + 900)));
    }
  }, [marketValue, sellerPrice]);

  const { verdictText, verdictTone, markerLeft } = useMemo(() => {
    if (!marketValue) {
      return {
        verdictText: locale === "nl" ? "Marktwaarde niet beschikbaar." : "Market value unavailable.",
        verdictTone: "neutral",
        markerLeft: "50%"
      };
    }

    const seller = Number(sellerPrice.replace(/[^0-9]/g, ""));
    const diff = seller - marketValue;

    const verdictTone = diff > 500 ? "warning" : diff < -500 ? "success" : "fair";
    const verdictText = diff > 500
      ? locale === "nl"
        ? `Voertuig staat EUR ${formatNumber(diff)} boven de marktwaarde.`
        : `Vehicle is priced EUR ${formatNumber(diff)} above market value.`
      : diff < -500
      ? locale === "nl"
        ? `Voertuig staat EUR ${formatNumber(Math.abs(diff))} onder de marktwaarde.`
        : `Vehicle is priced EUR ${formatNumber(Math.abs(diff))} below market value.`
      : locale === "nl"
      ? "Vraagprijs ligt in lijn met de marktwaarde."
      : "Listing price aligns with market value.";

    const marker = clamp(((diff + 3000) / 6000) * 100, 5, 95);

    return {
      verdictText,
      verdictTone,
      markerLeft: `${marker}%`
    };
  }, [marketValue, sellerPrice, locale]);

  const chartPoints = useMemo(() => {
    const year = new Date().getFullYear();
    if (!marketValue) {
      return [
        { label: year - 4, value: null },
        { label: year - 3, value: null },
        { label: year - 2, value: null },
        { label: year - 1, value: null },
        { label: locale === "nl" ? "Vandaag" : "Today", value: null }
      ];
    }
    const start = marketValue * 1.65;
    const step = (start - marketValue) / 4;
    return [
      { label: year - 4, value: Math.round(start) },
      { label: year - 3, value: Math.round(start - step) },
      { label: year - 2, value: Math.round(start - step * 2) },
      { label: year - 1, value: Math.round(start - step * 3) },
      { label: locale === "nl" ? "Vandaag" : "Today", value: Math.round(marketValue) }
    ];
  }, [marketValue, locale]);

  if (!isValid || isError) {
    return (
      <div className={styles.loadingScreen}>
        <div className={styles.loadingCard}>
          <AlertCircle size={18} /> {locale === "nl" ? "Voertuig niet gevonden." : "Vehicle not found."}
        </div>
      </div>
    );
  }

  if (isLoading || !data || !data.enriched) {
    return (
      <div className={styles.loadingScreen}>
        <div className={styles.loadingCard}>{locale === "nl" ? "Marktanalyse laden..." : "Loading market analysis..."}</div>
      </div>
    );
  }

  const v = data.vehicle;
  const enriched = data.enriched;
  const estimateRows = [
    { label: locale === "nl" ? "Geschatte waarde" : "Estimated value", value: formatCurrency(enriched.estimatedValueNow) },
    {
      label: locale === "nl" ? "Waardebandbreedte" : "Value range",
      value:
        enriched.estimatedValueMin && enriched.estimatedValueMax
          ? `${formatCurrency(enriched.estimatedValueMin)} - ${formatCurrency(enriched.estimatedValueMax)}`
          : "-"
    },
    { label: locale === "nl" ? "Marktbetrouwbaarheid" : "Market confidence", value: enriched.marketValueConfidence ?? "UNKNOWN" },
    { label: locale === "nl" ? "Marktsignaal" : "Market signal", value: enriched.mileageVerdict ?? "UNKNOWN" },
    { label: locale === "nl" ? "APK slagingskans" : "APK pass chance", value: `${enriched.apkPassChance}%` },
    {
      label: locale === "nl" ? "Wegenbelasting (per kwartaal)" : "Road tax (per quarter)",
      value:
        enriched.roadTaxEstQuarter
          ? `${formatCurrency(enriched.roadTaxEstQuarter.min)} - ${formatCurrency(enriched.roadTaxEstQuarter.max)}`
          : "-"
    },
    { label: locale === "nl" ? "Brandstofschatting / maand" : "Fuel est. / month", value: formatCurrency(enriched.fuelEstMonth) },
    { label: locale === "nl" ? "Verzekering schatting / maand" : "Insurance est. / month", value: formatCurrency(enriched.insuranceEstMonth) },
    { label: locale === "nl" ? "Onderhoudsrisico" : "Maintenance risk", value: `${enriched.maintenanceRiskScore.toFixed(1)} / 10` }
  ];
  const displayPlate = formatDisplayPlate(normalized);
  const title = [v.brand, v.tradeName, v.year].filter(Boolean).join(" ");

  return (
    <div className={styles.pageContainer}>
      <div className={styles.contentContainer}>
        <VehicleNavBar plate={normalized} subtitle={`${locale === "nl" ? "Marktanalyse" : "Market analysis"} · ${displayPlate}`} />

        <PremiumLock featureName={locale === "nl" ? "Marktanalyse" : "Market Analysis"} isLocked={true}>
          <div className={styles.dashboardHeader}>
            <h1 className={styles.dashboardTitle}>{locale === "nl" ? "Marktprijsanalyse" : "Market Price Analysis"}</h1>
            <p className={styles.dashboardSubtitle}>{title || (locale === "nl" ? "Voertuigprofiel" : "Vehicle profile")}</p>
          </div>

          <div className={styles.mainGrid}>
            <div className={styles.panel}>
              <div className={styles.valueHero}>
                <div className={styles.valueLabel}>{locale === "nl" ? "Geschatte marktwaarde" : "Estimated Market Value"}</div>
                <div className={styles.valueAmount}>{formatCurrency(marketValue)}</div>
                <div className={styles.valueContext}>
                  <TrendingUp size={16} />
                  {marketValue ? (locale === "nl" ? "Hoge vraag in de markt" : "High demand in current market") : locale === "nl" ? "Wacht op marktsignaal" : "Awaiting market signal"}
                </div>
                <div className={styles.valueRange}>
                  {marketValueMin != null && marketValueMax != null
                    ? `80% ${locale === "nl" ? "bandbreedte" : "range"}: ${formatCurrency(marketValueMin)} - ${formatCurrency(marketValueMax)}`
                    : locale === "nl"
                    ? "80% bandbreedte niet beschikbaar"
                    : "80% range unavailable"}
                  {marketConfidence ? (
                    <span className={styles.valueConfidence}>{locale === "nl" ? "Betrouwbaarheid" : "Confidence"}: {marketConfidence}</span>
                  ) : null}
                </div>
              </div>

              <div className={styles.chartContainer}>
                <div className={styles.chartHeader}>
                  <div className={styles.chartTitle}>{locale === "nl" ? "Waardetrend over tijd" : "Value trend over time"}</div>
                  <div className={styles.chartNote}>{locale === "nl" ? "Gebaseerd op vergelijkbare advertenties" : "Based on similar listings"}</div>
                </div>

                <div className={styles.chartMock}>
                  {chartPoints.map((point, index) => {
                    const maxValue = Math.max(...chartPoints.map((p) => p.value ?? 0), 1);
                    const height = point.value ? `${(point.value / maxValue) * 90}%` : "20%";
                    const isCurrent = index === chartPoints.length - 1;
                    return (
                      <div key={String(point.label)} className={styles.barGroup}>
                        <div className={styles.barValue}>{point.value ? formatCurrency(point.value) : "-"}</div>
                        <div className={`${styles.bar} ${isCurrent ? styles.barCurrent : ""}`} style={{ height }} />
                        <div className={`${styles.barLabel} ${isCurrent ? styles.barLabelCurrent : ""}`}>
                          {point.label}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className={`${styles.panel} ${styles.calcPanel}`}>
              <div className={styles.calcHeader}>
                <div className={styles.calcTitle}>{locale === "nl" ? "Controleer vraagprijs" : "Check a listing price"}</div>
                <div className={styles.calcSubtitle}>{locale === "nl" ? "Vergelijk de prijs van de verkoper met onze marktdata" : "Compare seller's price against our market data"}</div>
              </div>

              <div className={styles.inputGroup}>
                <div className={styles.inputLabel}>{locale === "nl" ? "Vraagprijs verkoper" : "Seller asking price"}</div>
                <div className={styles.inputMock}>
                  <span className={styles.inputMockText}>EUR</span>
                  <input
                    className={styles.priceInput}
                    inputMode="numeric"
                    value={sellerPrice}
                    onChange={(event) => setSellerPrice(event.target.value)}
                    placeholder="14000"
                  />
                  <span className={styles.inputMockIcon}>
                    <Pencil size={20} />
                  </span>
                </div>
              </div>

              <div className={styles.meterSection}>
                <div className={styles.meterTrack}>
                  <div className={styles.meterMarker} style={{ left: markerLeft }} />
                </div>
                <div className={styles.meterLabels}>
                  <span className={styles.meterCheap}>{locale === "nl" ? "Goedkoop" : "Cheap"}</span>
                  <span className={styles.meterFair}>{locale === "nl" ? "Redelijk" : "Fair"}</span>
                  <span className={styles.meterOverpriced}>{locale === "nl" ? "Te duur" : "Overpriced"}</span>
                </div>
              </div>

              <div className={`${styles.verdictBox} ${styles[verdictTone] ?? ""}`}>
                <div className={styles.verdictHeader}>
                  <div className={styles.verdictIcon}>
                    <AlertCircle size={14} />
                  </div>
                  <div className={styles.verdictTitle}>{locale === "nl" ? "Prijsadvies" : "Price Verdict"}</div>
                </div>
                <div className={styles.verdictText}>{verdictText}</div>
              </div>
            </div>
          </div>

          <div className={styles.estimatesSection}>
            <div className={styles.estimatesHeader}>
              <div>
                <h3 className={styles.estimatesTitle}>{locale === "nl" ? "Schattingen & financien" : "Estimates & finances"}</h3>
                <p className={styles.estimatesNote}>{locale === "nl" ? "Marktwaarde, belasting en onderhoudssignaal." : "Market value, tax and the service signal."}</p>
              </div>
            </div>
            <div className={styles.estimatesGrid}>
              {estimateRows.map((row) => (
                <div key={row.label} className={styles.estimatesItem}>
                  <div className={styles.estimatesLabel}>{row.label}</div>
                  <div className={styles.estimatesValue}>{row.value}</div>
                </div>
              ))}
            </div>
          </div>
        </PremiumLock>

      </div>
    </div>
  );
}

