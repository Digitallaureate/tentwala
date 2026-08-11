"use client";

import { useState } from "react";
import { QuotationChatbot } from "@/components/quotation-chatbot";

export function FloatingQuotationChat() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="fixed bottom-5 right-4 z-50 sm:bottom-6 sm:right-6">
      {isOpen ? (
        <div className="relative mb-4 h-[min(82vh,44rem)] w-[min(94vw,26rem)] overflow-hidden rounded-[2rem] border border-white/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(246,241,234,0.98))] p-2 shadow-[0_30px_90px_rgba(15,23,42,0.22)] ring-1 ring-[#1a315f]/8 backdrop-blur-xl sm:w-[25.5rem]">
          <div className="pointer-events-none absolute inset-x-6 top-0 h-16 rounded-b-[1.5rem] bg-[radial-gradient(circle_at_top,rgba(212,183,128,0.18),rgba(212,183,128,0))]" />
          <div className="pointer-events-none absolute -right-8 top-16 h-24 w-24 rounded-full bg-[radial-gradient(circle,rgba(38,74,132,0.12),rgba(38,74,132,0))]" />
          <QuotationChatbot onClose={() => setIsOpen(false)} variant="widget" />
        </div>
      ) : null}

      <button
        aria-expanded={isOpen}
        aria-label="Open quotation chat"
        className="mt-3 inline-flex min-h-14 items-center gap-3 rounded-full border border-white/15 bg-[linear-gradient(135deg,#173f73,#1f4f8b_60%,#295e99)] px-5 py-3 text-left text-white shadow-[0_18px_44px_rgba(23,63,115,0.34)] ring-1 ring-[#173f73]/10 transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_24px_54px_rgba(23,63,115,0.4)]"
        onClick={() => setIsOpen((current) => !current)}
        type="button"
      >
        {/* <span className="flex h-10 w-10 items-center justify-center rounded-full border border-white/12 bg-white/16 text-lg font-semibold shadow-inner">
          ?
        </span> */}
        <span className="pr-1">
          {/* <span className="block text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-white/68">
            Need help
          </span> */}
          <span className="block text-sm font-semibold tracking-[0.01em] sm:text-base">
            Get quotation in chat
          </span>
        </span>
      </button>
    </div>
  );
}
