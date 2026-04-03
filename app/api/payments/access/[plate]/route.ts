import { NextResponse } from "next/server";
import { connectMongo } from "@/lib/db/mongodb";
import { PlatePaymentModel } from "@/models/PlatePayment";

export const runtime = "nodejs";

type Params = { params: { plate: string } };

function normalizePlate(plate: string): string {
  return plate.replace(/[^A-Z0-9]/gi, "").toUpperCase();
}

export async function GET(_: Request, { params }: Params) {
  try {
    const plate = normalizePlate(params.plate ?? "");
    if (!plate) {
      return NextResponse.json({ paid: false }, { status: 400 });
    }

    await connectMongo();
    const exists = await PlatePaymentModel.exists({ plate, status: "COMPLETED", provider: "paypal" });
    return NextResponse.json({ paid: Boolean(exists) });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to check access.";
    return NextResponse.json({ paid: false, error: message }, { status: 500 });
  }
}

