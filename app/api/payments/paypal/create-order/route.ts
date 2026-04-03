import { NextResponse } from "next/server";
import { createPaypalOrder } from "@/lib/payments/paypal";
import { getSiteSettings } from "@/lib/site-settings/service";

export const runtime = "nodejs";

type CreateOrderBody = {
  plate: string;
  amount?: string;
  currency?: string;
};

function normalizePlate(plate: string): string {
  return plate.replace(/[^A-Z0-9]/gi, "").toUpperCase();
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as CreateOrderBody;
    const plate = normalizePlate(body.plate ?? "");
    if (!plate) {
      return NextResponse.json({ error: "Missing plate." }, { status: 400 });
    }

    const settings = await getSiteSettings();
    const amount = body.amount ?? settings.payment.amount;
    const currency = body.currency ?? settings.payment.currency;
    const customId = `plate:${plate}`;

    const order = await createPaypalOrder({
      amount,
      currency,
      customId,
      description: `Kentekenrapport full unlock for ${plate}`
    });

    return NextResponse.json(order);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create PayPal order.";
    return NextResponse.json({ error: message, code: "PAYPAL_CREATE_ORDER_FAILED" }, { status: 500 });
  }
}
