"use client";

import { useState } from "react";
import { QuotationChatbot } from "@/components/quotation-chatbot";

export function FloatingQuotationChat() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div
      className={`fixed bottom-5 right-4 flex flex-col items-end sm:bottom-6 sm:right-6 ${
        isOpen ? "z-[100]" : "z-50"
      }`}
    >
      {isOpen ? (
        <div className="fixed inset-x-3 bottom-3 top-3 overflow-hidden rounded-[20px] border border-white bg-[var(--background)] shadow-[0_30px_90px_rgba(0,0,0,0.24)] sm:relative sm:inset-auto sm:mb-3 sm:h-[min(82vh,38rem)] sm:w-[min(94vw,29.5rem)]">
          <QuotationChatbot onClose={() => setIsOpen(false)} variant="widget" />
        </div>
      ) : null}

      <button
        aria-expanded={isOpen}
        aria-label="Open quotation chat"
        className={`floating-action-button items-center ${
          isOpen ? "hidden sm:inline-flex" : "inline-flex"
        } justify-center justify-center text-sm font-semibold transition hover:-translate-y-0.5 hover:brightness-105`}
        onClick={() => setIsOpen((current) => !current)}
        type="button"
      >
        <span className="block text-sm font-semibold tracking-[0.01em] sm:text-base">
          Talk to TentWala
        </span>
      </button>
    </div>
  );
}
