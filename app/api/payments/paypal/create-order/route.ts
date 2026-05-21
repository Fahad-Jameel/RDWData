import { NextResponse } from "next/server";
import { createPaypalOrder } from "@/lib/payments/paypal";
import { getSiteSettings } from "@/lib/site-settings/service";
import { connectMongo } from "@/lib/db/mongodb";
import { PaymentOrderModel } from "@/models/PaymentOrder";
import { PlatePaymentModel } from "@/models/PlatePayment";

export const runtime = "nodejs";

type CreateOrderBody = {
  plate: string;
  email?: string;
  promoCode?: string;
};

function normalizePlate(plate: string): string {
  return plate.replace(/[^A-Z0-9]/gi, "").toUpperCase();
}

function mapCreateOrderError(error: unknown): { status: number; code: string; error: string } {
  const message = error instanceof Error ? error.message : "Failed to create PayPal order.";
  const upper = message.toUpperCase();
  if (upper.includes("PAYPAL AUTH FAILED") || upper.includes("MISSING PAYPAL_CLIENT_ID")) {
    return {
      status: 500,
      code: "PAYPAL_CONFIG_ERROR",
      error: "Payment is temporarily unavailable. Please try again shortly."
    };
  }
  return {
    status: 500,
    code: "PAYPAL_CREATE_ORDER_FAILED",
    error: "Unable to start payment right now. Please try again."
  };
}

function toMoney(value: number): string {
  return Math.max(0, value).toFixed(2);
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as CreateOrderBody;
    const plate = normalizePlate(body.plate ?? "");
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const promoCodeInput = String(body.promoCode ?? "").trim().toUpperCase();
    if (!plate) {
      return NextResponse.json({ error: "Missing plate." }, { status: 400 });
    }

    const settings = await getSiteSettings();
    const baseAmountNumber = Number(settings.payment.amount);
    const safeBaseAmount = Number.isFinite(baseAmountNumber) && baseAmountNumber > 0 ? baseAmountNumber : 9.95;
    const currency = settings.payment.currency.toUpperCase();
    let discountType: "special" | "promo_percent" | "promo_fixed" | undefined;
    let discountValue = 0;
    let promoCodeApplied: string | undefined;

    await connectMongo();

    if (promoCodeInput) {
      const code = settings.payment.promoCodes.find((row) => row.code.trim().toUpperCase() === promoCodeInput);
      if (!code || !code.active) {
        return NextResponse.json({ error: "Invalid promo code.", code: "PROMO_INVALID" }, { status: 400 });
      }
      if (code.expiresAt && !Number.isNaN(Date.parse(code.expiresAt)) && new Date(code.expiresAt) < new Date()) {
        return NextResponse.json({ error: "Promo code expired.", code: "PROMO_EXPIRED" }, { status: 400 });
      }
      if (code.maxUses > 0) {
        const usage = await PlatePaymentModel.countDocuments({
          status: "COMPLETED",
          provider: "paypal",
          promoCode: promoCodeInput
        });
        if (usage >= code.maxUses) {
          return NextResponse.json({ error: "Promo usage limit reached.", code: "PROMO_LIMIT" }, { status: 400 });
        }
      }
      promoCodeApplied = promoCodeInput;
      if (code.type === "percent") {
        discountType = "promo_percent";
        discountValue = (safeBaseAmount * Math.max(0, code.value)) / 100;
      } else {
        discountType = "promo_fixed";
        discountValue = Math.max(0, code.value);
      }
    } else if (settings.payment.specialDiscountEnabled) {
      discountType = "special";
      discountValue = (safeBaseAmount * Math.max(0, settings.payment.specialDiscountPercent)) / 100;
    }

    const amount = toMoney(safeBaseAmount - discountValue);
    const customId = `plate:${plate}`;

    const order = await createPaypalOrder({
      amount,
      currency,
      customId,
      description: `Kentekenrapport full unlock for ${plate}`
    });

    const orderId = String((order as { id?: unknown }).id ?? "");
    if (orderId) {
      await PaymentOrderModel.updateOne(
        { orderId },
        {
          $set: {
            orderId,
            plate,
            ...(email ? { email } : {}),
            currency,
            baseAmount: toMoney(safeBaseAmount),
            finalAmount: amount,
            ...(promoCodeApplied ? { promoCode: promoCodeApplied } : {}),
            ...(discountType ? { discountType } : {}),
            ...(discountType ? { discountValue: toMoney(discountValue) } : {}),
            status: "CREATED"
          }
        },
        { upsert: true }
      );
    }

    return NextResponse.json({
      ...order,
      pricing: {
        baseAmount: toMoney(safeBaseAmount),
        finalAmount: amount,
        currency,
        discountType: discountType ?? null,
        discountValue: discountType ? toMoney(discountValue) : "0.00",
        promoCode: promoCodeApplied ?? null
      }
    });
  } catch (error) {
    const mapped = mapCreateOrderError(error);
    return NextResponse.json({ error: mapped.error, code: mapped.code }, { status: mapped.status });
  }
}

