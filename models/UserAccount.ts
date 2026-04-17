import { model, models, Schema, type Model } from "mongoose";

export type UserAccountDoc = {
  email: string;
  passwordHash: string;
  createdAt: Date;
};

const userAccountSchema = new Schema<UserAccountDoc>(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    passwordHash: { type: String, required: true },
    createdAt: { type: Date, default: Date.now, required: true }
  },
  { versionKey: false }
);

export const UserAccountModel: Model<UserAccountDoc> =
  (models.UserAccount as Model<UserAccountDoc> | undefined) || model<UserAccountDoc>("UserAccount", userAccountSchema);
