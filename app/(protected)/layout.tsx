import { redirect } from "next/navigation";
import { getSessionFromCookie } from "@/lib/auth";
import { SidebarLayout } from "@/components/SidebarLayout";

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const session = await getSessionFromCookie();
  if (!session) {
    redirect("/login");
  }

  return <SidebarLayout session={session}>{children}</SidebarLayout>;
}
