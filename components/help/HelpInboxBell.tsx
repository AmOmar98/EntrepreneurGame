// HelpInboxBell (quick-260512-24v)
// Server component: fetches unread (status='open') help_requests count.
// Renders an ambre badge (no red-clignotant, no son -- advisor cond 5).

import { Bell } from "lucide-react";
import { countUnreadHelpRequests } from "@/lib/help-requests";
import { dictionaries } from "@/lib/i18n";

const t = dictionaries.fr;

export async function HelpInboxBell() {
  const count = await countUnreadHelpRequests();
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
