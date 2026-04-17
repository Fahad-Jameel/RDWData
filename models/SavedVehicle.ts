import { model, models, Schema, type Model, type Types } from "mongoose";

export type SavedVehicleDoc = {
  userId: Types.ObjectId;
  plate: string;
  title?: string;
  mileageInput?: number;
  createdAt: Date;
};

const savedVehicleSchema = new Schema<SavedVehicleDoc>(
  {
    userId: { type: Schema.Types.ObjectId, required: true, index: true, ref: "UserAccount" },
    plate: { type: String, required: true, index: true },
    title: { type: String, required: false, trim: true },
    mileageInput: { type: Number, required: false },
    createdAt: { type: Date, default: Date.now, required: true }
  },
  { versionKey: false }
);

savedVehicleSchema.index({ userId: 1, plate: 1 }, { unique: true });

export const SavedVehicleModel: Model<SavedVehicleDoc> =
  (models.SavedVehicle as Model<SavedVehicleDoc> | undefined) || model<SavedVehicleDoc>("SavedVehicle", savedVehicleSchema);
