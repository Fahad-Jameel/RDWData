import { model, models, Schema, type Model } from "mongoose";

export type SiteSettingsDoc = {
  key: "global";
  paymentEnabled: boolean;
  payment: {
    amount: string;
    currency: string;
    allowBypassPayment: boolean;
    specialDiscountEnabled: boolean;
    specialDiscountPercent: number;
    promoCodes: Array<{
      code: string;
      type: "percent" | "fixed";
      value: number;
      active: boolean;
      expiresAt: string;
      maxUses: number;
    }>;
  };
  lockSections: {
    riskOverview: boolean;
    mileageHistory: boolean;
    marketAnalysis: boolean;
    vehicleComparison: boolean;
    damageHistory: boolean;
    technicalSpecs: boolean;
    inspectionTimeline: boolean;
    ownershipHistory: boolean;
    reportDownload: boolean;
  };
  ui: {
    showFeaturesLink: boolean;
    showSampleLink: boolean;
    showPricingLink: boolean;
    showLoginButton: boolean;
  };
  content: {
    platformName: string;
    landingHeroTitleA: string;
    landingHeroTitleB: string;
    landingHeroSubtitle: string;
    landingCtaTitle: string;
    landingCtaSubtitle: string;
    landingCtaButton: string;
    landingCtaUrl: string;
    landingHeroImageUrl: string;
    footerDescription: string;
  };
  seo: {
    metaTitle: string;
    metaDescription: string;
    ogImage: string;
    googleAnalyticsId: string;
    microsoftClarityId: string;
    faviconUrl: string;
  };
  appearance: {
    primaryColor: string;
    accentColor: string;
    fontFamily: string;
    logoUrl: string;
    logoText: string;
  };
  email: {
    fromName: string;
    fromAddress: string;
    reportSubjectNl: string;
    reportSubjectEn: string;
    welcomeBodyNl: string;
    welcomeBodyEn: string;
  };
  landing: unknown;
  updatedAt: Date;
  createdAt: Date;
};

const siteSettingsSchema = new Schema<SiteSettingsDoc>(
  {
    key: { type: String, required: true, unique: true, default: "global" },
    paymentEnabled: { type: Boolean, required: true, default: true },
    payment: {
      amount: { type: String, required: true, default: "9.95" },
      currency: { type: String, required: true, default: "EUR" },
      allowBypassPayment: { type: Boolean, required: true, default: false },
      specialDiscountEnabled: { type: Boolean, required: true, default: false },
      specialDiscountPercent: { type: Number, required: true, default: 10 },
      promoCodes: {
        type: [
          {
            code: { type: String, required: true, uppercase: true, trim: true },
            type: { type: String, enum: ["percent", "fixed"], required: true, default: "percent" },
            value: { type: Number, required: true, default: 0 },
            active: { type: Boolean, required: true, default: true },
            expiresAt: { type: String, required: false, default: "" },
            maxUses: { type: Number, required: false, default: 0 }
          }
        ],
        required: true,
        default: []
      }
    },
    lockSections: {
      riskOverview: { type: Boolean, required: true, default: true },
      mileageHistory: { type: Boolean, required: true, default: true },
      marketAnalysis: { type: Boolean, required: true, default: true },
      vehicleComparison: { type: Boolean, required: true, default: true },
      damageHistory: { type: Boolean, required: true, default: true },
      technicalSpecs: { type: Boolean, required: true, default: false },
      inspectionTimeline: { type: Boolean, required: true, default: false },
      ownershipHistory: { type: Boolean, required: true, default: false },
      reportDownload: { type: Boolean, required: true, default: true }
    },
    ui: {
      showFeaturesLink: { type: Boolean, required: true, default: true },
      showSampleLink: { type: Boolean, required: true, default: true },
      showPricingLink: { type: Boolean, required: true, default: true },
      showLoginButton: { type: Boolean, required: true, default: true }
    },
    content: {
      platformName: { type: String, required: true, default: "Kentekenrapport" },
      landingHeroTitleA: { type: String, required: true, default: "Koop je volgende auto niet blind." },
      landingHeroTitleB: { type: String, required: true, default: "Ken de echte geschiedenis." },
      landingHeroSubtitle: {
        type: String,
        required: true,
        default:
          "Ontdek direct verborgen schade, kilometerfraude, marktwaarde en eigendomsgeschiedenis met alleen een kenteken."
      },
      landingCtaTitle: {
        type: String,
        required: true,
        default: "Klaar om met vertrouwen te kopen?"
      },
      landingCtaSubtitle: {
        type: String,
        required: true,
        default: "Sluit je aan bij meer dan 1.000.000 slimme kopers die hun auto checkten voor de deal."
      },
      landingCtaButton: {
        type: String,
        required: true,
        default: "Start je check nu"
      },
      landingCtaUrl: {
        type: String,
        required: true,
        default: "/#pricing"
      },
      landingHeroImageUrl: {
        type: String,
        required: true,
        default:
          "https://storage.googleapis.com/banani-generated-images/generated-images/ad953e96-ea70-4d4d-ab60-fc21c7b01fb4.jpg"
      },
      footerDescription: {
        type: String,
        required: true,
        default:
          "Het meest complete en transparante voertuiggeschiedenisplatform voor kopers en dealers."
      }
    },
    seo: {
      metaTitle: { type: String, required: true, default: "Kentekenrapport - Nederlandse Kentekeninzichten" },
      metaDescription: {
        type: String,
        required: true,
        default: "Directe Nederlandse kentekencheck. Voertuigprofiel, APK-status, inspectiehistorie en marktwaarde."
      },
      ogImage: { type: String, required: true, default: "" },
      googleAnalyticsId: { type: String, required: true, default: "" },
      microsoftClarityId: { type: String, required: true, default: "" },
      faviconUrl: { type: String, required: true, default: "" }
    },
    appearance: {
      primaryColor: { type: String, required: true, default: "#2563eb" },
      accentColor: { type: String, required: true, default: "#dbeafe" },
      fontFamily: { type: String, required: true, default: "Inter" },
      logoUrl: { type: String, required: true, default: "" },
      logoText: { type: String, required: true, default: "Kentekenrapport" }
    },
    email: {
      fromName: { type: String, required: true, default: "Kentekenrapport" },
      fromAddress: { type: String, required: true, default: "noreply@kentekenrapport.nl" },
      reportSubjectNl: { type: String, required: true, default: "Jouw kentekenrapport" },
      reportSubjectEn: { type: String, required: true, default: "Your vehicle report" },
      welcomeBodyNl: {
        type: String,
        required: true,
        default: "Bedankt voor het gebruiken van Kentekenrapport. Uw rapport is bijgevoegd."
      },
      welcomeBodyEn: {
        type: String,
        required: true,
        default: "Thank you for using Kentekenrapport. Your report is attached."
      }
    },
    landing: {
      type: Schema.Types.Mixed,
      required: true,
      default: {}
    }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

export const SiteSettingsModel: Model<SiteSettingsDoc> =
  (models.SiteSettings as Model<SiteSettingsDoc> | undefined) ||
  model<SiteSettingsDoc>("SiteSettings", siteSettingsSchema);
