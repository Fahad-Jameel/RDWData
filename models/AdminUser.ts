import { model, models, Schema, type Model } from "mongoose";

export type AdminUserDoc = {
  email: string;
  passwordHash: string;
  createdAt: Date;
  updatedAt: Date;
};

const adminUserSchema = new Schema<AdminUserDoc>(
  {
    email: { type: String, required: true, unique: true, index: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

export const AdminUserModel: Model<AdminUserDoc> =
  (models.AdminUser as Model<AdminUserDoc> | undefined) ||
  model<AdminUserDoc>("AdminUser", adminUserSchema);

