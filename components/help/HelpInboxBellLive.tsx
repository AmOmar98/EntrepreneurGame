"use client";

// HelpInboxBellLive (quick-260512-24v deferred #2)
// Client component that wraps HelpInboxBell with a Supabase Realtime
// subscription on the `help_requests` table. Increments the unread count
// on INSERT and re-fetches on UPDATE (status transitions). Falls back
// silently to the SSR initial count if no browser Supabase client is
// available (demo mode).

import { Bell } from "lucide-react";
import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { dictionaries } from "@/lib/i18n";

const t = dictionaries.fr;

type Props = { initialCount: number };

export function HelpInboxBellLive({ initialCount }: Props) {
  const [count, setCount] = useState(initialCount);

  useEffect(() => {
    const supabase = createClient();
    if (!supabase) return;

    const channel = supabase
      .channel("help_requests_bell")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "help_requests" },
        (payload) => {
          // New request inserted -> bump count (status defaults to 'open')
          const status = (payload.new as { status?: string } | null)?.status;
          if (status === "open") {
            setCount((c) => c + 1);
          }
        },
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "help_requests" },
        async () => {
          // Status transition (open->acknowledged or ack->resolved) ->
          // re-query to avoid drift. Counts unread = status 'open' only.
          const { count: fresh } = await supabase
            .from("help_requests")
            .select("*", { count: "exact", head: true })
            .eq("status", "open");
          setCount(fresh ?? 0);
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <span
      className="eic-help-bell"
      aria-label={`${t.help_inbox_bell_aria} (${count})`}
      role="status"
    >
      <Bell aria-hidden="true" size={18} />
      {count > 0 ? (
        <span className="eic-help-bell__badge">{count}</span>
      ) : null}
      <span className="eic-help-bell__label">{t.help_inbox_title}</span>
    </span>
  );
}
