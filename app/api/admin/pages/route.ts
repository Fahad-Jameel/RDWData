import { NextResponse } from "next/server";
import { connectMongo } from "@/lib/db/mongodb";
import { CmsPageModel } from "@/models/CmsPage";
import { getAdminSessionFromCookies } from "@/lib/admin/session";
import { ensureLegalPages } from "@/lib/cms/legal-pages";

export const runtime = "nodejs";

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

export async function GET() {
  const session = getAdminSessionFromCookies();
  if (!session) return unauthorized();
  await connectMongo();
  await ensureLegalPages();
  const pages = await CmsPageModel.find().sort({ updatedAt: -1 }).lean();
  return NextResponse.json(pages);
}

export async function POST(request: Request) {
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

  const title = (body.title ?? "").trim();
  const slug = slugify((body.slug ?? title).trim());
  if (!title || !slug) {
    return NextResponse.json({ error: "Title and slug are required." }, { status: 400 });
  }

  await connectMongo();
  const created = await CmsPageModel.create({
    title,
    slug,
    content: body.content ?? "",
    published: Boolean(body.published),
    showInHeader: Boolean(body.showInHeader),
    showInFooter: Boolean(body.showInFooter)
  });
  return NextResponse.json(created);
}
