import { redirect } from "next/navigation";
import { LoginForm } from "@/components/login-form";
import { LoginSplitShell, type LoginRole } from "@/components/login-split-shell";

const VALID_ROLES: readonly LoginRole[] = ["player", "mentor", "gm"];

function isLoginRole(value: unknown): value is LoginRole {
  return typeof value === "string" && (VALID_ROLES as readonly string[]).includes(value);
}

type LoginPageProps = {
  searchParams: Promise<{ role?: string }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { role: roleParam } = await searchParams;
  if (!isLoginRole(roleParam)) {
    redirect("/landing");
  }

  return (
    <LoginSplitShell role={roleParam}>
      <LoginForm role={roleParam} />
    </LoginSplitShell>
  );
}
