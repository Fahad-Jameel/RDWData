"use client";

import Link from "next/link";
import {
  AlertCircle,
  ArrowLeft,
  BadgeCheck,
  Download,
  Share2,
  Shield,
  Sparkles,
  Wrench
} from "lucide-react";
import styles from "./DamageHistoryScreen.module.css";
import { VehicleNavBar } from "./VehicleNavBar";
import { PremiumLock } from "../ui/PremiumLock";
import { useI18n } from "@/lib/i18n/context";


type Props = {
  plate?: string;
};


function buildPlateHref(plate: string | undefined, suffix = "") {
  if (!plate) return suffix || "/";
  return `/search/${plate}${suffix}`;
}

function SeverityChip({ tone, label }: { tone: "warning" | "low"; label: string }) {
  return (
    <span className={`${styles.severityChip} ${tone === "low" ? styles.severityChipLow : ""}`}>
      {label}
    </span>
  );
}

export function DamageHistoryScreen({ plate }: Props) {
  const { locale } = useI18n();
  const isNl = locale === "nl";
  const backHref = buildPlateHref(plate);

  const markers = [
    { id: "front", label: isNl ? "Voorbumper" : "Front bumper", active: false },
    { id: "rear", label: isNl ? "Achterdeur" : "Rear door", active: true },
    { id: "left", label: isNl ? "Linkerpaneel" : "Left panel", active: false }
  ];

  const legendItems = [
    { id: "minor", label: isNl ? "Kleine reparatie" : "Minor repair", count: "2" },
    { id: "panel", label: isNl ? "Paneelvervanging" : "Panel replacement", count: "1" },
    { id: "paint", label: isNl ? "Spuitwerk" : "Paint work", count: "1" }
  ];

  const detailCards = [
    {
      kicker: isNl ? "Event 01" : "Event 01",
      title: isNl ? "Achterdeur vervangen" : "Rear door replacement",
      severity: isNl ? "Middel" : "Moderate",
      severityTone: "warning",
      date: "Mar 2023",
      cost: "EUR 1,200",
      location: "Rotterdam",
      status: isNl ? "Afgerond" : "Resolved",
      tags: [isNl ? "Achterpaneel" : "Rear panel", isNl ? "Verzekeringsclaim" : "Insurance claim"]
    },
    {
      kicker: isNl ? "Event 02" : "Event 02",
      title: isNl ? "Voorbumper gerepareerd" : "Front bumper repair",
      severity: isNl ? "Laag" : "Low",
      severityTone: "low",
      date: "Sep 2022",
      cost: "EUR 350",
      location: "Utrecht",
      status: isNl ? "Afgerond" : "Resolved",
      tags: [isNl ? "Cosmetisch" : "Cosmetic", isNl ? "Geen structurele impact" : "No structural impact"]
    }
  ];

  return (
    <div className={styles.page}>
      <div className={styles.shell}>
        {plate ? (
          <VehicleNavBar plate={plate} subtitle={isNl ? "Schadehistorie" : "Damage history"} />
        ) : (
          <div className={`${styles.topbar} ${styles.surface}`}>
            <div className={styles.brand}>
              <Link href={backHref} className={styles.backBtn} aria-label={isNl ? "Terug" : "Back"}>
                <ArrowLeft size={18} />
              </Link>
              <div className={styles.brandCopy}>
                <div className={styles.brandTitle}>{isNl ? "Schadehistorie" : "Damage history"}</div>
                <div className={styles.brandSubtitle}>{isNl ? "Carrosserie-events en reparatiemarkeringen" : "Vehicle body events and repair markers"}</div>
              </div>
            </div>
            <div className={styles.topActions}>
              <button className={styles.pillBtn} type="button">
                <Shield size={16} /> {isNl ? "Schadescore" : "Damage score"}
              </button>
              <button className={styles.pillBtn} type="button">
                <Share2 size={16} /> {isNl ? "Delen" : "Share"}
              </button>
              <button className={`${styles.pillBtn} ${styles.pillPrimary}`} type="button">
                <Download size={16} /> {isNl ? "Historie exporteren" : "Export history"}
              </button>
            </div>
          </div>
        )}

        <PremiumLock featureName={isNl ? "Schadehistorie" : "Damage History"} isLocked={true}>
          <div className={styles.hero}>
            <div className={`${styles.heroMain} ${styles.surface}`}>
              <div className={styles.eyebrow}>
                <Sparkles size={14} /> {isNl ? "Interactieve carrosseriekaart" : "Interactive body map"}
              </div>
              <div className={styles.headlineBlock}>
                <div className={styles.headline}>
                  {isNl
                    ? "Bekijk schadepunten, reparatieschattingen en signalen van een schone historie in een overzicht."
                    : "Review visual damage markers, repair estimates, and clean-history signals in one focused workspace."}
                </div>
                <div className={styles.subhead}>
                  {isNl
                    ? "Gebruik het carrosseriediagram om gemelde zones te inspecteren. Elke marker staat voor een event zoals voorbumper-, achterdeur- of linkerpaneelschade."
                    : "Use the car body diagram to inspect reported zones. Each marker represents a clickable event such as front bumper, rear door, or left panel damage."}
                </div>
              </div>
              <div className={styles.heroStats}>
                <div className={styles.statCard}>
                  <div className={styles.statLabel}>{isNl ? "Gedetecteerde markers" : "Detected markers"}</div>
                  <div className={styles.statValue}>{isNl ? "3 panelen" : "3 panels"}</div>
                </div>
                <div className={styles.statCard}>
                  <div className={styles.statLabel}>{isNl ? "Grote ongevallen" : "Major accidents"}</div>
                  <div className={styles.statValue}>{isNl ? "Geen gevonden" : "None found"}</div>
                </div>
                <div className={styles.statCard}>
                  <div className={styles.statLabel}>{isNl ? "Laatste event" : "Latest event"}</div>
                  <div className={styles.statValue}>Mar 2023</div>
                </div>
              </div>
            </div>

            <div className={`${styles.heroSide} ${styles.surface}`}>
              <div className={styles.summaryTitle}>{isNl ? "Schadesamenvatting" : "Damage summary"}</div>
              <div className={styles.summaryCard}>
                <div className={`${styles.statusPill} ${styles.statusSuccess}`}>
                  <BadgeCheck size={12} /> {isNl ? "Geen ongevalshistorie gevonden" : "No accident history found"}
                </div>
                <div className={styles.summaryValue}>{isNl ? "Laag risico" : "Low risk"}</div>
                <div className={styles.summaryCopy}>
                  {isNl
                    ? "Geen patroon van zware ongevallen in het zichtbare rapport. Gemelde schade lijkt beperkt en lokaal."
                    : "No major accident pattern appears in the visible report. Minor bodywork markers are limited and read as localized repairs rather than structural damage."}
                </div>
                <div className={styles.summaryBar}>
                  <div className={styles.summaryFill} />
                </div>
              </div>
              <div className={styles.summaryCard}>
                <div className={`${styles.statusPill} ${styles.statusWarning}`}>
                  <AlertCircle size={12} /> {isNl ? "Achterdeurreparatie" : "Rear door repair"}
                </div>
                <div className={styles.summaryCopy}>
                  {isNl
                    ? "Geschatte reparatiekosten zijn gemiddeld en het event lijkt geïsoleerd. Open de kaarten hieronder voor details."
                    : "Estimated repair cost is moderate and the event appears isolated. Open the cards below to compare date, severity, and repair scope across all visible markers."}
                </div>
              </div>
            </div>
          </div>

          <div className={styles.contentGrid}>
            <div className={`${styles.diagramPanel} ${styles.surface}`}>
              <div className={styles.panelHead}>
                <div className={styles.panelTitleGroup}>
                  <div className={styles.panelTitle}>{isNl ? "Carrosseriediagram" : "Vehicle body diagram"}</div>
                  <div className={styles.panelCopy}>
                    {isNl
                      ? "Klikbare markers tonen waar schade is gemeld en welk paneel is gerepareerd of gecontroleerd."
                      : "Clickable markers help scan where damage was reported and which panel was repaired or reviewed."}
                  </div>
                </div>
                <div className={styles.viewSwitch}>
                  <button className={`${styles.switchItem} ${styles.switchActive}`} type="button">
                    {isNl ? "Diagram" : "Diagram view"}
                  </button>
                  <button className={styles.switchItem} type="button">
                    {isNl ? "Historielijst" : "History list"}
                  </button>
                </div>
              </div>

              <div className={styles.diagramStage}>
                <div className={styles.carZone}>
                  <div className={styles.carLabel}>{isNl ? "Bovenaanzicht · carrosseriezones" : "Top view · body zones"}</div>
                  <div className={styles.carDiagram}>
                    <div className={styles.carBase} />
                    <div className={styles.carCabin} />
                    <div className={`${styles.wheel} ${styles.wheelLeft}`} />
                    <div className={`${styles.wheel} ${styles.wheelRight}`} />

                    {markers.map((marker) => (
                      <button
                        key={marker.id}
                        className={`${styles.damageMarker} ${styles[marker.id]} ${marker.active ? styles.markerActive : ""}`}
                        type="button"
                        aria-label={marker.label}
                      >
                        <Wrench size={16} />
                      </button>
                    ))}
                  </div>
                </div>

                <div className={styles.legendCard}>
                  <div className={styles.legendTitle}>{isNl ? "Legenda" : "Legend"}</div>
                  <div className={styles.legendList}>
                    {legendItems.map((item) => (
                      <div className={styles.legendItem} key={item.id}>
                        <div className={styles.legendLeft}>
                          <span
                            className={`${styles.legendDot} ${item.id === "panel" ? styles.dotPrimary : styles.dotWarning}`}
                          />
                          <span className={styles.legendName}>{item.label}</span>
                        </div>
                        <span className={styles.legendValue}>{item.count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className={styles.detailColumn}>
              <div className={styles.cleanCard}>
                <div className={styles.cleanTop}>
                  <div className={styles.cleanIcon}>
                    <BadgeCheck size={18} />
                  </div>
                  <div>
                    <div className={styles.cleanTitle}>{isNl ? "Schone structurele rapportage" : "Clean structural report"}</div>
                    <div className={styles.cleanCopy}>
                      {isNl
                        ? "Geen structurele schade of chassisafwijkingen gedetecteerd in de beschikbare data."
                        : "No structural damage or chassis misalignment detected in the available dataset."}
                    </div>
                  </div>
                </div>
              </div>

              {detailCards.map((card) => (
                <div className={styles.detailCard} key={card.title}>
                  <div className={styles.detailHead}>
                    <div className={styles.detailTitleWrap}>
                      <div className={styles.detailKicker}>{card.kicker}</div>
                      <div className={styles.detailTitle}>{card.title}</div>
                    </div>
                    <SeverityChip tone={card.severityTone as "warning" | "low"} label={card.severity} />
                  </div>
                  <div className={styles.detailGrid}>
                    <div className={styles.infoBox}>
                      <div className={styles.infoLabel}>{isNl ? "Meldingsdatum" : "Reported date"}</div>
                      <div className={styles.infoValue}>{card.date}</div>
                    </div>
                    <div className={styles.infoBox}>
                      <div className={styles.infoLabel}>{isNl ? "Schatting" : "Estimate"}</div>
                      <div className={styles.infoValue}>{card.cost}</div>
                    </div>
                    <div className={styles.infoBox}>
                      <div className={styles.infoLabel}>{isNl ? "Locatie" : "Location"}</div>
                      <div className={styles.infoValue}>{card.location}</div>
                    </div>
                    <div className={styles.infoBox}>
                      <div className={styles.infoLabel}>{isNl ? "Status" : "Status"}</div>
                      <div className={styles.infoValue}>{card.status}</div>
                    </div>
                  </div>
                  <div className={styles.detailCopy}>
                    {isNl
                      ? "Reparatie lijkt lokaal beperkt. Geen grote structurele impact gemeld. Controleer indien nodig facturen."
                      : "Repair scope appears localized. No major structural impact reported. Validate against service invoices if needed."}
                  </div>
                  <div className={styles.detailFooter}>
                    <div className={styles.tagRow}>
                      {card.tags.map((tag) => (
                        <span key={tag} className={styles.miniTag}>
                          {tag}
                        </span>
                      ))}
                    </div>
                    <button className={styles.linkBtn} type="button">
                      {isNl ? "Documenten bekijken" : "View documents"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </PremiumLock>

      </div>
    </div>
  );
}

