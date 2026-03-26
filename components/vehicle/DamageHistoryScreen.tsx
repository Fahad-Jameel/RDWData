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


type Props = {
  plate?: string;
};


function buildPlateHref(plate: string | undefined, suffix = "") {
  if (!plate) return suffix || "/";
  return `/search/${plate}${suffix}`;
}

const markers = [
  { id: "front", label: "Front bumper", active: false },
  { id: "rear", label: "Rear door", active: true },
  { id: "left", label: "Left panel", active: false }
];

const legendItems = [
  { id: "minor", label: "Minor repair", count: "2" },
  { id: "panel", label: "Panel replacement", count: "1" },
  { id: "paint", label: "Paint work", count: "1" }
];

const detailCards = [
  {
    kicker: "Event 01",
    title: "Rear door replacement",
    severity: "Moderate",
    severityTone: "warning",
    date: "Mar 2023",
    cost: "€1,200",
    location: "Rotterdam",
    status: "Resolved",
    tags: ["Rear panel", "Insurance claim"]
  },
  {
    kicker: "Event 02",
    title: "Front bumper repair",
    severity: "Low",
    severityTone: "low",
    date: "Sep 2022",
    cost: "€350",
    location: "Utrecht",
    status: "Resolved",
    tags: ["Cosmetic", "No structural impact"]
  }
];

function SeverityChip({ tone, label }: { tone: "warning" | "low"; label: string }) {
  return (
    <span className={`${styles.severityChip} ${tone === "low" ? styles.severityChipLow : ""}`}>
      {label}
    </span>
  );
}

export function DamageHistoryScreen({ plate }: Props) {
  const backHref = buildPlateHref(plate);
  return (
    <div className={styles.page}>
      <div className={styles.shell}>
        {plate ? (
          <VehicleNavBar plate={plate} subtitle="Damage history" />
        ) : (
          <div className={`${styles.topbar} ${styles.surface}`}>
            <div className={styles.brand}>
              <Link href={backHref} className={styles.backBtn} aria-label="Back">
                <ArrowLeft size={18} />
              </Link>
              <div className={styles.brandCopy}>
                <div className={styles.brandTitle}>Damage history</div>
                <div className={styles.brandSubtitle}>Vehicle body events and repair markers</div>
              </div>
            </div>
            <div className={styles.topActions}>
              <button className={styles.pillBtn} type="button">
                <Shield size={16} /> Damage score
              </button>
              <button className={styles.pillBtn} type="button">
                <Share2 size={16} /> Share
              </button>
              <button className={`${styles.pillBtn} ${styles.pillPrimary}`} type="button">
                <Download size={16} /> Export history
              </button>
            </div>
          </div>
        )}

        <PremiumLock featureName="Damage History" isLocked={true}>
          <div className={styles.hero}>
            <div className={`${styles.heroMain} ${styles.surface}`}>
              <div className={styles.eyebrow}>
                <Sparkles size={14} /> Interactive body map
              </div>
              <div className={styles.headlineBlock}>
                <div className={styles.headline}>
                  Review visual damage markers, repair estimates, and clean-history signals in one focused workspace.
                </div>
                <div className={styles.subhead}>
                  Use the car body diagram to inspect reported zones. Each marker represents a clickable event such as front
                  bumper, rear door, or left panel damage.
                </div>
              </div>
              <div className={styles.heroStats}>
                <div className={styles.statCard}>
                  <div className={styles.statLabel}>Detected markers</div>
                  <div className={styles.statValue}>3 panels</div>
                </div>
                <div className={styles.statCard}>
                  <div className={styles.statLabel}>Major accidents</div>
                  <div className={styles.statValue}>None found</div>
                </div>
                <div className={styles.statCard}>
                  <div className={styles.statLabel}>Latest event</div>
                  <div className={styles.statValue}>Mar 2023</div>
                </div>
              </div>
            </div>

            <div className={`${styles.heroSide} ${styles.surface}`}>
              <div className={styles.summaryTitle}>Damage summary</div>
              <div className={styles.summaryCard}>
                <div className={`${styles.statusPill} ${styles.statusSuccess}`}>
                  <BadgeCheck size={12} /> No accident history found
                </div>
                <div className={styles.summaryValue}>Low risk</div>
                <div className={styles.summaryCopy}>
                  No major accident pattern appears in the visible report. Minor bodywork markers are limited and read as
                  localized repairs rather than structural damage.
                </div>
                <div className={styles.summaryBar}>
                  <div className={styles.summaryFill} />
                </div>
              </div>
              <div className={styles.summaryCard}>
                <div className={`${styles.statusPill} ${styles.statusWarning}`}>
                  <AlertCircle size={12} /> Rear door repair
                </div>
                <div className={styles.summaryCopy}>
                  Estimated repair cost is moderate and the event appears isolated. Open the cards below to compare date,
                  severity, and repair scope across all visible markers.
                </div>
              </div>
            </div>
          </div>

          <div className={styles.contentGrid}>
            <div className={`${styles.diagramPanel} ${styles.surface}`}>
              <div className={styles.panelHead}>
                <div className={styles.panelTitleGroup}>
                  <div className={styles.panelTitle}>Vehicle body diagram</div>
                  <div className={styles.panelCopy}>
                    Clickable markers help scan where damage was reported and which panel was repaired or reviewed.
                  </div>
                </div>
                <div className={styles.viewSwitch}>
                  <button className={`${styles.switchItem} ${styles.switchActive}`} type="button">
                    Diagram view
                  </button>
                  <button className={styles.switchItem} type="button">
                    History list
                  </button>
                </div>
              </div>

              <div className={styles.diagramStage}>
                <div className={styles.carZone}>
                  <div className={styles.carLabel}>Top view · body zones</div>
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
                  <div className={styles.legendTitle}>Legend</div>
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
                    <div className={styles.cleanTitle}>Clean structural report</div>
                    <div className={styles.cleanCopy}>
                      No structural damage or chassis misalignment detected in the available dataset.
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
                      <div className={styles.infoLabel}>Reported date</div>
                      <div className={styles.infoValue}>{card.date}</div>
                    </div>
                    <div className={styles.infoBox}>
                      <div className={styles.infoLabel}>Estimate</div>
                      <div className={styles.infoValue}>{card.cost}</div>
                    </div>
                    <div className={styles.infoBox}>
                      <div className={styles.infoLabel}>Location</div>
                      <div className={styles.infoValue}>{card.location}</div>
                    </div>
                    <div className={styles.infoBox}>
                      <div className={styles.infoLabel}>Status</div>
                      <div className={styles.infoValue}>{card.status}</div>
                    </div>
                  </div>
                  <div className={styles.detailCopy}>
                    Repair scope appears localized. No major structural impact reported. Validate against service invoices if
                    needed.
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
                      View documents
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
