import { NextResponse } from "next/server";
import crypto from "node:crypto";
import { getVehicleProfile } from "@/lib/rdw/service";
import { parsePlateOrThrow } from "@/lib/api/plate";
import { errorResponse } from "@/lib/api/errors";
import { localizeVehicleProfile } from "@/lib/i18n/vehicle";
import type { Locale } from "@/lib/i18n/messages";
import { buildFallbackVehicleAiReport, generateVehicleAiReport } from "@/lib/api/claude";
import { getSiteSettings } from "@/lib/site-settings/service";
import { connectMongo } from "@/lib/db/mongodb";
import { PlatePaymentModel } from "@/models/PlatePayment";
import { generateVehicleReportHtml } from "@/lib/api/report-template";
import { generateVehicleReportPdf } from "@/lib/api/pdf-report";
import { applyMileageValuationOverride } from "@/lib/api/market-value";
import { cookies } from "next/headers";
import { headers } from "next/headers";
import { USER_SESSION_COOKIE, verifyUserSession } from "@/lib/user/auth";
import { ReportDownloadModel } from "@/models/ReportDownload";
import { SearchLogModel } from "@/models/SearchLog";
import nodemailer from "nodemailer";

type Params = { params: { plate: string } };

function parseLocale(input: string | null): Locale {
  return input === "en" ? "en" : "nl";
}

function isValidEmail(input: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input);
}

function parseUserMileage(input: string | null): number | null {
  if (!input) return null;
  const value = Number(input);
  if (!Number.isFinite(value) || value < 0) return null;
  return Math.round(value);
}

function maskEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (!local || !domain) return "***";
  if (local.length <= 2) return `${local[0] ?? "*"}***@${domain}`;
  return `${local.slice(0, 2)}***@${domain}`;
}

async function sendReportEmail(args: {
  to: string;
  plate: string;
  locale: Locale;
  html: string;
  pdfBase64?: string;
}): Promise<{ delivered: boolean; reason?: string }> {
  const from = process.env.REPORT_EMAIL_FROM ?? "Kentekenrapport <noreply@kentekenrapport.nl>";
  const smtpHost = (process.env.SMTP_HOST ?? "").trim();
  const smtpPortRaw = Number(process.env.SMTP_PORT ?? "");
  const smtpPort = Number.isFinite(smtpPortRaw) && smtpPortRaw > 0 ? smtpPortRaw : 587;
  const smtpUser = (process.env.SMTP_USER ?? "").trim();
  const smtpPass = process.env.SMTP_PASS ?? "";
  const smtpSecure = (process.env.SMTP_SECURE ?? "").trim().toLowerCase() === "true";
  const hasSmtpConfig = Boolean(smtpHost && smtpUser && smtpPass);
  const maskedTo = maskEmail(args.to);

  if (hasSmtpConfig) {
    console.info("[report-email] provider=smtp attempt", {
      to: maskedTo,
      host: smtpHost,
      port: smtpPort,
      secure: smtpSecure,
      from
    });
    try {
      const transporter = nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpSecure,
        auth: {
          user: smtpUser,
          pass: smtpPass
        }
      });

      await transporter.sendMail({
        from,
        to: args.to,
        subject: args.locale === "nl" ? `Kentekenrapport voor ${args.plate}` : `Vehicle report for ${args.plate}`,
        html: args.html,
        ...(args.pdfBase64
          ? {
              attachments: [
                {
                  filename: `kentekenrapport-${args.plate}.pdf`,
                  content: Buffer.from(args.pdfBase64, "base64")
                }
              ]
            }
          : {})
      });
      console.info("[report-email] provider=smtp success", { to: maskedTo });
      return { delivered: true };
    } catch (error) {
      const reason = error instanceof Error ? error.message : "SMTP_SEND_FAILED";
      console.error("[report-email] provider=smtp failure", { to: maskedTo, reason });
      return { delivered: false, reason: `SMTP_SEND_FAILED:${reason}` };
    }
  }

  const apiKey = process.env.RESEND_API_KEY ?? "";
  if (!apiKey) {
    console.error("[report-email] provider=none failure", { to: maskedTo, reason: "EMAIL_PROVIDER_NOT_CONFIGURED" });
    return { delivered: false, reason: "EMAIL_PROVIDER_NOT_CONFIGURED" };
  }

  const subject = args.locale === "nl" ? `Kentekenrapport voor ${args.plate}` : `Vehicle report for ${args.plate}`;
  console.info("[report-email] provider=resend attempt", { to: maskedTo, from });
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      from,
      to: [args.to],
      subject,
      html: args.html,
      ...(args.pdfBase64
        ? {
            attachments: [
              {
                filename: `kentekenrapport-${args.plate}.pdf`,
                content: args.pdfBase64
              }
            ]
          }
        : {})
    }),
    cache: "no-store"
  });

  if (!response.ok) {
    const details = await response.text();
    console.error("[report-email] provider=resend failure", { to: maskedTo, status: response.status, details });
    return { delivered: false, reason: `EMAIL_SEND_FAILED:${response.status}:${details}` };
  }
  console.info("[report-email] provider=resend success", { to: maskedTo });
  return { delivered: true };
}

async function processReportEmailAsync(args: {
  plate: string;
  locale: Locale;
  email: string;
}) {
  try {
    console.info("[report-email] async job started", { to: maskEmail(args.email), plate: args.plate });
    const { localized, aiInsights, aiValuation } = await buildLocalizedWithAi(args.plate, args.locale, null);
    const html = generateVehicleReportHtml({
      plate: args.plate,
      locale: args.locale,
      generatedAt: new Date(),
      score: {
        score: Number((localized.enriched as Record<string, unknown> | undefined)?.apkPassChance ?? 0),
        label: args.locale === "nl" ? "Voertuigscore" : "Vehicle score"
      },
      data: localized,
      aiInsights,
      aiValuation
    });
    const pdf = await generateVehicleReportPdf({
      plate: args.plate,
      locale: args.locale,
      generatedAt: new Date(),
      data: localized,
      aiInsights,
      aiValuation
    });
    const result = await sendReportEmail({
      to: args.email,
      plate: args.plate,
      locale: args.locale,
      html,
      pdfBase64: pdf.toString("base64")
    });
    console.info("[report-email] async job completed", {
      to: maskEmail(args.email),
      plate: args.plate,
      delivered: result.delivered,
      reason: result.reason ?? null
    });
    if (result.delivered) {
      await trackReportIfUserLoggedIn({ plate: args.plate, locale: args.locale, channel: "email" });
    }
  } catch (error) {
    const reason = error instanceof Error ? error.message : "UNKNOWN_ASYNC_ERROR";
    console.error("[report-email] async job failed", { to: maskEmail(args.email), plate: args.plate, reason });
  }
}

async function hasPaidReportAccess(plate: string): Promise<boolean> {
  const settings = await getSiteSettings();
  if (settings.payment.allowBypassPayment) return true;
  const paymentRequired = settings.paymentEnabled && settings.lockSections.reportDownload;
  if (!paymentRequired) return true;
  await connectMongo();
  const hasPaid = await PlatePaymentModel.exists({
    plate,
    status: "COMPLETED",
    provider: "paypal",
    orderId: { $not: /^demo-/ }
  });
  return Boolean(hasPaid);
}

async function buildLocalizedWithAi(plate: string, locale: Locale, userMileage: number | null) {
  const profile = await getVehicleProfile(plate);
  let localized = localizeVehicleProfile(profile, locale) as Record<string, unknown>;
  localized = applyMileageValuationOverride(localized, userMileage);
  if (userMileage !== null) {
    const enriched = ((localized.enriched ?? {}) as Record<string, unknown>);
    localized.enriched = {
      ...enriched,
      userMileageInput: userMileage,
      userMileageDelta:
        Number.isFinite(Number(enriched.estimatedMileageNow)) ? Math.round(userMileage - Number(enriched.estimatedMileageNow)) : null,
      userMileagePlausible:
        Number.isFinite(Number(enriched.estimatedMileageNow))
          ? Math.abs(userMileage - Number(enriched.estimatedMileageNow)) <= Math.max(40000, Number(enriched.estimatedMileageNow) * 0.35)
          : null
    };
  }
  try {
    const aiReport = await generateVehicleAiReport({
      plate,
      locale,
      vehicleData: {
        ...localized,
        userContext: userMileage !== null ? { mileageInput: userMileage } : undefined
      }
    });
    return {
      localized,
      aiInsights: aiReport.insights,
      aiValuation: aiReport.valuation
    };
  } catch {
    const fallback = buildFallbackVehicleAiReport({ locale, vehicleData: localized });
    return {
      localized,
      aiInsights: fallback.insights,
      aiValuation: fallback.valuation
    };
  }
}

async function trackReportIfUserLoggedIn(args: {
  plate: string;
  locale: Locale;
  channel: "download" | "email";
}) {
  const token = cookies().get(USER_SESSION_COOKIE)?.value;
  const session = verifyUserSession(token);
  if (!session) return;
  await connectMongo();
  await ReportDownloadModel.create({
    userId: session.sub,
    plate: args.plate,
    locale: args.locale,
    channel: args.channel
  });
}

async function trackSearch(args: {
  plate: string;
  resultFrom: "cache" | "api";
}) {
  const forwarded = headers().get("x-forwarded-for") ?? "";
  const ip = forwarded.split(",")[0]?.trim() || headers().get("x-real-ip") || "unknown";
  const ipHash = crypto.createHash("sha256").update(ip).digest("hex");
  const token = cookies().get(USER_SESSION_COOKIE)?.value;
  const session = verifyUserSession(token);
  await connectMongo();
  await SearchLogModel.create({
    plate: args.plate,
    userId: session?.sub,
    ipHash,
    resultFrom: args.resultFrom
  });
}


export async function GET(request: Request, { params }: Params) {
  try {
    const url = new URL(request.url);
    const plate = parsePlateOrThrow(params.plate);
    const locale = parseLocale(url.searchParams.get("lang"));
    const includeAi = url.searchParams.get("include_ai") === "1";
    const downloadReport = url.searchParams.get("download") === "1";
    const userMileage = parseUserMileage(url.searchParams.get("mileage"));

    if (!includeAi && !downloadReport) {
      const profile = await getVehicleProfile(plate);
      await trackSearch({
        plate,
        resultFrom: profile.fromCache ? "cache" : "api"
      });
      const localized = localizeVehicleProfile(profile, locale) as Record<string, unknown>;
      return NextResponse.json(localized);
    }

    const { localized, aiInsights, aiValuation } = await buildLocalizedWithAi(plate, locale, userMileage);

    if (downloadReport) {
      const hasAccess = await hasPaidReportAccess(plate);
      if (!hasAccess) {
        return NextResponse.json({ error: "Payment required for report download.", code: "PAYMENT_REQUIRED" }, { status: 402 });
      }
      const pdf = await generateVehicleReportPdf({
        plate,
        locale,
        generatedAt: new Date(),
        data: localized,
        aiInsights,
        aiValuation
      });
      await trackReportIfUserLoggedIn({ plate, locale, channel: "download" });
      return new NextResponse(new Uint8Array(pdf), {
        headers: {
          "content-type": "application/pdf",
          "content-disposition": `attachment; filename="kentekenrapport-${plate}.pdf"`
        }
      });
    }

    return NextResponse.json({
      ...localized,
      aiInsights,
      aiValuation
    });
  } catch (error) {
    return errorResponse(error, "Unknown lookup error.");
  }
}

export async function POST(request: Request, { params }: Params) {
  try {
    const plate = parsePlateOrThrow(params.plate);
    const body = (await request.json()) as { email?: string; lang?: string };
    const locale = parseLocale(body.lang ?? null);
    const email = String(body.email ?? "").trim().toLowerCase();
    if (!isValidEmail(email)) {
      console.warn("[report-email] request invalid-email", { to: maskEmail(email), plate });
      return NextResponse.json({ error: "Invalid email address.", code: "INVALID_EMAIL" }, { status: 400 });
    }

    const hasAccess = await hasPaidReportAccess(plate);
    if (!hasAccess) {
      console.warn("[report-email] request payment-required", { to: maskEmail(email), plate });
      return NextResponse.json({ error: "Payment required for report email.", code: "PAYMENT_REQUIRED" }, { status: 402 });
    }

    void processReportEmailAsync({ plate, locale, email });
    console.info("[report-email] request accepted", { to: maskEmail(email), plate, queued: true, mode: "fire-and-forget" });
    const successMessage =
      locale === "nl"
        ? "Rapportverzoek ontvangen. We sturen het rapport binnen 5 minuten naar je e-mail."
        : "Report request received. We will send the report to your email within 5 minutes.";
    return NextResponse.json({
      ok: true,
      queued: true,
      delivered: null,
      reason: null,
      email,
      etaMinutes: 5,
      message: successMessage
    }, { status: 202 });
  } catch (error) {
    return errorResponse(error, "Unable to send report email.");
  }
}
