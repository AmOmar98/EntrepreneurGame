import Image from "next/image";

const PARTNERS = [
  { slug: "tamwilcom", name: "Tamwilcom" },
  { slug: "bank-of-africa", name: "Bank of Africa Academy" },
  { slug: "innov-invest", name: "Innov Invest" },
  { slug: "bluespace", name: "Bluespace" },
  { slug: "eic", name: "EIC" },
  { slug: "uemf", name: "UEMF" },
] as const;

export function PartnerBanner() {
  return (
    <section aria-label="Partenaires" className="partner-banner">
      {PARTNERS.map((p) => (
        <Image
          key={p.slug}
          src={`/brand/partners/${p.slug}.svg`}
          alt={p.name}
          width={160}
          height={40}
          unoptimized
        />
      ))}
    </section>
  );
}
