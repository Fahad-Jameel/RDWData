import { model, models, Schema, type Model } from "mongoose";

export type PlatePaymentDoc = {
  plate: string;
  orderId: string;
  captureId: string;
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

