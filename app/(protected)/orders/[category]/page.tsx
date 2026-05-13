import { notFound } from "next/navigation";
import { ResourcePage } from "@/components/ResourcePage";
import { ORDER_CATEGORIES } from "@/lib/resources";
import { getSessionFromCookie } from "@/lib/auth";
import { listResource } from "@/lib/data";

type Props = {
  params: Promise<{ category: string }>;
};

export default async function OrderPage({ params }: Props) {
  const { category } = await params;
  const current = ORDER_CATEGORIES.find((item) => item.key === category);
  if (!current) {
    notFound();
  }
  const session = await getSessionFromCookie();
  if (!session) {
    notFound();
  }
  const initialRows = await listResource(current.resourceId, session, "");
  return <ResourcePage key={current.resourceId} title={current.title} resourceId={current.resourceId} initialRows={initialRows} />;
}
