import { connectMongo } from "@/lib/db/mongodb";
import { SiteSettingsModel } from "@/models/SiteSettings";
import { defaultSiteSettings, type PublicSiteSettings } from "./defaults";

export async function getSiteSettings(): Promise<PublicSiteSettings> {
  await connectMongo();
  const doc = await SiteSettingsModel.findOne({ key: "global" }).lean();
  if (!doc) {
    const created = await SiteSettingsModel.create({ key: "global", ...defaultSiteSettings });
    return {
      paymentEnabled: created.paymentEnabled,
      payment: {
        ...defaultSiteSettings.payment,
        ...(created.payment ?? {})
      },
      lockSections: created.lockSections,
      ui: {
        ...defaultSiteSettings.ui,
        ...(created.ui ?? {})
      },
      content: created.content
      ,
      landing: {
        ...defaultSiteSettings.landing,
        ...((created.landing ?? {}) as Partial<PublicSiteSettings["landing"]>),
        sectionVisibility: {
          ...defaultSiteSettings.landing.sectionVisibility,
          ...(((created.landing as { sectionVisibility?: Partial<PublicSiteSettings["landing"]["sectionVisibility"]> } | undefined)?.sectionVisibility ?? {}))
        },
        footer: {
          ...defaultSiteSettings.landing.footer,
          ...(((created.landing as { footer?: Partial<PublicSiteSettings["landing"]["footer"]> } | undefined)?.footer ?? {}))
        }
      }
    };
  }

  return {
    paymentEnabled: doc.paymentEnabled ?? defaultSiteSettings.paymentEnabled,
    payment: {
      ...defaultSiteSettings.payment,
      ...(doc.payment ?? {})
    },
    lockSections: {
      ...defaultSiteSettings.lockSections,
      ...(doc.lockSections ?? {})
    },
    ui: {
      ...defaultSiteSettings.ui,
      ...(doc.ui ?? {})
    },
    content: {
      ...defaultSiteSettings.content,
      ...(doc.content ?? {})
    },
    landing: {
      ...defaultSiteSettings.landing,
      ...((doc.landing ?? {}) as Partial<PublicSiteSettings["landing"]>),
      sectionVisibility: {
        ...defaultSiteSettings.landing.sectionVisibility,
        ...(((doc.landing as { sectionVisibility?: Partial<PublicSiteSettings["landing"]["sectionVisibility"]> } | undefined)?.sectionVisibility ?? {}))
      },
      footer: {
        ...defaultSiteSettings.landing.footer,
        ...(((doc.landing as { footer?: Partial<PublicSiteSettings["landing"]["footer"]> } | undefined)?.footer ?? {}))
      }
    }
  };
}

export async function upsertSiteSettings(input: Partial<PublicSiteSettings>): Promise<PublicSiteSettings> {
  const current = await getSiteSettings();
  const next: PublicSiteSettings = {
    paymentEnabled: input.paymentEnabled ?? current.paymentEnabled,
    payment: {
      ...current.payment,
      ...(input.payment ?? {})
    },
    lockSections: {
      ...current.lockSections,
      ...(input.lockSections ?? {})
    },
    ui: {
      ...current.ui,
      ...(input.ui ?? {})
    },
    content: {
      ...current.content,
      ...(input.content ?? {})
    },
    landing: {
      ...current.landing,
      ...(input.landing ?? {}),
      sectionVisibility: {
        ...current.landing.sectionVisibility,
        ...(input.landing?.sectionVisibility ?? {})
      },
      footer: {
        ...current.landing.footer,
        ...(input.landing?.footer ?? {})
      }
    }
  };

  await SiteSettingsModel.updateOne({ key: "global" }, { $set: { ...next } }, { upsert: true });
  return next;
}
