// HelpInboxBell (quick-260512-24v)
// Server component: fetches initial unread (status='open') help_requests
// count, then delegates to HelpInboxBellLive (client component) which
// subscribes to Supabase Realtime for live increments (deferred #2).
// Renders an ambre badge (no red-clignotant, no son -- advisor cond 5).

import { countUnreadHelpRequests } from "@/lib/help-requests";
import { HelpInboxBellLive } from "@/components/help/HelpInboxBellLive";

export async function HelpInboxBell() {
  const count = await countUnreadHelpRequests();
  return <HelpInboxBellLive initialCount={count} />;
}
