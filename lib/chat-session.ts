"use client";

import {
  collection,
  doc,
  increment,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  ChatMessageRecord,
  ChatMessageRole,
  ChatMessageType,
  ChatSessionRecord,
  ChatSessionStatus,
  ChatStep,
  defaultChatSessionValues,
} from "@/lib/chat";

const VISITOR_ID_STORAGE_KEY = "tentwala_visitor_id";
const CHAT_SESSION_STORAGE_KEY = "tentwala_chat_session";
const CHAT_SESSION_TTL_MS = 20 * 60 * 1000;

type StoredChatSession = {
  expiresAt: number;
  sessionId: string;
  visitorId: string;
};

type CreateChatSessionInput = {
  assistantConfigId: string;
  currentStep?: ChatStep;
  knowledgeBaseId: string;
  landingPage?: string;
  sessionId: string;
  visitorId: string;
};

type AppendChatMessageInput = {
  messageId?: string;
  messageType?: ChatMessageType;
  role: ChatMessageRole;
  sessionId: string;
  step: ChatStep;
  text: string;
  visitorId: string;
};

function canUseBrowserStorage() {
  return typeof window !== "undefined" && typeof localStorage !== "undefined";
}

function makeId(prefix: string) {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `${prefix}_${crypto.randomUUID().replaceAll("-", "")}`;
  }

  return `${prefix}_${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
}

function readStoredChatSession(): StoredChatSession | null {
  if (!canUseBrowserStorage()) {
    return null;
  }

  const rawValue = localStorage.getItem(CHAT_SESSION_STORAGE_KEY);

  if (!rawValue) {
    return null;
  }

  try {
    const parsed = JSON.parse(rawValue) as StoredChatSession;

    if (
      typeof parsed.sessionId !== "string" ||
      typeof parsed.visitorId !== "string" ||
      typeof parsed.expiresAt !== "number"
    ) {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

function writeStoredChatSession(value: StoredChatSession) {
  if (!canUseBrowserStorage()) {
    return;
  }

  localStorage.setItem(CHAT_SESSION_STORAGE_KEY, JSON.stringify(value));
}

export function getOrCreateVisitorId() {
  if (!canUseBrowserStorage()) {
    return makeId("visitor");
  }

  const existingVisitorId = localStorage.getItem(VISITOR_ID_STORAGE_KEY)?.trim();

  if (existingVisitorId) {
    return existingVisitorId;
  }

  const visitorId = makeId("visitor");
  localStorage.setItem(VISITOR_ID_STORAGE_KEY, visitorId);
  return visitorId;
}

export function getOrCreateChatSessionIdentity() {
  const visitorId = getOrCreateVisitorId();
  const currentTime = Date.now();
  const storedSession = readStoredChatSession();

  if (
    storedSession &&
    storedSession.visitorId === visitorId &&
    storedSession.expiresAt > currentTime
  ) {
    const refreshedSession = {
      ...storedSession,
      expiresAt: currentTime + CHAT_SESSION_TTL_MS,
    };

    writeStoredChatSession(refreshedSession);

    return {
      expiresAt: refreshedSession.expiresAt,
      isNewSession: false,
      sessionId: refreshedSession.sessionId,
      visitorId,
    };
  }

  const sessionId = makeId("chat");
  const expiresAt = currentTime + CHAT_SESSION_TTL_MS;

  writeStoredChatSession({
    expiresAt,
    sessionId,
    visitorId,
  });

  return {
    expiresAt,
    isNewSession: true,
    sessionId,
    visitorId,
  };
}

export async function createChatSessionRecord({
  assistantConfigId,
  currentStep = "name",
  knowledgeBaseId,
  landingPage = "",
  sessionId,
  visitorId,
}: CreateChatSessionInput) {
  const sessionRef = doc(collection(db, "chat_sessions"), sessionId);

  const payload: Omit<
    ChatSessionRecord,
    "created_at" | "expires_at" | "last_activity_at" | "started_at" | "updated_at"
  > & {
    created_at: ReturnType<typeof serverTimestamp>;
    expires_at: number;
    last_activity_at: ReturnType<typeof serverTimestamp>;
    started_at: ReturnType<typeof serverTimestamp>;
    updated_at: ReturnType<typeof serverTimestamp>;
  } = {
    ...defaultChatSessionValues,
    assistant_config_id: assistantConfigId,
    created_at: serverTimestamp(),
    current_step: currentStep,
    expires_at: Date.now() + CHAT_SESSION_TTL_MS,
    knowledge_base_id: knowledgeBaseId,
    landing_page: landingPage,
    last_activity_at: serverTimestamp(),
    started_at: serverTimestamp(),
    session_id: sessionId,
    updated_at: serverTimestamp(),
    user_agent:
      typeof navigator !== "undefined" ? navigator.userAgent : "",
    visitor_id: visitorId,
  };

  await setDoc(sessionRef, payload, { merge: true });
}

export async function appendChatMessageRecord({
  messageId,
  messageType = "text",
  role,
  sessionId,
  step,
  text,
  visitorId,
}: AppendChatMessageInput) {
  const nextMessageId = messageId ?? makeId("msg");
  const messageRef = doc(collection(db, "chat_sessions", sessionId, "messages"), nextMessageId);

  const payload: Omit<ChatMessageRecord, "created_at"> & {
    created_at: ReturnType<typeof serverTimestamp>;
  } = {
    created_at: serverTimestamp(),
    message_id: nextMessageId,
    message_type: messageType,
    role,
    session_id: sessionId,
    step,
    text,
    visitor_id: visitorId,
  };

  await setDoc(messageRef, payload);

  await touchChatSession(sessionId, {
    lastMessageRole: role,
    lastMessageText: text,
    step,
  });

  return nextMessageId;
}

export async function touchChatSession(
  sessionId: string,
  {
    lastMessageRole,
    lastMessageText,
    step,
  }: {
    lastMessageRole?: ChatMessageRole;
    lastMessageText?: string;
    step?: ChatStep;
  } = {}
) {
  const sessionRef = doc(db, "chat_sessions", sessionId);

  await updateDoc(sessionRef, {
    ...(lastMessageRole ? { last_message_role: lastMessageRole } : {}),
    ...(typeof lastMessageText === "string"
      ? { last_message_text: lastMessageText }
      : {}),
    ...(step ? { current_step: step } : {}),
    expires_at: Date.now() + CHAT_SESSION_TTL_MS,
    last_activity_at: serverTimestamp(),
    message_count: increment(1),
    updated_at: serverTimestamp(),
  });
}

export async function updateChatSessionStatus(
  sessionId: string,
  status: ChatSessionStatus
) {
  const sessionRef = doc(db, "chat_sessions", sessionId);

  await updateDoc(sessionRef, {
    last_activity_at: serverTimestamp(),
    status,
    updated_at: serverTimestamp(),
  });
}

export async function updateChatSessionFields(
  sessionId: string,
  fields: Partial<
    Pick<
      ChatSessionRecord,
      | "collected_location"
      | "collected_name"
      | "collected_phone_number"
      | "current_step"
      | "quotation_budget_tier"
      | "quotation_category_id"
      | "quotation_category_name"
      | "quotation_event_type_id"
      | "quotation_event_type_name"
      | "quotation_flow_status"
      | "quotation_status"
    >
  >
) {
  const sessionRef = doc(db, "chat_sessions", sessionId);

  await updateDoc(sessionRef, {
    ...fields,
    last_activity_at: serverTimestamp(),
    updated_at: serverTimestamp(),
  });
}

export async function linkChatSessionToQuotation(
  sessionId: string,
  {
    quotationRequestId,
    quotationStatus = "pending",
  }: {
    quotationRequestId: string;
    quotationStatus?: ChatSessionRecord["quotation_status"];
  }
) {
  const sessionRef = doc(db, "chat_sessions", sessionId);

  await updateDoc(sessionRef, {
    last_activity_at: serverTimestamp(),
    linked_quotation_request_id: quotationRequestId,
    quotation_flow_status: "submitted",
    quotation_status: quotationStatus,
    status: "completed",
    updated_at: serverTimestamp(),
  });
}

export const chatSessionStorage = {
  chatSessionTtlMs: CHAT_SESSION_TTL_MS,
  chatSessionStorageKey: CHAT_SESSION_STORAGE_KEY,
  visitorIdStorageKey: VISITOR_ID_STORAGE_KEY,
};
