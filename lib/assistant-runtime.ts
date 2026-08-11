import { collection, doc, getDoc, getDocs, query, where } from "firebase/firestore";
import type { AssistantConfig } from "@/lib/assistant-config";
import { tentwalaQuotationAssistantConfig } from "@/lib/assistant-config";
import type {
  AssistantKnowledgeBase,
  AssistantKnowledgeChunk,
} from "@/lib/assistant-knowledge";
import {
  tentwalaKnowledgeBase,
  tentwalaKnowledgeChunks,
} from "@/lib/assistant-knowledge";
import { db } from "@/lib/firebase";

type FirestoreDoc = Record<string, unknown>;

function asString(value: unknown, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

function asBoolean(value: unknown, fallback = false) {
  return typeof value === "boolean" ? value : fallback;
}

function asNumber(value: unknown, fallback = 0) {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function asStringArray(value: unknown) {
  return Array.isArray(value) ? value.map((entry) => String(entry)) : [];
}

function normalizeAssistantConfig(
  id: string,
  data: FirestoreDoc
): AssistantConfig {
  const responsePolicy =
    data.responsePolicy && typeof data.responsePolicy === "object"
      ? (data.responsePolicy as Record<string, unknown>)
      : {};

  return {
    id,
    assistantType:
      asString(data.assistantType, "quotation_bot") as AssistantConfig["assistantType"],
    knowledgeBaseIds: asStringArray(data.knowledgeBaseIds),
    active: asBoolean(data.active, true),
    version: asNumber(data.version, 1),
    status: asString(data.status, "published") as AssistantConfig["status"],
    model: asString(data.model, tentwalaQuotationAssistantConfig.model),
    maxTokens: asNumber(data.maxTokens, tentwalaQuotationAssistantConfig.maxTokens),
    temperature: asNumber(
      data.temperature,
      tentwalaQuotationAssistantConfig.temperature
    ),
    top_p: asNumber(data.top_p, tentwalaQuotationAssistantConfig.top_p),
    systemPrompt: asString(
      data.systemPrompt,
      tentwalaQuotationAssistantConfig.systemPrompt
    ),
    finalInstructions:
      asStringArray(data.finalInstructions).length > 0
        ? asStringArray(data.finalInstructions)
        : tentwalaQuotationAssistantConfig.finalInstructions,
    languageMode:
      asString(
        data.languageMode,
        tentwalaQuotationAssistantConfig.languageMode
      ) as AssistantConfig["languageMode"],
    supportedLanguages:
      (asStringArray(data.supportedLanguages).length > 0
        ? asStringArray(data.supportedLanguages)
        : tentwalaQuotationAssistantConfig.supportedLanguages) as AssistantConfig["supportedLanguages"],
    responsePolicy: {
      allowCustomRequests: asBoolean(
        responsePolicy.allowCustomRequests,
        tentwalaQuotationAssistantConfig.responsePolicy.allowCustomRequests
      ),
      allowHumanHandoff: asBoolean(
        responsePolicy.allowHumanHandoff,
        tentwalaQuotationAssistantConfig.responsePolicy.allowHumanHandoff
      ),
      allowStandaloneServiceFlow: asBoolean(
        responsePolicy.allowStandaloneServiceFlow,
        tentwalaQuotationAssistantConfig.responsePolicy.allowStandaloneServiceFlow
      ),
      askOneQuestionAtATime: asBoolean(
        responsePolicy.askOneQuestionAtATime,
        tentwalaQuotationAssistantConfig.responsePolicy.askOneQuestionAtATime
      ),
      requireConfirmationBeforeSubmit: asBoolean(
        responsePolicy.requireConfirmationBeforeSubmit,
        tentwalaQuotationAssistantConfig.responsePolicy.requireConfirmationBeforeSubmit
      ),
    },
  };
}

function normalizeKnowledgeBase(
  id: string,
  data: FirestoreDoc
): AssistantKnowledgeBase {
  return {
    id,
    name: asString(data.name, tentwalaKnowledgeBase.name),
    slug: asString(data.slug, tentwalaKnowledgeBase.slug),
    assistantType:
      asString(data.assistantType, "quotation_bot") as AssistantKnowledgeBase["assistantType"],
    description: asString(data.description, tentwalaKnowledgeBase.description),
    language: asString(data.language, "en") as AssistantKnowledgeBase["language"],
    version: asNumber(data.version, 1),
    tags: asStringArray(data.tags),
    status: asString(data.status, "published") as AssistantKnowledgeBase["status"],
    active: asBoolean(data.active, true),
  };
}

function normalizeKnowledgeChunk(
  id: string,
  data: FirestoreDoc
): AssistantKnowledgeChunk {
  return {
    id,
    knowledgeBaseId: asString(
      data.knowledgeBaseId,
      tentwalaKnowledgeBase.id
    ),
    type: asString(data.type, "faq") as AssistantKnowledgeChunk["type"],
    audience: asString(data.audience, "customer") as AssistantKnowledgeChunk["audience"],
    title: asString(data.title),
    summary: asString(data.summary),
    content: asString(data.content),
    relatedCategoryIds: asStringArray(data.relatedCategoryIds),
    relatedProductIds: asStringArray(data.relatedProductIds),
    tags: asStringArray(data.tags),
    priority: asNumber(data.priority, 0),
    language: asString(data.language, "en") as AssistantKnowledgeChunk["language"],
    requiresHumanConfirmation: asBoolean(data.requiresHumanConfirmation, false),
    version: asNumber(data.version, 1),
    status: asString(data.status, "published") as AssistantKnowledgeChunk["status"],
    active: asBoolean(data.active, true),
  };
}

export async function loadAssistantRuntimeContext(
  assistantConfigId = tentwalaQuotationAssistantConfig.id
) {
  try {
    const configSnapshot = await getDoc(doc(db, "assistant_configs", assistantConfigId));

    if (!configSnapshot.exists()) {
      return {
        assistantConfig: tentwalaQuotationAssistantConfig,
        knowledgeBases: [tentwalaKnowledgeBase],
        knowledgeChunks: tentwalaKnowledgeChunks,
      };
    }

    const assistantConfig = normalizeAssistantConfig(
      configSnapshot.id,
      configSnapshot.data() as FirestoreDoc
    );

    const knowledgeBaseIds =
      assistantConfig.knowledgeBaseIds.length > 0
        ? assistantConfig.knowledgeBaseIds
        : [tentwalaKnowledgeBase.id];

    const knowledgeBaseSnapshots = await Promise.all(
      knowledgeBaseIds.map((knowledgeBaseId) =>
        getDoc(doc(db, "assistant_knowledge_bases", knowledgeBaseId))
      )
    );

    const knowledgeBases = knowledgeBaseSnapshots
      .filter((snapshot) => snapshot.exists())
      .map((snapshot) =>
        normalizeKnowledgeBase(snapshot.id, snapshot.data() as FirestoreDoc)
      )
      .filter((knowledgeBase) => knowledgeBase.active && knowledgeBase.status === "published");

    const activeKnowledgeBaseIds =
      knowledgeBases.length > 0
        ? knowledgeBases.map((knowledgeBase) => knowledgeBase.id)
        : [tentwalaKnowledgeBase.id];

    const chunkSnapshots = await Promise.all(
      activeKnowledgeBaseIds.map((knowledgeBaseId) =>
        getDocs(
          query(
            collection(db, "assistant_knowledge_chunks"),
            where("knowledgeBaseId", "==", knowledgeBaseId)
          )
        )
      )
    );

    const knowledgeChunks = chunkSnapshots
      .flatMap((snapshot) => snapshot.docs)
      .map((entry) => normalizeKnowledgeChunk(entry.id, entry.data() as FirestoreDoc))
      .filter((chunk) => chunk.active && chunk.status === "published");

    return {
      assistantConfig,
      knowledgeBases: knowledgeBases.length > 0 ? knowledgeBases : [tentwalaKnowledgeBase],
      knowledgeChunks: knowledgeChunks.length > 0 ? knowledgeChunks : tentwalaKnowledgeChunks,
    };
  } catch (error) {
    console.error("Failed to load live assistant runtime context from Firestore.", error);

    return {
      assistantConfig: tentwalaQuotationAssistantConfig,
      knowledgeBases: [tentwalaKnowledgeBase],
      knowledgeChunks: tentwalaKnowledgeChunks,
    };
  }
}
