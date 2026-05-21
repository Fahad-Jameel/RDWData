import { model, models, Schema } from "mongoose";

const sectionActivitySchema = new Schema(
  {
    userId: { type: String, required: false, index: true },
    path: { type: String, required: true, index: true },
    section: { type: String, required: true, index: true },
    durationMs: { type: Number, required: true, min: 0 },
    ipHash: { type: String, required: true, index: true }
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    versionKey: false
  }
);

export const SectionActivityModel =
  models.SectionActivity || model("SectionActivity", sectionActivitySchema);
