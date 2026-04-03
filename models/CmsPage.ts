import { model, models, Schema, type Model } from "mongoose";

export type CmsPageDoc = {
  title: string;
  slug: string;
  content: string;
  published: boolean;
  showInHeader: boolean;
  showInFooter: boolean;
  createdAt: Date;
  updatedAt: Date;
};

const cmsPageSchema = new Schema<CmsPageDoc>(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, index: true, trim: true, lowercase: true },
    content: { type: String, required: true, default: "" },
    published: { type: Boolean, required: true, default: false },
    showInHeader: { type: Boolean, required: true, default: false },
    showInFooter: { type: Boolean, required: true, default: false }
  },
  { timestamps: true, versionKey: false }
);

export const CmsPageModel: Model<CmsPageDoc> =
  (models.CmsPage as Model<CmsPageDoc> | undefined) ||
  model<CmsPageDoc>("CmsPage", cmsPageSchema);

