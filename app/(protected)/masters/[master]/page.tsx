import { notFound } from "next/navigation";
import { ResourcePage } from "@/components/ResourcePage";
import { MASTER_CATEGORIES } from "@/lib/resources";
import { getSessionFromCookie } from "@/lib/auth";
import { listResource } from "@/lib/data";

type Props = {
  params: Promise<{ master: string }>;
};

export default async function MasterPage({ params }: Props) {
  const { master } = await params;
  const current = MASTER_CATEGORIES.find((item) => item.key === master);
  if (!current) {
    notFound();
  }
  const session = await getSessionFromCookie();
  if (!session) {
    notFound();
  }
  const initialRows = await listResource(current.resourceId, session, "");
  return <ResourcePage title={current.title} resourceId={current.resourceId} initialRows={initialRows} />;
}
