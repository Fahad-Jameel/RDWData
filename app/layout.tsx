import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google";
import Script from "next/script";
import { StoreProvider } from "@/lib/store/provider";
import { I18nProvider } from "@/lib/i18n/context";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { ActivityTracker } from "@/components/analytics/ActivityTracker";
import { getSiteSettings } from "@/lib/site-settings/service";
import "./globals.css";

const bodyFont = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap"
});

const headingFont = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  display: "swap"
});

export const metadata: Metadata = {
  title: "PlateIntel - Nederlandse Kentekeninzichten",
  description:
    "Directe Nederlandse kentekencheck. Krijg voertuigprofiel, APK-status, inspectiehistorie en terugroepmeldingen op basis van RDW open data.",
  keywords: ["kenteken", "RDW", "license plate", "Netherlands", "APK", "vehicle lookup"],
  openGraph: {
    title: "PlateIntel - Nederlandse Voertuiginzichten",
    description: "Directe Nederlandse voertuigchecks op basis van RDW open data.",
    type: "website"
  }
};

export default async function RootLayout({
  children
}: Readonly<{ children: React.ReactNode }>) {
  let googleAnalyticsId = "";
  let microsoftClarityId = "";

  try {
    const settings = await getSiteSettings();
    googleAnalyticsId = settings.seo.googleAnalyticsId.trim();
    microsoftClarityId = settings.seo.microsoftClarityId.trim();
  } catch {
    // Keep rendering the site even if DB/settings are temporarily unavailable.
  }

  return (
    <html lang="nl" suppressHydrationWarning>
      <head>
        {googleAnalyticsId ? (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(googleAnalyticsId)}`}
              strategy="afterInteractive"
            />
            <Script id="ga4-init" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${googleAnalyticsId}', { anonymize_ip: true });
              `}
            </Script>
          </>
        ) : null}
        {microsoftClarityId ? (
          <Script id="clarity-init" strategy="afterInteractive">
            {`
              (function(c,l,a,r,i,t,y){
                c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
                t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
                y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
              })(window, document, "clarity", "script", "${microsoftClarityId}");
            `}
          </Script>
        ) : null}
      </head>
      <body
        suppressHydrationWarning
        className={`${bodyFont.variable} ${headingFont.variable} bg-slate-50 font-sans text-slate-900 antialiased`}
      >
        <StoreProvider>
          <I18nProvider>
            <ActivityTracker />
            <SiteHeader />
            <div className="min-h-screen">{children}</div>
          </I18nProvider>
        </StoreProvider>
      </body>
    </html>
  );
}
