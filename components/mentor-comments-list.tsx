// Phase 8 / Plan 08 - Mentor comments list (MNT-03).
// Server component: renders the antichrono list of evaluation_comments tied
// to a submission. Each row is a tagged comment ('remarque' green / 'a_corriger'
// amber) with avatar + author + tag pill + body + timestamp.
//
// Data is fetched by the parent page via Supabase and passed in via props,
// so the same component can be reused on /journey/deliverable/[id] (Player
// side, Phase 7 revision panel) without duplicating the query.
import { dictionaries } from "@/lib/i18n";

const t = dictionaries.fr;

export type MentorCommentTag = "remarque" | "a_corriger";

export type MentorCommentEntry = {
  id: string;
  authorName: string;
  /** Two-letter avatar initials. */
  authorInitials: string;
  /** Hex color for the avatar background — distinguishes mentor vs player. */
  authorAvatarColor: string;
  /** When true, render the role suffix "· mentor". */
  isMentor: boolean;
  /** When true, render the role suffix "· vous" (current viewer's comment). */
  isOwn: boolean;
  tag: MentorCommentTag | null;
  body: string;
  createdAt: string;
};

export type MentorCommentsListProps = {
  comments: MentorCommentEntry[];
  /** Optional aria-label override (used by Player-side variant). */
  ariaLabel?: string;
};

const TAG_LABEL: Record<MentorCommentTag, string> = {
  remarque: t.mentor_comment_tag_remark,
  a_corriger: t.mentor_comment_tag_fix,
};

const TAG_CLASS: Record<MentorCommentTag, string> = {
  remarque: "eic-mentor-comment--remark",
  a_corriger: "eic-mentor-comment--fix",
};

const TAG_PILL_CLASS: Record<MentorCommentTag, string> = {
  remarque: "eic-mentor-comment__tag eic-mentor-comment__tag--remark",
  a_corriger: "eic-mentor-comment__tag eic-mentor-comment__tag--fix",
};

function formatTimeFr(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit",
  });
}

export function MentorCommentsList({ comments, ariaLabel }: MentorCommentsListProps) {
  if (comments.length === 0) {
    return (
      <p className="eic-mentor-comments__empty" role="status">
        {t.mentor_comments_empty}
      </p>
    );
  }

  return (
    <ul
      aria-label={ariaLabel ?? t.mentor_comments_section_title}
      className="eic-mentor-comments__list"
    >
      {comments.map((c) => {
        const cardClass = c.tag
          ? `eic-mentor-comment ${TAG_CLASS[c.tag]}`
          : "eic-mentor-comment";
        return (
          <li className={cardClass} key={c.id}>
            <div className="eic-mentor-comment__head">
              <span
                aria-hidden="true"
                className="eic-mentor-comment__avatar"
                style={{ background: c.authorAvatarColor }}
              >
                {c.authorInitials}
              </span>
              <span className="eic-mentor-comment__author">{c.authorName}</span>
              {c.isMentor ? (
                <span className="eic-mentor-comment__role">· mentor</span>
              ) : null}
              {c.isOwn ? (
                <span className="eic-mentor-comment__role">· vous</span>
              ) : null}
              {c.tag ? (
                <span className={TAG_PILL_CLASS[c.tag]}>{TAG_LABEL[c.tag]}</span>
              ) : null}
              <time
                className="eic-mentor-comment__date"
                dateTime={c.createdAt}
                style={{ marginLeft: c.tag ? 8 : "auto" }}
              >
                {formatTimeFr(c.createdAt)}
              </time>
            </div>
            <p className="eic-mentor-comment__body">{c.body}</p>
          </li>
        );
      })}
    </ul>
  );
}
