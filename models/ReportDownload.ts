import { model, models, Schema, type Model, type Types } from "mongoose";

export type ReportDownloadDoc = {
  userId: Types.ObjectId;
  plate: string;
  locale: "nl" | "en";
  channel: "download" | "email";
  createdAt: Date;
};

const reportDownloadSchema = new Schema<ReportDownloadDoc>(
  {
    userId: { type: Schema.Types.ObjectId, required: true, index: true, ref: "UserAccount" },
    plate: { type: String, required: true, index: true },
    locale: { type: String, enum: ["nl", "en"], required: true, default: "nl" },
    channel: { type: String, enum: ["download", "email"], required: true },
    createdAt: { type: Date, default: Date.now, required: true }
  },
  { versionKey: false }
);

export const ReportDownloadModel: Model<ReportDownloadDoc> =
  (models.ReportDownload as Model<ReportDownloadDoc> | undefined) || model<ReportDownloadDoc>("ReportDownload", reportDownloadSchema);
