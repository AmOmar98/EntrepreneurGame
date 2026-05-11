// Phase 10 / Section 12 — Profil joueur (long-terme).
// Route publique /player/[slug] — gated par publication ranking (R1).
// Avant publication = SysEmpty "Profil disponible apres le pitch".

import Link from "next/link";
import { SysEmpty } from "@/components/system/SysEmpty";
import { getPlayerProfile } from "@/lib/profile";
import { dictionaries } from "@/lib/i18n";

const t = dictionaries.fr;

const SKILL_LABELS: Record<string, string> = {
  discovery: t.profile_skills_discovery,
  collaboration: t.profile_skills_collaboration,
  resilience: t.profile_skills_resilience,
  storytelling: t.profile_skills_storytelling,
};

function formatDateFr(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("fr-FR", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  });
}

export default async function PlayerDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  // Pilot T-3 : ranking gate is hardcoded false in demo mode. Supabase
  // aggregation reading events.results_published_at to be wired in
  // follow-up commit. Keeps R1 cardinal rule honored.
  const profile = getPlayerProfile(slug, { rankingPublished: false });

  if (!profile) {
    return (
      <main className="main">
        <SysEmpty
          title={t.profile_unavailable_title}
          lead={t.profile_unavailable_lead}
        />
      </main>
    );
  }

  return (
    <main className="main">
      <article className="eic-profile">
        <Link className="eic-button eic-button--ghost eic-profile__back" href="/journey">
          ← Retour
        </Link>
        <header className="eic-profile__header">
          <p className="eic-profile__kicker">{t.profile_kicker}</p>
          <h1 className="eic-profile__title">{profile.name}</h1>
          <p className="eic-profile__lead">
            {t.profile_lead} <span className="eic-profile__level">{profile.currentLevel}</span>
          </p>
        </header>

        <section className="eic-profile__stats" aria-label={t.profile_kicker}>
          <Stat value={profile.hackCount} label={t.profile_stats_hacks} />
          <Stat value={profile.winCount} label={t.profile_stats_wins} />
          <Stat value={profile.mentorCount} label={t.profile_stats_mentors} />
          <Stat value={profile.submissionCount} label={t.profile_stats_submissions} />
          <Stat value={profile.xpTotal} label={t.profile_stats_xp} />
        </section>

        <section aria-labelledby="profile-skills" className="eic-profile__section">
          <h2 id="profile-skills" className="eic-profile__section-title">
            {t.profile_skills_title}
          </h2>
          <ul className="eic-profile__skills">
            {profile.skills.map((s) => (
              <li key={s.key} className="eic-profile__skill">
                <span className="eic-profile__skill-label">
                  {SKILL_LABELS[s.key] ?? s.key}
                </span>
                <span className="eic-profile__skill-bar" aria-hidden="true">
                  <span
                    className="eic-profile__skill-fill"
                    style={{ width: `${Math.min(100, Math.max(0, s.ratio))}%` }}
                  />
                </span>
                <span className="eic-profile__skill-ratio">{s.ratio}%</span>
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="profile-badges" className="eic-profile__section">
          <h2 id="profile-badges" className="eic-profile__section-title">
            {t.profile_badges_title}
          </h2>
          <ul className="eic-profile__badges">
            {profile.badges.map((b) => (
              <li
                key={b.id}
                className={
                  "eic-profile__badge" +
                  (b.unlockedAt ? "" : " eic-profile__badge--locked")
                }
                title={b.unlockedAt ? b.label : t.profile_badge_locked}
              >
                <span className="eic-profile__badge-emoji" aria-hidden="true">
                  {b.unlockedAt ? "★" : "✦"}
                </span>
                <span className="eic-profile__badge-label">
                  {b.unlockedAt ? b.label : t.profile_badge_locked}
                </span>
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="profile-history" className="eic-profile__section">
          <h2 id="profile-history" className="eic-profile__section-title">
            {t.profile_history_title}
          </h2>
          {profile.hacks.length === 0 ? (
            <p className="eic-profile__empty">{t.profile_history_empty}</p>
          ) : (
            <ol className="eic-profile__history">
              {profile.hacks.map((h, i) => (
                <li key={i} className="eic-profile__hack">
                  <span className="eic-profile__hack-date">
                    {formatDateFr(h.startedAt)}
                    {h.endedAt ? ` → ${formatDateFr(h.endedAt)}` : ""}
                  </span>
                  <span className="eic-profile__hack-name">{h.eventName}</span>
                  <span className={`eic-profile__hack-outcome eic-profile__hack-outcome--${h.outcome}`}>
                    {h.outcome === "winner" ? "🏆" : h.outcome === "finalist" ? "★" : "·"}
                  </span>
                </li>
              ))}
            </ol>
          )}
        </section>

        <section aria-labelledby="profile-mentors" className="eic-profile__section">
          <h2 id="profile-mentors" className="eic-profile__section-title">
            {t.profile_mentors_title}
          </h2>
          {profile.mentors.length === 0 ? (
            <p className="eic-profile__empty">{t.profile_mentors_empty}</p>
          ) : (
            <ul className="eic-profile__mentors">
              {profile.mentors.map((m, i) => (
                <li key={i} className="eic-pill eic-pill--blue">{m}</li>
              ))}
            </ul>
          )}
        </section>

        <Link className="eic-button eic-button--primary" href="/journey">
          {t.profile_cta_next} →
        </Link>
      </article>
    </main>
  );
}

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <div className="eic-profile__stat">
      <strong className="eic-profile__stat-value">{value}</strong>
      <span className="eic-profile__stat-label">{label}</span>
    </div>
  );
}
