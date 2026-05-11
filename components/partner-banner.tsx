import Image from "next/image";

// Real partner assets copied from UEMF media library on 2026-05-11.
// Slug → file path under /public/brand/partners/. Most are PNG; bluespace
// is JPG (original asset). next/image with unoptimized handles both.
const PARTNERS = [
  { slug: "tamwilcom", name: "Tamwilcom", file: "tamwilcom.png" },
  { slug: "bank-of-africa", name: "Bank of Africa Academy", file: "bank-of-africa.png" },
  { slug: "innov-invest", name: "Innov Invest", file: "innov-invest.png" },
  { slug: "bluespace", name: "Bluespace", file: "bluespace.jpg" },
  { slug: "eic", name: "EIC", file: "eic.png" },
  { slug: "uemf", name: "UEMF", file: "uemf.png" },
] as const;

export function PartnerBanner() {
  return (
    <section aria-label="Partenaires" className="eic-partner-banner">
      {PARTNERS.map((p) => (
        <span className="eic-partner" key={p.slug}>
          <Image
            alt={p.name}
            height={48}
            src={`/brand/partners/${p.file}`}
            unoptimized
            width={160}
            style={{ height: 48, width: "auto", objectFit: "contain" }}
          />
        </span>
      ))}
    </section>
  );
}
