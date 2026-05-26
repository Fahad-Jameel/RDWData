import { NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { connectMongo } from "@/lib/db/mongodb";
import { ReportEmailJobModel } from "@/models/ReportEmailJob";
import { getVehicleProfile } from "@/lib/rdw/service";
import { localizeVehicleProfile } from "@/lib/i18n/vehicle";
import { applyMileageValuationOverride } from "@/lib/api/market-value";
import { buildFallbackVehicleAiReport, generateVehicleAiReport } from "@/lib/api/claude";
import { generateVehicleReportHtml } from "@/lib/api/report-template";
import { generateVehicleReportPdf } from "@/lib/api/pdf-report";
import type { Locale } from "@/lib/i18n/messages";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

const MAX_ATTEMPTS = 5;
const BATCH_SIZE = 5;

function isAuthorizedCron(request: Request): boolean {
  const cronSecret = process.env.CRON_SECRET ?? "";
  const authHeader = request.headers.get("authorization") ?? "";
  if (cronSecret && authHeader === `Bearer ${cronSecret}`) return true;
  if (request.headers.get("x-vercel-cron")) return true;
  return false;
}

function maskEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (!local || !domain) return "***";
  if (local.length <= 2) return `${local[0] ?? "*"}***@${domain}`;
  return `${local.slice(0, 2)}***@${domain}`;
}

function retryDelayMs(attempts: number): number {
  const minutes = Math.min(30, Math.max(1, 2 ** Math.max(0, attempts - 1)));
  return minutes * 60 * 1000;
}

async function buildLocalizedWithAi(plate: string, locale: Locale) {
  const profile = await getVehicleProfile(plate);
  let localized = localizeVehicleProfile(profile, locale) as Record<string, unknown>;
  localized = applyMileageValuationOverride(localized, null);
  try {
    const aiReport = await generateVehicleAiReport({
      plate,
      locale,
      vehicleData: localized
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
    console.info("[report-email] provider=smtp attempt", { to: maskedTo, host: smtpHost, port: smtpPort, secure: smtpSecure, from });
    try {
      const transporter = nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpSecure,
        auth: { user: smtpUser, pass: smtpPass }
      });
      await transporter.sendMail({
        from,
        to: args.to,
        subject: args.locale === "nl" ? `Kentekenrapport voor ${args.plate}` : `Vehicle report for ${args.plate}`,
        html: args.html,
        ...(args.pdfBase64
          ? {
              attachments: [
                { filename: `kentekenrapport-${args.plate}.pdf`, content: Buffer.from(args.pdfBase64, "base64") }
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
      subject: args.locale === "nl" ? `Kentekenrapport voor ${args.plate}` : `Vehicle report for ${args.plate}`,
      html: args.html,
      ...(args.pdfBase64
        ? {
            attachments: [{ filename: `kentekenrapport-${args.plate}.pdf`, content: args.pdfBase64 }]
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

async function processOneJob() {
  const now = new Date();
  const job = await ReportEmailJobModel.findOneAndUpdate(
    {
      status: { $in: ["PENDING", "FAILED"] },
      attempts: { $lt: MAX_ATTEMPTS },
      nextRetryAt: { $lte: now }
    },
    { $set: { status: "PROCESSING", lockedAt: now } },
    { sort: { createdAt: 1 }, new: true }
  );
  if (!job) return { processed: false };

  const masked = maskEmail(job.email);
  try {
    console.info("[report-email] queue job started", { jobId: String(job._id), to: masked, plate: job.plate, attempts: job.attempts });
    const { localized, aiInsights, aiValuation } = await buildLocalizedWithAi(job.plate, job.locale);
    const html = generateVehicleReportHtml({
      plate: job.plate,
      locale: job.locale,
      generatedAt: new Date(),
      score: {
        score: Number((localized.enriched as Record<string, unknown> | undefined)?.apkPassChance ?? 0),
        label: job.locale === "nl" ? "Voertuigscore" : "Vehicle score"
      },
      data: localized,
      aiInsights,
      aiValuation
    });
    const pdf = await generateVehicleReportPdf({
      plate: job.plate,
      locale: job.locale,
      generatedAt: new Date(),
      data: localized,
      aiInsights,
      aiValuation
    });
    const sent = await sendReportEmail({
      to: job.email,
      plate: job.plate,
      locale: job.locale,
      html,
      pdfBase64: pdf.toString("base64")
    });
    if (!sent.delivered) {
      throw new Error(sent.reason ?? "SEND_FAILED");
    }
    await ReportEmailJobModel.updateOne(
      { _id: job._id },
      { $set: { status: "SENT", lastError: null, lockedAt: null, updatedAt: new Date() }, $inc: { attempts: 1 } }
    );
    console.info("[report-email] queue job success", { jobId: String(job._id), to: masked, plate: job.plate });
    return { processed: true, success: true };
  } catch (error) {
    const reason = error instanceof Error ? error.message : "UNKNOWN_ERROR";
    const attempts = (job.attempts ?? 0) + 1;
    const nextRetryAt = new Date(Date.now() + retryDelayMs(attempts));
    await ReportEmailJobModel.updateOne(
      { _id: job._id },
      {
        $set: {
          status: attempts >= MAX_ATTEMPTS ? "FAILED" : "FAILED",
          lastError: reason,
          nextRetryAt,
          lockedAt: null,
          updatedAt: new Date()
        },
        $inc: { attempts: 1 }
      }
    );
    console.error("[report-email] queue job failed", { jobId: String(job._id), to: masked, plate: job.plate, attempts, reason });
    return { processed: true, success: false };
  }
}

export async function GET(request: Request) {
  if (!isAuthorizedCron(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  await connectMongo();
  let processed = 0;
  let success = 0;
  for (let i = 0; i < BATCH_SIZE; i += 1) {
    const result = await processOneJob();
    if (!result.processed) break;
    processed += 1;
    if (result.success) success += 1;
  }
  return NextResponse.json({ ok: true, processed, success, failed: processed - success });
}
