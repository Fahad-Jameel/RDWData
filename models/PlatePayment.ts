import { model, models, Schema, type Model } from "mongoose";

export type PlatePaymentDoc = {
  plate: string;
  orderId: string;
  captureId: string;
  email?: string;
  promoCode?: string;
  discountType?: "special" | "promo_percent" | "promo_fixed";
  discountValue?: string;
  baseAmount?: string;
  amount: string;
  currency: string;
  status: "COMPLETED" | "PENDING" | "FAILED";
  provider: "paypal";
  createdAt: Date;
};

const platePaymentSchema = new Schema<PlatePaymentDoc>(
  {
    plate: { type: String, required: true, index: true },
    orderId: { type: String, required: true, unique: true, index: true },
    captureId: { type: String, required: true },
    email: { type: String, required: false, lowercase: true, trim: true },
    promoCode: { type: String, required: false, uppercase: true, trim: true },
    discountType: { type: String, enum: ["special", "promo_percent", "promo_fixed"], required: false },
    discountValue: { type: String, required: false },
    baseAmount: { type: String, required: false },
    amount: { type: String, required: true },
    currency: { type: String, required: true, default: "EUR" },
    status: { type: String, enum: ["COMPLETED", "PENDING", "FAILED"], required: true },
    provider: { type: String, enum: ["paypal"], required: true, default: "paypal" },
    createdAt: { type: Date, default: Date.now, required: true }
  },
  {
    versionKey: false
  }
);

export const PlatePaymentModel: Model<PlatePaymentDoc> =
  (models.PlatePayment as Model<PlatePaymentDoc> | undefined) ||
  model<PlatePaymentDoc>("PlatePayment", platePaymentSchema);
