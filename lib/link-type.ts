// Phase 8 / Plan 08 - Link type detection helper (MNT-01).
// Detects the kind of external link a Player submitted (Google Docs, GitHub,
// Notion, Figma, video, generic) by hostname, returning a small descriptor
// used by mentor-link-card.tsx to render the right icon + label + accent.
//
// Pure module: no DOM, no React. Safe to import from server components.

export type LinkType =
  | "google-docs"
  | "google-drive"
  | "github"
  | "notion"
  | "figma"
  | "video"
  | "pdf"
  | "other";

export type LinkTypeDescriptor = {
  type: LinkType;
  label: string;
  icon: string; // emoji glyph - kept ASCII-safe in favor of <span aria-hidden>
  color: string; // brand accent hex used for the card border / kicker
  hostname: string; // best-effort extracted hostname (or empty when invalid)
};

const FALLBACK: Omit<LinkTypeDescriptor, "hostname"> = {
  type: "other",
  label: "Lien externe",
  icon: "🔗",
  color: "#1B3A5C",
};

/**
 * Detect a submitted link's type from its URL.
 * Defensive: returns the "other" descriptor on invalid URL strings.
 */
export function detectLinkType(url: string): LinkTypeDescriptor {
  let hostname = "";
  try {
    hostname = new URL(url).hostname.toLowerCase();
  } catch {
    return { ...FALLBACK, hostname: "" };
  }

  if (
    hostname.endsWith("docs.google.com") ||
    hostname.endsWith("sheets.google.com") ||
    hostname.endsWith("slides.google.com")
  ) {
    return {
      type: "google-docs",
      label: "Google Docs",
      icon: "📄",
      color: "#1A73E8",
      hostname,
    };
  }
  if (hostname.endsWith("drive.google.com")) {
    return {
      type: "google-drive",
      label: "Google Drive",
      icon: "📂",
      color: "#1A73E8",
      hostname,
    };
  }
  if (hostname === "github.com" || hostname.endsWith(".github.com")) {
    return {
      type: "github",
      label: "GitHub",
      icon: "🐙",
      color: "#24292F",
      hostname,
    };
  }
  if (hostname === "notion.so" || hostname.endsWith(".notion.so") || hostname.endsWith("notion.site")) {
    return {
      type: "notion",
      label: "Notion",
      icon: "◼",
      color: "#0F0F0F",
      hostname,
    };
  }
  if (hostname === "figma.com" || hostname.endsWith(".figma.com")) {
    return {
      type: "figma",
      label: "Figma",
      icon: "🎨",
      color: "#A259FF",
      hostname,
    };
  }
  if (
    hostname.endsWith("youtube.com") ||
    hostname === "youtu.be" ||
    hostname.endsWith("vimeo.com") ||
    hostname.endsWith("loom.com")
  ) {
    return {
      type: "video",
      label: "Vidéo",
      icon: "🎥",
      color: "#D93025",
      hostname,
    };
  }
  if (url.toLowerCase().endsWith(".pdf")) {
    return {
      type: "pdf",
      label: "PDF",
      icon: "📕",
      color: "#A23B3B",
      hostname,
    };
  }

  return { ...FALLBACK, hostname };
}
