"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { normalizePlate, validateDutchPlate } from "@/lib/rdw/normalize";
import { useI18n } from "@/lib/i18n/context";
import {
  Building2,
  Briefcase,
  MapPin,
  Scale,
  CarFront,
  Gauge,
  TrendingUp,
  Users,
  FileCheck,
  FileSpreadsheet,
  Sparkles,
  Twitter,
  Linkedin,
  Facebook,
  ShieldCheck
} from "lucide-react";
import styles from "./page.module.css";

const FEATURES = [
  { id: "damage", Icon: CarFront },
  { id: "mileage", Icon: Gauge },
  { id: "market", Icon: TrendingUp },
  { id: "owners", Icon: Users },
  { id: "apk", Icon: FileCheck },
  { id: "specs", Icon: FileSpreadsheet }
];

const WORKFLOW = [{ id: "1" }, { id: "2" }, { id: "3" }];

const FOOTER_LINKS = {
  product: ["Sample Report", "Pricing", "Features", "For Dealers"],
  company: ["About Us", "Careers", "Contact", "Partners"],
  legal: ["Terms of Service", "Privacy Policy", "Cookie Policy", "Data Sources"]
};

function PlateSearch() {
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { t } = useI18n();

  const submit = () => {
    const plate = normalizePlate(value);
    if (!validateDutchPlate(plate)) {
      setError(t("landing.invalidPlate"));
      return;
    }
    router.push(`/search/${plate}`);
  };

  return (
    <div className={styles["search-wrapper"]}>
      <small>{t("landing.example")}</small>
      <div className={styles["search-row"]}>
        <input
          value={value}
          onChange={(event) => {
            setValue(event.target.value.toUpperCase());
            setError(null);
          }}
          onKeyDown={(event) => event.key === "Enter" && submit()}
          placeholder={t("landing.example")}
          className={styles["input-mock"]}
        />
        <button onClick={submit} className={styles["search-btn"]}>
          {t("landing.getReport")}
        </button>
      </div>
      {error && <p className="mt-2 text-sm text-[#dc2626]">{error}</p>}
    </div>
  );
}

export default function LandingPage() {
  const { t } = useI18n();
  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <section className={styles["hero-section"]}>
          <div className={`${styles.badge} ${styles.badgePrimary}`}>
            <Sparkles size={14} /> {t("landing.badgeTop")}
          </div>
          <h1 className={styles["hero-title"]}>
            {t("landing.heroTitleA")} <span>{t("landing.heroTitleB")}</span>
          </h1>
          <p className={styles["hero-subtitle"]}>{t("landing.heroSubtitle")}</p>
          <PlateSearch />
          <div className={styles["trust-logos"]}>
            <span>{t("landing.trustedSources")}</span>
            <Building2 size={20} />
            <Briefcase size={20} />
            <MapPin size={20} />
            <Scale size={20} />
          </div>
          <div className={styles["hero-image"]}>
            <Image
              src="https://storage.googleapis.com/banani-generated-images/generated-images/ad953e96-ea70-4d4d-ab60-fc21c7b01fb4.jpg"
              width={1200}
              height={675}
              alt="Platform dashboard"
              priority
              className="w-full h-auto"
            />
          </div>
        </section>

        <section id="features" className={styles.section}>
          <div className={styles["section-header"]}>
            <div className={styles.badge}>{t("landing.sectionFeatures")}</div>
            <h2 className={styles["section-title"]}>{t("landing.sectionFeaturesTitle")}</h2>
          </div>
          <div className={styles["features-grid"]}>
            {FEATURES.map((feature) => (
              <div key={feature.id} className={styles["feature-card"]}>
                <div className={styles["feature-icon"]}>
                  <feature.Icon size={28} />
                </div>
                <h3 className={styles["feature-title"]}>{t(`landing.feature.${feature.id}.title`)}</h3>
                <p className={styles["feature-desc"]}>{t(`landing.feature.${feature.id}.desc`)}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="sample" className={styles.section}>
          <div className={styles["section-header"]}>
            <div className={styles.badge}>{t("landing.sectionHow")}</div>
            <h2 className={styles["section-title"]}>{t("landing.sectionHowTitle")}</h2>
          </div>
          <div className={styles["workflow-steps"]}>
            {WORKFLOW.map((step, index) => (
              <div key={step.id} className={styles["step-card"]}>
                <div className={styles["step-number"]}>{index + 1}</div>
                <h3 className={styles["step-title"]}>{t(`landing.step.${step.id}.title`)}</h3>
                <p className={styles["step-desc"]}>{t(`landing.step.${step.id}.desc`)}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="pricing" className={styles.cta}>
          <h2 className={styles["cta-title"]}>{t("landing.ctaTitle")}</h2>
          <p className={styles["cta-subtitle"]}>{t("landing.ctaSubtitle")}</p>
          <button className={styles["cta-btn"]} data-media-type="banani-button">
            {t("landing.ctaButton")}
          </button>
        </section>
      </main>

      <footer className={styles.footer}>
        <div className={styles["footer-grid"]}>
          <div>
            <div className={styles["nav-brand"]}>
              <div className={styles["brand-icon"]}>
                <ShieldCheck size={16} />
              </div>
              AutoCheck
            </div>
            <p className={styles["footer-desc"]}>
              The most comprehensive and transparent vehicle history reporting platform for buyers and dealers.
            </p>
          </div>
          <div>
            <div className={styles["footer-title"]}>Product</div>
            <div className={styles["footer-links"]}>
              {FOOTER_LINKS.product.map((item) => (
                <div key={item} className={styles["footer-link"]}>
                  {item}
                </div>
              ))}
            </div>
          </div>
          <div>
            <div className={styles["footer-title"]}>Company</div>
            <div className={styles["footer-links"]}>
              {FOOTER_LINKS.company.map((item) => (
                <div key={item} className={styles["footer-link"]}>
                  {item}
                </div>
              ))}
            </div>
          </div>
          <div>
            <div className={styles["footer-title"]}>Legal</div>
            <div className={styles["footer-links"]}>
              {FOOTER_LINKS.legal.map((item) => (
                <div key={item} className={styles["footer-link"]}>
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className={styles["footer-bottom"]}>
          <div>© {new Date().getFullYear()} AutoCheck Inc. {t("landing.footerRights")}</div>
          <div className={styles["social-icons"]}>
            <a className={styles["social-icon"]} href="https://twitter.com" aria-label="Twitter">
              <Twitter size={16} />
            </a>
            <a className={styles["social-icon"]} href="https://linkedin.com" aria-label="LinkedIn">
              <Linkedin size={16} />
            </a>
            <a className={styles["social-icon"]} href="https://facebook.com" aria-label="Facebook">
              <Facebook size={16} />
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
