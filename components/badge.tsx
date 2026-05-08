import { statusTone } from "@/lib/data";

export function Badge({ children, tone }: { children: React.ReactNode; tone?: string }) {
  return <span className={`badge ${tone ?? statusTone(String(children))}`}>{children}</span>;
}
