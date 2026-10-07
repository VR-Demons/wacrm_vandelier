import { redirect } from "next/navigation";
import { requireSession } from "@/lib/auth/session";

export default async function AgentLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const session = await requireSession();
  if (session.role === "operador") redirect("/inbox");

  return <>{children}</>;
}
