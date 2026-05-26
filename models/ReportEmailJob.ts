import { model, models, Schema, type Model } from "mongoose";

export type ReportEmailJobDoc = {
  plate: string;
  email: string;
  locale: "nl" | "en";
  status: "PENDING" | "PROCESSING" | "SENT" | "FAILED";
  attempts: number;
  nextRetryAt: Date;
  lockedAt?: Date | null;
  lastError?: string | null;
  createdAt: Date;
  updatedAt: Date;
};

const reportEmailJobSchema = new Schema<ReportEmailJobDoc>(
  {
    plate: { type: String, required: true, index: true },
    email: { type: String, required: true, lowercase: true, trim: true, index: true },
    locale: { type: String, enum: ["nl", "en"], required: true, default: "nl" },
    status: {
      type: String,
      enum: ["PENDING", "PROCESSING", "SENT", "FAILED"],
      required: true,
      default: "PENDING",
      index: true
    },
    attempts: { type: Number, required: true, default: 0 },
    nextRetryAt: { type: Date, required: true, default: Date.now, index: true },
    lockedAt: { type: Date, required: false, default: null },
    lastError: { type: String, required: false, default: null }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

export const ReportEmailJobModel: Model<ReportEmailJobDoc> =
  (models.ReportEmailJob as Model<ReportEmailJobDoc> | undefined) ||
  model<ReportEmailJobDoc>("ReportEmailJob", reportEmailJobSchema);

