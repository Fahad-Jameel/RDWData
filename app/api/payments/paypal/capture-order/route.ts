import { NextResponse } from "next/server";
import { capturePaypalOrder } from "@/lib/payments/paypal";
import { connectMongo } from "@/lib/db/mongodb";
import { PlatePaymentModel } from "@/models/PlatePayment";

export const runtime = "nodejs";

type CaptureBody = {
  orderId: string;
  plate: string;
};

function normalizePlate(plate: string): string {
  return plate.replace(/[^A-Z0-9]/gi, "").toUpperCase();
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as CaptureBody;
    const orderId = body.orderId?.trim();
    const plate = normalizePlate(body.plate ?? "");

    if (!orderId || !plate) {
      return NextResponse.json({ error: "Missing orderId or plate." }, { status: 400 });
    }

    const capture = (await capturePaypalOrder(orderId)) as {
      status?: string;
      id?: string;
      purchase_units?: Array<{
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

    if (captureStatus !== "COMPLETED") {
      return NextResponse.json(
        { error: `PayPal capture not completed: ${captureStatus}` },
        { status: 402 }
      );
    }

    await connectMongo();
    await PlatePaymentModel.updateOne(
      { orderId },
      {
        $set: {
          plate,
          orderId,
          captureId: firstCapture?.id ?? capture.id ?? orderId,
          amount: firstCapture?.amount?.value ?? "9.95",
          currency: firstCapture?.amount?.currency_code ?? "EUR",
          status: "COMPLETED",
          provider: "paypal",
          createdAt: new Date()
        }
      },
      { upsert: true }
    );

    return NextResponse.json({ ok: true, plate, orderId, status: "COMPLETED" });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to capture PayPal order.";
    return NextResponse.json({ error: message, code: "PAYPAL_CAPTURE_FAILED" }, { status: 500 });
  }
}
