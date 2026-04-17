import { model, models, Schema, type Model, type Types } from "mongoose";

type WatchAlert = {
  type: "RECALL_CHANGED" | "APK_CHANGED" | "RISK_CHANGED";
  message: string;
  createdAt: Date;
};

type WatchSnapshot = {
  hasOpenRecall: boolean;
  apkExpiryDate: string | null;
  maintenanceRiskScore: number | null;
};

export type PlateWatchDoc = {
  userId: Types.ObjectId;
  plate: string;
  title?: string;
  snapshot: WatchSnapshot;
  alerts: WatchAlert[];
  createdAt: Date;
  updatedAt: Date;
  lastCheckedAt?: Date;
};

const alertSchema = new Schema<WatchAlert>(
  {
    type: { type: String, enum: ["RECALL_CHANGED", "APK_CHANGED", "RISK_CHANGED"], required: true },
    message: { type: String, required: true },
    createdAt: { type: Date, required: true, default: Date.now }
  },
  { _id: false }
);

const watchSnapshotSchema = new Schema<WatchSnapshot>(
  {
    hasOpenRecall: { type: Boolean, required: true, default: false },
    apkExpiryDate: { type: String, required: false, default: null },
    maintenanceRiskScore: { type: Number, required: false, default: null }
  },
  { _id: false }
);

const plateWatchSchema = new Schema<PlateWatchDoc>(
  {
    userId: { type: Schema.Types.ObjectId, required: true, index: true, ref: "UserAccount" },
    plate: { type: String, required: true, index: true },
    title: { type: String, required: false, trim: true },
    snapshot: { type: watchSnapshotSchema, required: true, default: () => ({}) },
    alerts: { type: [alertSchema], required: true, default: [] },
    lastCheckedAt: { type: Date, required: false }
  },
  {
    versionKey: false,
    timestamps: true
  }
);

plateWatchSchema.index({ userId: 1, plate: 1 }, { unique: true });

export const PlateWatchModel: Model<PlateWatchDoc> =
  (models.PlateWatch as Model<PlateWatchDoc> | undefined) || model<PlateWatchDoc>("PlateWatch", plateWatchSchema);
