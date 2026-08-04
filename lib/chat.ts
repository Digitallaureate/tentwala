"use client";

import type { BudgetTierKey, QuotationRequestStatus } from "@/lib/quotation";

export type ChatSessionStatus =
  | "active"
  | "completed"
  | "expired"
  | "abandoned";

export type ChatQuotationFlowStatus =
  | "draft"
  | "collecting"
  | "ready_to_submit"
  | "submitted";

export type ChatMessageRole = "user" | "assistant" | "system";

export type ChatMessageType = "text" | "option" | "summary" | "error";

export type ChatStep =
  | "name"
  | "phone"
  | "location"
  | "category"
  | "event_type"
  | "budget"
  | "bundles"
  | "notes"
  | "confirm"
  | "complete";

export interface ChatSessionRecord {
  session_id: string;
  visitor_id: string;

  source: "website_chat_widget";
  status: ChatSessionStatus;

  assistant_config_id: string;
  knowledge_base_id: string;

  started_at: unknown;
  last_activity_at: unknown;
  expires_at: unknown;

  landing_page: string;
  user_agent: string;

  collected_name: string;
  collected_phone_number: string;
  collected_location: string;

  quotation_flow_status: ChatQuotationFlowStatus;
  quotation_status?: QuotationRequestStatus;
  quotation_category_id: string;
  quotation_category_name: string;
  quotation_event_type_id: string;
  quotation_event_type_name: string;
  quotation_budget_tier: BudgetTierKey;

  linked_quotation_request_id: string;

  message_count: number;
  last_message_text: string;
  last_message_role: ChatMessageRole;
  current_step: ChatStep;

  created_at: unknown;
  updated_at: unknown;
}

export interface ChatMessageRecord {
  message_id: string;
  session_id: string;
  visitor_id: string;

  role: ChatMessageRole;
  text: string;

  step: ChatStep;
  message_type: ChatMessageType;

  created_at: unknown;
}

export interface VisitorRecord {
  visitor_id: string;
  first_seen_at: unknown;
  last_seen_at: unknown;
  total_sessions: number;
  last_session_id: string;

  known_name: string;
  known_phone_number: string;

  created_at: unknown;
  updated_at: unknown;
}

export const defaultChatSessionValues = {
  source: "website_chat_widget" as const,
  status: "active" as const,
  quotation_flow_status: "draft" as const,
  quotation_budget_tier: "medium" as const,
  collected_name: "",
  collected_phone_number: "",
  collected_location: "",
  quotation_category_id: "",
  quotation_category_name: "",
  quotation_event_type_id: "",
  quotation_event_type_name: "",
  linked_quotation_request_id: "",
  message_count: 0,
  last_message_text: "",
  last_message_role: "assistant" as const,
  current_step: "name" as const,
};

export const defaultVisitorValues = {
  total_sessions: 0,
  last_session_id: "",
  known_name: "",
  known_phone_number: "",
};
