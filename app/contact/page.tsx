import { RequestQuoteForm } from "@/components/request-quote-form";

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
    <main className="min-h-screen bg-[var(--color-bg)] px-5 pb-20 pt-28 text-black sm:px-8 lg:px-[120px] lg:pt-36">
      <RequestQuoteForm
        initialCategoryId={initialCategoryId}
        initialProductId={initialProductId}
      />
    </main>
  );
}
