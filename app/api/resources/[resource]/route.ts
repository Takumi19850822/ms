import { NextResponse } from "next/server";
import { createResource, listResource } from "@/lib/data";
import { getSessionFromCookie } from "@/lib/auth";
import { RESOURCE_CONFIGS } from "@/lib/resources";

type Params = {
  params: Promise<{ resource: string }>;
};

export async function GET(request: Request, { params }: Params) {
  const session = await getSessionFromCookie();
  if (!session) {
    return NextResponse.json({ message: "unauthorized" }, { status: 401 });
  }

  const { resource } = await params;
  if (!RESOURCE_CONFIGS[resource]) {
    return NextResponse.json({ message: "not found" }, { status: 404 });
  }

  const search = new URL(request.url).searchParams.get("search") ?? "";
  const rows = await listResource(resource, session, search);
  return NextResponse.json({ rows });
}

export async function POST(_request: Request, { params }: Params) {
  const session = await getSessionFromCookie();
  if (!session) {
    return NextResponse.json({ message: "unauthorized" }, { status: 401 });
  }

  const { resource } = await params;
  if (!RESOURCE_CONFIGS[resource]) {
    return NextResponse.json({ message: "not found" }, { status: 404 });
  }
  const record = await createResource(resource, session);
  return NextResponse.json({ record }, { status: 201 });
}
