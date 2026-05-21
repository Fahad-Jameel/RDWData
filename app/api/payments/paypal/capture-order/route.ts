import { NextResponse } from "next/server";
import { capturePaypalOrder } from "@/lib/payments/paypal";
import { connectMongo } from "@/lib/db/mongodb";
import { PlatePaymentModel } from "@/models/PlatePayment";
import { PaymentOrderModel } from "@/models/PaymentOrder";

export const runtime = "nodejs";

type CaptureBody = {
  orderId: string;
  plate: string;
  email?: string;
};

function normalizePlate(plate: string): string {
  return plate.replace(/[^A-Z0-9]/gi, "").toUpperCase();
}

function normalizeAmount(value: string): string {
  const numeric = Number(value);
  if (!Number.isFinite(numeric) || numeric <= 0) return "0.00";
  return numeric.toFixed(2);
}

function mapCaptureError(error: unknown): { status: number; code: string; error: string } {
  const message = error instanceof Error ? error.message : "Failed to capture PayPal order.";
  const upper = message.toUpperCase();

  if (upper.includes("INSTRUMENT_DECLINED")) {
    return {
      status: 402,
      code: "INSTRUMENT_DECLINED",
      error: "Payment method was declined. Please try a different PayPal method."
    };
  }

  if (upper.includes("UNPROCESSABLE_ENTITY")) {
    return {
      status: 422,
      code: "PAYPAL_UNPROCESSABLE_ENTITY",
      error: "Payment could not be completed. Please try again."
    };
  }

  return {
    status: 500,
    code: "PAYPAL_CAPTURE_FAILED",
    error: "Payment capture failed. Please try again."
  };
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as CaptureBody;
    const orderId = body.orderId?.trim();
    const plate = normalizePlate(body.plate ?? "");
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";

    if (!orderId || !plate) {
      return NextResponse.json({ error: "Missing orderId or plate." }, { status: 400 });
    }

    const capture = (await capturePaypalOrder(orderId)) as {
      status?: string;
      id?: string;
      purchase_units?: Array<{
        custom_id?: string;
        payments?: {
          captures?: Array<{
            id?: string;
            amount?: { value?: string; currency_code?: string };
            status?: string;
          }>;
        };
      }>;
    };

    const unit = capture.purchase_units?.[0];
    const firstCapture = unit?.payments?.captures?.[0];
    const captureStatus = firstCapture?.status ?? capture.status ?? "UNKNOWN";
    const expectedCustomId = `plate:${plate}`;

    if (captureStatus !== "COMPLETED") {
      return NextResponse.json(
        { error: `PayPal capture not completed: ${captureStatus}` },
        { status: 402 }
      );
    }

    if ((unit?.custom_id ?? "") !== expectedCustomId) {
      return NextResponse.json({ error: "Order plate mismatch.", code: "ORDER_PLATE_MISMATCH" }, { status: 400 });
    }

    await connectMongo();
    const orderDoc = await PaymentOrderModel.findOne({ orderId }).lean();
    if (!orderDoc) {
      return NextResponse.json({ error: "Order not found.", code: "ORDER_NOT_FOUND" }, { status: 404 });
    }
    if (orderDoc.plate !== plate) {
      return NextResponse.json({ error: "Order plate mismatch.", code: "ORDER_PLATE_MISMATCH" }, { status: 400 });
    }
    const expectedAmount = normalizeAmount(orderDoc.finalAmount);
    const expectedCurrency = String(orderDoc.currency ?? "").toUpperCase();
    const capturedAmount = normalizeAmount(firstCapture?.amount?.value ?? "0");
    const capturedCurrency = (firstCapture?.amount?.currency_code ?? "").toUpperCase();
    if (capturedAmount !== expectedAmount || capturedCurrency !== expectedCurrency) {
      return NextResponse.json({ error: "Order amount/currency mismatch.", code: "ORDER_AMOUNT_MISMATCH" }, { status: 400 });
    }

    await PlatePaymentModel.updateOne(
      { orderId },
      {
        $set: {
          plate,
          orderId,
          ...(email ? { email } : {}),
          ...(!email && orderDoc.email ? { email: orderDoc.email } : {}),
          ...(orderDoc.promoCode ? { promoCode: orderDoc.promoCode } : {}),
          ...(orderDoc.discountType ? { discountType: orderDoc.discountType } : {}),
          ...(orderDoc.discountValue ? { discountValue: orderDoc.discountValue } : {}),
          ...(orderDoc.baseAmount ? { baseAmount: orderDoc.baseAmount } : {}),
          captureId: firstCapture?.id ?? capture.id ?? orderId,
          amount: firstCapture?.amount?.value ?? orderDoc.finalAmount ?? "9.95",
          currency: firstCapture?.amount?.currency_code ?? orderDoc.currency ?? "EUR",
          status: "COMPLETED",
          provider: "paypal",
          createdAt: new Date()
        }
      },
      { upsert: true }
    );
    await PaymentOrderModel.updateOne({ orderId }, { $set: { status: "CAPTURED", updatedAt: new Date() } });

    return NextResponse.json({ ok: true, plate, orderId, status: "COMPLETED" });
  } catch (error) {
    const mapped = mapCaptureError(error);
    return NextResponse.json({ error: mapped.error, code: mapped.code }, { status: mapped.status });
  }
}
