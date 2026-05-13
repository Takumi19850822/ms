import { notFound } from "next/navigation";
import { ResourcePage } from "@/components/ResourcePage";
import { UserAdminPage } from "@/components/UserAdminPage";
import { MASTER_CATEGORIES } from "@/lib/resources";
import { getSessionFromCookie } from "@/lib/auth";
import { listResource } from "@/lib/data";
import { listUsers } from "@/lib/users";

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

  if (current.key === "user") {
    if (session.role !== "admin") {
      notFound();
    }
    const initialRows = await listUsers("");
    return <UserAdminPage initialRows={initialRows} />;
  }

  const initialRows = await listResource(current.resourceId, session, "");
  return <ResourcePage key={current.resourceId} title={current.title} resourceId={current.resourceId} initialRows={initialRows} />;
}
