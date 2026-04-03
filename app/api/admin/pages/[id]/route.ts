import { NextResponse } from "next/server";
import { connectMongo } from "@/lib/db/mongodb";
import { CmsPageModel } from "@/models/CmsPage";
import { getAdminSessionFromCookies } from "@/lib/admin/session";
import { ensureLegalPages } from "@/lib/cms/legal-pages";

export const runtime = "nodejs";

type Params = { params: { id: string } };

function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export async function PUT(request: Request, { params }: Params) {
  const session = getAdminSessionFromCookies();
  if (!session) return unauthorized();
  const body = (await request.json()) as Partial<{
    title: string;
    slug: string;
    content: string;
    published: boolean;
    showInHeader: boolean;
    showInFooter: boolean;
  }>;

  await connectMongo();
  const next = {
    ...(body.title ? { title: body.title.trim() } : {}),
    ...(body.slug ? { slug: slugify(body.slug) } : {}),
    ...(body.content !== undefined ? { content: body.content } : {}),
    ...(body.published !== undefined ? { published: Boolean(body.published) } : {}),
    ...(body.showInHeader !== undefined ? { showInHeader: Boolean(body.showInHeader) } : {}),
    ...(body.showInFooter !== undefined ? { showInFooter: Boolean(body.showInFooter) } : {})
  };
  const updated = await CmsPageModel.findByIdAndUpdate(params.id, { $set: next }, { new: true });
  if (!updated) return NextResponse.json({ error: "Page not found." }, { status: 404 });
  return NextResponse.json(updated);
}

export async function DELETE(_: Request, { params }: Params) {
  const session = getAdminSessionFromCookies();
  if (!session) return unauthorized();
  await connectMongo();
  await ensureLegalPages();
  const existing = await CmsPageModel.findById(params.id).lean();
  if (existing?.slug === "privacy-policy" || existing?.slug === "terms-and-conditions") {
    return NextResponse.json({ error: "Legal pages cannot be deleted." }, { status: 400 });
  }
  await CmsPageModel.findByIdAndDelete(params.id);
  return NextResponse.json({ ok: true });
}
