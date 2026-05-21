import { model, models, Schema, type Model } from "mongoose";

export type PaymentOrderDoc = {
  orderId: string;
  plate: string;
  email?: string;
  currency: string;
  baseAmount: string;
  finalAmount: string;
  promoCode?: string;
  discountType?: "special" | "promo_percent" | "promo_fixed";
  discountValue?: string;
  status: "CREATED" | "CAPTURED" | "FAILED";
  createdAt: Date;
  updatedAt: Date;
};

const paymentOrderSchema = new Schema<PaymentOrderDoc>(
  {
    orderId: { type: String, required: true, unique: true, index: true },
    plate: { type: String, required: true, index: true },
    email: { type: String, required: false, lowercase: true, trim: true },
    currency: { type: String, required: true, default: "EUR" },
    baseAmount: { type: String, required: true },
    finalAmount: { type: String, required: true },
    promoCode: { type: String, required: false, uppercase: true, trim: true },
    discountType: { type: String, enum: ["special", "promo_percent", "promo_fixed"], required: false },
    discountValue: { type: String, required: false },
    status: { type: String, enum: ["CREATED", "CAPTURED", "FAILED"], required: true, default: "CREATED" }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

export const PaymentOrderModel: Model<PaymentOrderDoc> =
  (models.PaymentOrder as Model<PaymentOrderDoc> | undefined) ||
  model<PaymentOrderDoc>("PaymentOrder", paymentOrderSchema);

