import { redirect } from "next/navigation";
import { getCurrentUser, redirectForRole } from "@/lib/auth";

export default async function RootPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  await redirectForRole();
}
