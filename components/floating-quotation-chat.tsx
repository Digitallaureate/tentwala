"use client";

import { useState } from "react";
import { QuotationChatbot } from "@/components/quotation-chatbot";

export function FloatingQuotationChat() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="fixed bottom-5 right-4 z-50 sm:bottom-6 sm:right-6">
      {isOpen ? (
        <div className="relative mb-4 h-[min(78vh,42rem)] w-[min(94vw,28rem)] overflow-hidden rounded-[2.15rem] border border-white/60 bg-[linear-gradient(180deg,rgba(255,255,255,0.97),rgba(247,243,236,0.95))] p-3 shadow-[0_34px_100px_rgba(15,23,42,0.24)] ring-1 ring-[#173f73]/8 backdrop-blur-xl sm:h-[min(76vh,40rem)] sm:w-[27rem]">
          <div className="pointer-events-none absolute inset-x-8 top-0 h-20 rounded-b-[2rem] bg-[radial-gradient(circle_at_top,rgba(198,168,116,0.18),rgba(198,168,116,0))]" />
          <div className="pointer-events-none absolute -right-10 top-12 h-24 w-24 rounded-full bg-[radial-gradient(circle,rgba(79,174,188,0.14),rgba(79,174,188,0))]" />
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
