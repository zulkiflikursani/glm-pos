import { getTableDetails } from "@/app/tables/actions";
import { TableManager } from "@/components/tables/TableManager";

export default async function TablesPage() {
  const tables = await getTableDetails();

  return <TableManager initialTables={tables} />;
}
