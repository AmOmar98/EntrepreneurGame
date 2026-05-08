import { AppShell } from "@/components/app-shell";
import { getCurrentRole, getCurrentUser } from "@/lib/auth";

export default async function AdminPage() {
  const user = await getCurrentUser();
  const role = await getCurrentRole();
  return (
    <AppShell role={role ?? "game_master"}>
      <main style={{ padding: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 600 }}>GameMaster admin</h1>
        <p style={{ color: "#666", fontSize: 14 }}>Implementation Phase 4 (ADMIN-*).</p>
        <pre style={{ marginTop: 16, fontSize: 12, color: "#888" }}>
          user: {user?.email ?? "none"} | role: {role ?? "none"}
        </pre>
      </main>
    </AppShell>
  );
}
