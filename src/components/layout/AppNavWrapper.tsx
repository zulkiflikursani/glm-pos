import { getSession } from "@/lib/auth";

import { AppNav } from "./AppNav";

export async function AppNavWrapper() {
  const session = await getSession();
  if (!session) return null;
  return <AppNav user={session} />;
}
