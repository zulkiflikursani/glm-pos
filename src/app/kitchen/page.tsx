import { getKitchenTickets } from "@/app/kitchen/actions";
import { KitchenDisplay } from "@/components/kitchen/KitchenDisplay";

export default async function KitchenPage() {
  const tickets = await getKitchenTickets(true);

  return <KitchenDisplay initialTickets={tickets} />;
}
