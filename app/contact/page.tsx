import { ContactQuotationForm } from "@/components/contact-quotation-form";
import { SiteHeader } from "@/components/site-header";

export default async function ContactPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const initialCategoryId = Array.isArray(params.category)
    ? params.category[0] ?? ""
    : params.category ?? "";
  const initialProductId = Array.isArray(params.product)
    ? params.product[0] ?? ""
    : params.product ?? "";

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(223,242,245,0.95)_0%,_rgba(223,242,245,0.82)_18%,_rgba(248,251,248,0.96)_42%,_rgba(255,250,245,0.98)_68%,_rgba(245,236,226,0.92)_100%)] px-4 pb-6 pt-36 text-zinc-950 sm:px-6 sm:pb-6 sm:pt-40 lg:px-8 lg:pt-44">
      <div className="mx-auto flex w-full max-w-none flex-col gap-6">
        <SiteHeader active="book-now" />
        <ContactQuotationForm
          initialCategoryId={initialCategoryId}
          initialProductId={initialProductId}
        />
      </div>
    </main>
  );
}
