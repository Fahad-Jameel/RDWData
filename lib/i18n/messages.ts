export type Locale = "nl" | "en";

type Messages = Record<string, string>;

export const messages: Record<Locale, Messages> = {
  nl: {
    "header.features": "Functies",
    "header.sample": "Voorbeeldrapport",
    "header.pricing": "Prijzen",
    "header.login": "Inloggen",
    "header.checkVehicle": "Voertuig controleren",
    "header.menu": "Menu",
    "header.openNav": "Navigatie openen",
    "header.closeNav": "Navigatie sluiten",
    "header.langNl": "NL",
    "header.langEn": "EN",

    "landing.badgeTop": "Het #1 beoordeelde voertuiggeschiedenisplatform",
    "landing.heroTitleA": "Koop je volgende auto niet blind.",
    "landing.heroTitleB": "Ken de echte geschiedenis.",
    "landing.heroSubtitle":
      "Ontdek direct verborgen schade, kilometerfraude, marktwaarde en eigendomsgeschiedenis met alleen een kenteken.",
    "landing.example": "Voorbeeld: 16-RSL-9",
    "landing.getReport": "Rapport ophalen",
    "landing.invalidPlate": "Voer een geldig Nederlands kenteken in, zoals AB-123-C.",
    "landing.trustedSources": "Vertrouwde databronnen",
    "landing.sectionFeatures": "Volledige data",
    "landing.sectionFeaturesTitle": "Alles wat je nodig hebt voor een veilige aankoop",
    "landing.sectionHow": "Hoe het werkt",
    "landing.sectionHowTitle": "Drie simpele stappen naar volledige zekerheid",
    "landing.ctaTitle": "Klaar om met vertrouwen te kopen?",
    "landing.ctaSubtitle":
      "Sluit je aan bij meer dan 1.000.000 slimme kopers die hun auto checkten vóór de deal.",
    "landing.ctaButton": "Start je check nu",
    "landing.footerRights": "Alle rechten voorbehouden.",

    "landing.feature.damage.title": "Schadegeschiedenis",
    "landing.feature.damage.desc":
      "Bekijk visuele schadesignalen en reparatie-inschattingen om structurele risico's vooraf te herkennen.",
    "landing.feature.mileage.title": "Kilometercontrole",
    "landing.feature.mileage.desc":
      "Volg de echte kilometrage-trend en detecteer verdachte terugdraaiingen met gewogen regressie.",
    "landing.feature.market.title": "Marktwaardering",
    "landing.feature.market.desc":
      "Vergelijk vraagprijzen met actuele Nederlandse marktdata zodat je nooit te veel betaalt.",
    "landing.feature.owners.title": "Eigendomstijdlijn",
    "landing.feature.owners.desc":
      "Zie elke overdrachtsdatum, eigendomstype en of het voertuig in NL of in het buitenland reed.",
    "landing.feature.apk.title": "Inspectieregistraties",
    "landing.feature.apk.desc":
      "Bekijk APK-historie, defectsignalen en aankomende keuringsmomenten in één overzicht.",
    "landing.feature.specs.title": "Technische specificaties",
    "landing.feature.specs.desc":
      "Volledige uitsplitsing van motorvermogen, emissies, gewichten en uitrusting direct uit RDW.",

    "landing.step.1.title": "Voer het kenteken in",
    "landing.step.1.desc": "Typ een Nederlands kenteken in de zoekbalk.",
    "landing.step.2.title": "Wij verzamelen de data",
    "landing.step.2.desc":
      "Onze pipeline combineert RDW, inspectiehistorie en defecten in één helder beeld.",
    "landing.step.3.title": "Neem een slimme beslissing",
    "landing.step.3.desc":
      "Bekijk het rapport, markeer risico's en gebruik marktinzichten voor betere onderhandeling.",

    "notFound.plate": "NIET GEVONDEN",
    "notFound.title": "Kenteken niet gevonden",
    "notFound.desc":
      "Het kentekenformaat is ongeldig of RDW gaf geen resultaten terug. Controleer je invoer en probeer opnieuw.",
    "notFound.search": "Kenteken zoeken",
    "notFound.home": "Naar home"
  },
  en: {
    "header.features": "Features",
    "header.sample": "Sample Report",
    "header.pricing": "Pricing",
    "header.login": "Log in",
    "header.checkVehicle": "Check Vehicle",
    "header.menu": "Menu",
    "header.openNav": "Open navigation",
    "header.closeNav": "Close navigation",
    "header.langNl": "NL",
    "header.langEn": "EN",

    "landing.badgeTop": "The #1 Rated Vehicle History Platform",
    "landing.heroTitleA": "Don't buy your next car blindly.",
    "landing.heroTitleB": "Know its true history.",
    "landing.heroSubtitle":
      "Instantly reveal hidden damage, mileage rollbacks, market value, and ownership history with just a license plate number.",
    "landing.example": "Example: 16-RSL-9",
    "landing.getReport": "Get Report",
    "landing.invalidPlate": "Enter a valid Dutch plate like AB-123-C.",
    "landing.trustedSources": "Trusted Data Sources",
    "landing.sectionFeatures": "Comprehensive data",
    "landing.sectionFeaturesTitle": "Everything you need to make a safe purchase",
    "landing.sectionHow": "How it works",
    "landing.sectionHowTitle": "Three simple steps to total peace of mind",
    "landing.ctaTitle": "Ready to buy with confidence?",
    "landing.ctaSubtitle":
      "Join over 1,000,000 smart buyers who checked their car before making a deal.",
    "landing.ctaButton": "Start Your Check Now",
    "landing.footerRights": "All rights reserved.",

    "landing.feature.damage.title": "Damage History",
    "landing.feature.damage.desc":
      "Review visual damage markers and repair estimates to spot structural issues before you commit.",
    "landing.feature.mileage.title": "Mileage Verification",
    "landing.feature.mileage.desc":
      "Track the true mileage trend and detect suspicious rollbacks with our weighted regression engine.",
    "landing.feature.market.title": "Market Valuation",
    "landing.feature.market.desc":
      "Compare asking prices against real Dutch market data so you never overpay.",
    "landing.feature.owners.title": "Ownership Timeline",
    "landing.feature.owners.desc":
      "See every transfer date, owner type, and whether the vehicle lived in the Netherlands or abroad.",
    "landing.feature.apk.title": "Inspection Records",
    "landing.feature.apk.desc":
      "Surface APK history, defect flags, and upcoming inspection windows in one view.",
    "landing.feature.specs.title": "Technical Specs",
    "landing.feature.specs.desc":
      "Full breakdown of engine power, emissions, weights, and equipment straight from RDW.",

    "landing.step.1.title": "Enter the license plate",
    "landing.step.1.desc": "Type any Dutch registration into the search box.",
    "landing.step.2.title": "We gather the data",
    "landing.step.2.desc":
      "Our pipeline merges RDW, inspection history, and defects into a single view.",
    "landing.step.3.title": "Make a smart decision",
    "landing.step.3.desc":
      "Review the report, highlight risks, and use market insights to negotiate with confidence.",

    "notFound.plate": "NOT FOUND",
    "notFound.title": "Plate not found",
    "notFound.desc":
      "The plate format is invalid, or RDW returned no records. Double-check your input and try again.",
    "notFound.search": "Search a plate",
    "notFound.home": "Go home"
  }
};
