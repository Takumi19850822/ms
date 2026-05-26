import { redirect } from "next/navigation";
import { BasketballOrderForm } from "@/components/BasketballOrderForm";
import { getSessionFromCookie } from "@/lib/auth";
import { buildNewBasketballOrderDefaults } from "@/lib/basketball-order-defaults";

export default async function NewBasketballOrderPage() {
  const session = await getSessionFromCookie();
  if (!session) {
    redirect("/login");
  }

  const defaultValues = await buildNewBasketballOrderDefaults(session);

  return <BasketballOrderForm initialOrder={{ values: defaultValues }} />;
}
