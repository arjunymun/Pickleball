import Link from "next/link";

export function AcademyBrand({ href = "/" }: { href?: string }) {
  return (
    <Link href={href} className="academy-brand" aria-label="Doon Pickleball Academy home">
      <svg className="academy-brand__ball" viewBox="0 0 48 48" fill="none" aria-hidden="true">
        <circle cx="24" cy="24" r="22" fill="#ebda18" stroke="#10213e" strokeWidth="2.5" />
        <g fill="#10213e"><circle cx="24" cy="11" r="2.7" /><circle cx="13" cy="18" r="2.7" /><circle cx="34" cy="18" r="2.7" /><circle cx="24" cy="25" r="2.7" /><circle cx="13" cy="31" r="2.7" /><circle cx="34" cy="31" r="2.7" /><circle cx="24" cy="38" r="2.7" /></g>
      </svg>
      <span className="academy-brand__words"><span className="academy-brand__name">Doon</span><span className="academy-brand__sub">Pickleball Academy</span></span>
    </Link>
  );
}
