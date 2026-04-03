import { NextResponse } from "next/server";
import { connectMongo } from "@/lib/db/mongodb";
import { CmsPageModel } from "@/models/CmsPage";
import { ensureLegalPages } from "@/lib/cms/legal-pages";

export const runtime = "nodejs";

type Params = { params: { slug: string } };

export async function GET(_: Request, { params }: Params) {
  await connectMongo();
  await ensureLegalPages();
  const page = await CmsPageModel.findOne({ slug: params.slug.toLowerCase(), published: true }).lean();
  if (!page) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json(page);
}
