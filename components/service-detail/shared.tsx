import Link from "next/link";
import { formatPrice } from "@/components/product-card";
import { siteContact } from "@/lib/site-config";

// Pieces shared by the three service detail levels: category, event type and
// single service. Sizes are Figma values (1920px frame, 1680px content) scaled
// with `cqw`, so the parent must be a size container.

export type Crumb = { label: string; href?: string };

export function DetailBreadcrumb({ crumbs }: { crumbs: Crumb[] }) {
  return (
    <nav
      aria-label="Breadcrumb"
      className="text-[clamp(14px,1.786cqw,30px)] leading-[1.13] text-[#717171]"
    >
      <Link className="transition hover:text-black" href="/services">
        Services/
      </Link>
      {crumbs.map((crumb, index) => {
        const isLast = index === crumbs.length - 1;

        return (
          <span key={`${crumb.label}-${index}`}>
            {" "}
            {isLast || !crumb.href ? (
              <span className={isLast ? "font-medium text-black" : ""}>
                {crumb.label}
                {isLast ? "" : "/"}
              </span>
            ) : (
              <>
                <Link className="transition hover:text-black" href={crumb.href}>
                  {crumb.label}
                </Link>
                /
              </>
            )}
          </span>
        );
      })}
    </nav>
  );
}

// Grid placement for the 1, 2 or 3 gallery photos (3 = two stacked + one tall).
const galleryLayouts: Record<number, string[]> = {
  1: ["col-span-2 row-span-2"],
  2: ["row-span-2", "row-span-2"],
  3: ["", "", "row-span-2 row-start-1 col-start-2"],
};

export function DetailGallery({
  images,
  name,
}: {
  images: string[];
  name: string;
}) {
  const shown = images.slice(0, 3);

  if (shown.length === 0) {
    return (
      <div className="aspect-[950/621] w-full rounded-[20px] bg-[linear-gradient(135deg,#efe9dd_0%,#faf7f2_52%,#e9dcc0_100%)]" />
    );
  }

  const layout = galleryLayouts[shown.length];

  return (
    <div className="grid aspect-[950/621] w-full grid-cols-[491fr_450fr] grid-rows-[333fr_279fr] gap-2">
      {shown.map((imageUrl, index) => (
        <div
          key={`${imageUrl}-${index}`}
          className={`overflow-hidden rounded-[20px] bg-[#efe9dd] ${layout[index]}`}
        >
          <img
            alt={`${name} ${index + 1}`}
            className="h-full w-full object-cover"
            src={imageUrl}
          />
        </div>
      ))}
    </div>
  );
}

function PhoneIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-full w-full"
      fill="currentColor"
      viewBox="0 0 24 24"
    >
      <path d="M6.6 10.8a15.1 15.1 0 0 0 6.6 6.6l2.2-2.2a1 1 0 0 1 1-.25 11.4 11.4 0 0 0 3.6.57 1 1 0 0 1 1 1V20a1 1 0 0 1-1 1A17 17 0 0 1 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1c0 1.25.2 2.45.57 3.6a1 1 0 0 1-.25 1l-2.2 2.2Z" />
    </svg>
  );
}

function MailIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-full w-full"
      fill="currentColor"
      viewBox="0 0 24 24"
    >
      <path d="M3 5h18a1 1 0 0 1 1 1v.4l-10 6.25L2 6.4V6a1 1 0 0 1 1-1Zm-1 4.75 9.47 5.92a1 1 0 0 0 1.06 0L22 9.75V18a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V9.75Z" />
    </svg>
  );
}

const sidebarCardClassName =
  "rounded-[20px] border border-[#ecdab9] shadow-[0_6px_24px_rgba(0,0,0,0.06)]";

// The "Starting From / Request a Quote" card and the "Have any question?" card.
export function QuoteSidebar({
  startingPrice,
  note,
  quoteHref,
}: {
  startingPrice?: number;
  note?: string;
  quoteHref: string;
}) {
  return (
    // Sizes below are Figma values (588px column) scaled by column width.
    <aside className="flex flex-col gap-[34px] [container-type:inline-size] lg:w-[35cqw] lg:shrink-0 lg:gap-[2.02cqw]">
      <div
        className={`${sidebarCardClassName} bg-white px-[4.6cqw] pb-[2cqw] pt-[2.2cqw]`}
      >
        <p className="text-[clamp(14px,4.08cqw,24px)] leading-[1.25] text-[#a7a3a0]">
          Starting From
        </p>
        <p className="font-serif text-[clamp(30px,8.84cqw,52px)] font-bold leading-[1.06] text-black">
          {typeof startingPrice === "number"
            ? formatPrice(startingPrice)
            : "On request"}
        </p>
        <Link
          className="mt-[5.5cqw] flex h-[clamp(44px,9.52cqw,56px)] items-center justify-center rounded-[10px] bg-[var(--color-primary)] text-[clamp(16px,4.76cqw,28px)] font-medium text-white transition hover:bg-[#9f4e2f]"
          href={quoteHref}
        >
          Request a Quote →
        </Link>
        <p className="mt-[1.4cqw] text-center text-[clamp(12px,3.06cqw,18px)] leading-[1.9] text-[#717171]">
          {note || "No account needed, Free Consultation"}
        </p>
      </div>

      <div className={`${sidebarCardClassName} bg-[#eee9e1] p-[4.6cqw]`}>
        <p className="text-[clamp(16px,4.4cqw,26px)] font-medium leading-[1.3] text-black">
          Have any question?
        </p>
        <p className="mt-[1cqw] text-[clamp(12px,3.3cqw,19px)] leading-[1.45] text-[#717171]">
          Chat with our TentWala team or request quote and our team will call
          you within 24 hours.
        </p>
        <div className="mt-[3cqw] space-y-[2.4cqw] text-[clamp(13px,3.5cqw,20px)] text-black">
          <a
            className="flex items-center gap-[2.4cqw] transition hover:text-[var(--color-primary)]"
            href={siteContact.phone_href}
          >
            <span className="h-[1.2em] w-[1.2em] shrink-0 text-[var(--color-primary)]">
              <PhoneIcon />
            </span>
            {siteContact.phone_display}
          </a>
          <a
            className="flex items-center gap-[2.4cqw] transition hover:text-[var(--color-primary)]"
            href={siteContact.email_href}
          >
            <span className="h-[1.2em] w-[1.2em] shrink-0 text-[var(--color-primary)]">
              <MailIcon />
            </span>
            {siteContact.email}
          </a>
        </div>
      </div>
    </aside>
  );
}
