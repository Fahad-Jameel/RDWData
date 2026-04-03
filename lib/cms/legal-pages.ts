import { CmsPageModel } from "@/models/CmsPage";

export type LegalPageTemplate = {
  slug: "privacy-policy" | "terms-and-conditions";
  title: string;
  content: string;
  published: boolean;
  showInHeader: boolean;
  showInFooter: boolean;
};

export const LEGAL_PAGE_TEMPLATES: LegalPageTemplate[] = [
  {
    slug: "privacy-policy",
    title: "Privacy Policy",
    published: true,
    showInHeader: false,
    showInFooter: true,
    content: `Privacy Policy

Last updated: April 3, 2026

1. Introduction
Kentekenrapport ("we", "us", "our") respects your privacy. This Privacy Policy explains what personal data we collect, how we use it, and your rights.

2. Data We Collect
- Account data: email address and login credentials when you create an account.
- Search data: license plate searches and related report activity.
- Payment data: transaction references and payment status from payment providers.
- Technical data: IP address, browser type, device details, and usage logs.

3. How We Use Data
We use your data to:
- deliver vehicle reports and platform features;
- process payments and grant access to paid content;
- secure the platform and prevent abuse;
- improve product quality, analytics, and support.

4. Legal Basis (GDPR)
Where applicable, we process data based on:
- contract performance;
- legal obligations;
- legitimate interests;
- your consent (when required).

5. Data Sharing
We may share data with trusted service providers for hosting, payments, analytics, and support. We do not sell personal data.

6. Data Retention
We keep data only as long as needed for service delivery, legal compliance, dispute resolution, and fraud prevention.

7. International Transfers
If data is processed outside the EEA, we apply appropriate safeguards where legally required.

8. Your Rights
Depending on your location, you may have rights to access, correct, delete, restrict, or object to processing, and data portability rights.

9. Security
We use technical and organizational safeguards to protect data, but no method is 100% secure.

10. Cookies
We use cookies and similar technologies for essential functionality, preferences, and analytics.

11. Contact
For privacy requests, contact: privacy@kentekenrapport.nl`
  },
  {
    slug: "terms-and-conditions",
    title: "Terms and Conditions",
    published: true,
    showInHeader: false,
    showInFooter: true,
    content: `Terms and Conditions

Last updated: April 3, 2026

1. Acceptance
By accessing or using Kentekenrapport, you agree to these Terms and Conditions.

2. Service Description
Kentekenrapport provides vehicle-related data insights and reports based on public and partner data sources. Data is provided on an "as available" basis.

3. Account and Access
You are responsible for maintaining account security and for activities performed under your account.

4. Payments
Certain features require payment. Prices, taxes, and payment terms are shown at checkout. Access is granted after successful payment confirmation.

5. Permitted Use
You agree not to misuse the service, attempt unauthorized access, scrape at scale, reverse engineer, or disrupt platform operations.

6. Data Accuracy Disclaimer
We aim for high-quality data but do not guarantee absolute completeness or accuracy at all times. You should independently verify critical information before purchase decisions.

7. Intellectual Property
Platform design, software, branding, and original content are owned by Kentekenrapport or licensors and are protected by law.

8. Limitation of Liability
To the extent permitted by law, Kentekenrapport is not liable for indirect or consequential damages arising from use of the platform.

9. Termination
We may suspend or terminate access for violations of these terms or abuse of the platform.

10. Changes to Terms
We may update these terms from time to time. Continued use after updates means you accept the revised terms.

11. Governing Law
These terms are governed by the laws of the Netherlands, unless mandatory local consumer law applies otherwise.

12. Contact
For legal questions, contact: legal@kentekenrapport.nl`
  }
];

export async function ensureLegalPages(): Promise<void> {
  await Promise.all(
    LEGAL_PAGE_TEMPLATES.map((page) =>
      CmsPageModel.updateOne(
        { slug: page.slug },
        {
          $setOnInsert: {
            title: page.title,
            slug: page.slug,
            content: page.content,
            published: page.published,
            showInHeader: page.showInHeader,
            showInFooter: page.showInFooter
          }
        },
        { upsert: true }
      )
    )
  );
}

export function getLegalTemplateBySlug(slug: string): LegalPageTemplate | null {
  return LEGAL_PAGE_TEMPLATES.find((item) => item.slug === slug) ?? null;
}
