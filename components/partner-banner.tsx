import Image from "next/image";

const PARTNERS = [
  { slug: "tamwilcom", name: "Tamwilcom" },
  { slug: "bank-of-africa", name: "Bank of Africa Academy" },
  { slug: "innov-invest", name: "Innov Invest" },
  { slug: "bluespace", name: "Bluespace" },
  { slug: "eic", name: "EIC" },
  { slug: "uemf", name: "UEMF" },
] as const;

// Set at write time based on `ls public/brand/partners/`. Flip a slug flag to true
// once its SVG exists; default false uses the typographic Montserrat lockup fallback.
// Phase 6 (2026-05-09): all 6 SVGs present in public/brand/partners/, all flagged true.
const PARTNER_SVG_AVAILABLE: Record<(typeof PARTNERS)[number]["slug"], boolean> = {
  "tamwilcom": true,
  "bank-of-africa": true,
  "innov-invest": true,
  "bluespace": true,
  "eic": true,
  "uemf": true,
};

export function PartnerBanner() {
  return (
    <section aria-label="Partenaires" className="eic-partner-banner">
      {PARTNERS.map((p) => {
        const hasSvg = PARTNER_SVG_AVAILABLE[p.slug] === true;
        return (
          <span className="eic-partner" key={p.slug}>
            {hasSvg ? (
              <Image
                alt={p.name}
                height={40}
                src={`/brand/partners/${p.slug}.svg`}
                unoptimized
                width={160}
              />
            ) : (
              <span className="eic-partner__name">{p.name.toUpperCase()}</span>
            )}
          </span>
        );
      })}
    </section>
  );
}
