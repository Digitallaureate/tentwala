// import { NextResponse } from "next/server";
// import { tentwalaQuotationAssistantConfig } from "@/lib/assistant-config";
// import { loadAssistantRuntimeContext } from "@/lib/assistant-runtime";
// type ChatAssistantRequest = {
//   recentMessages?: Array<{
//     role: "assistant" | "user";
//     text: string;
//   }>;
//   userMessage?: string;
// };

// type OpenAiInputItem = {
//   role: "assistant" | "developer" | "user";
//   content: Array<{
//     type: "input_text";
//     text: string;
//   }>;
// };

// function extractOutputText(responseData: Record<string, unknown>) {
//   if (typeof responseData.output_text === "string" && responseData.output_text.trim()) {
//     return responseData.output_text.trim();
//   }

//   const output = Array.isArray(responseData.output) ? responseData.output : [];

//   for (const item of output) {
//     if (!item || typeof item !== "object") {
//       continue;
//     }

//     const content = Array.isArray((item as { content?: unknown }).content)
//       ? ((item as { content: Array<unknown> }).content)
//       : [];

//     for (const part of content) {
//       if (!part || typeof part !== "object") {
//         continue;
//       }

//       if (
//         (part as { type?: string }).type === "output_text" &&
//         typeof (part as { text?: unknown }).text === "string"
//       ) {
//         return ((part as { text: string }).text).trim();
//       }
//     }
//   }

//   return "";
// }

// function isTranscriptLikeAssistantReply(
//   text: string
// ) {
//   return /^(user|assistant|system|developer)\s*:/i.test(
//     text.trim()
//   );
// }

// function buildOpenAiInput(
//   developerInstructions: string,
//   recentMessages: ChatAssistantRequest["recentMessages"],
//   userMessage: string
// ): OpenAiInputItem[] {
//   const input: OpenAiInputItem[] = [
//     {
//       role: "developer",
//       content: [
//         {
//           type: "input_text",
//           text: developerInstructions,
//         },
//       ],
//     },
//   ];

//   for (const message of recentMessages ?? []) {
//     if (
//       message.role !== "user" &&
//       message.role !== "assistant"
//     ) {
//       continue;
//     }

//     const text =
//       typeof message.text === "string"
//         ? message.text.trim()
//         : "";

//     if (!text) {
//       continue;
//     }

//     if (
//       message.role === "assistant" &&
//       isTranscriptLikeAssistantReply(text)
//     ) {
//       console.warn(
//         "Skipping malformed assistant history message:",
//         text
//       );

//       continue;
//     }

//     input.push({
//       role: message.role,
//       content: [
//         {
//           type: "input_text",
//           text,
//         },
//       ],
//     });
//   }

//   input.push({
//     role: "user",
//     content: [
//       {
//         type: "input_text",
//         text: userMessage,
//       },
//     ],
//   });

//   return input;
// }

// export async function POST(request: Request) {
//   const openAiApiKey = process.env.OPENAI_API_KEY?.trim() ?? "";

//   if (!openAiApiKey) {
//     return NextResponse.json(
//       {
//         error:
//           "OPENAI_API_KEY is not configured on the server yet.",
//       },
//       { status: 500 }
//     );
//   }

//   const body = (await request.json()) as ChatAssistantRequest;
//   console.log("Incoming chat-assistant request body:", JSON.stringify(body, null, 2));

//   const { assistantConfig } = await loadAssistantRuntimeContext();
//   const recentMessages = (body.recentMessages ?? []).slice(-6);
//   const userMessage = body.userMessage?.trim() ?? "";

//   const knowledgeContext =
//     getRelevantKnowledgeContext(
//       userMessage,
//       recentMessages,
//       knowledgeChunks ?? []
//     );

//   const developerInstructions = [
//     assistantConfig.systemPrompt,
//     ...assistantConfig.finalInstructions,
//   ]
//     .filter(Boolean)
//     .join("\n\n");

//   const openAiInput = buildOpenAiInput(
//     developerInstructions,
//     recentMessages,
//     userMessage
//   );

//   console.log("OpenAI developerInstructions:\n", developerInstructions);
//   console.log("OpenAI conversation input:", JSON.stringify(openAiInput, null, 2));

//   const response = await fetch("https://api.openai.com/v1/responses", {
//     method: "POST",
//     headers: {
//       "Authorization": `Bearer ${openAiApiKey}`,
//       "Content-Type": "application/json",
//     },
//     body: JSON.stringify({
//       input: openAiInput,
//       max_output_tokens:
//         Number(process.env.OPENAI_CHAT_MAX_OUTPUT_TOKENS ?? "160") || 160,
//       model:
//         process.env.OPENAI_CHAT_MODEL?.trim() ||
//         assistantConfig.model ||
//         tentwalaQuotationAssistantConfig.model,
//       temperature: assistantConfig.temperature,
//       top_p: assistantConfig.top_p,
//     }),
//   });

//   if (!response.ok) {
//     const errorText = await response.text();
//     console.error("OpenAI request failed with status", response.status, errorText);

//     return NextResponse.json(
//       {
//         error: "OpenAI request failed.",
//         details: errorText,
//       },
//       { status: 500 }
//     );
//   }

//   const responseData = (await response.json()) as Record<string, unknown>;
//   console.log(
//     "OpenAI raw response:",
//     JSON.stringify(responseData, null, 2)
//   );
//   const reply =
//     extractOutputText(responseData).trim();

//   console.log("OpenAI output_text:", reply);

//   if (!reply) {
//     console.error("OpenAI returned an empty reply.");

//     return NextResponse.json(
//       {
//         error: "OpenAI returned an empty reply.",
//       },
//       { status: 502 }
//     );
//   }

//   if (isTranscriptLikeAssistantReply(reply)) {
//     console.error("OpenAI returned a malformed transcript-style reply:", reply);

//     return NextResponse.json(
//       {
//         error: "OpenAI returned a malformed assistant reply.",
//         details: reply,
//       },
//       { status: 502 }
//     );
//   }

//   const normalizedResponse = {
//     reply,
//   };
//   console.log(
//     "Normalized assistant response:",
//     JSON.stringify(normalizedResponse, null, 2)
//   );

//   return NextResponse.json(normalizedResponse);
// }


import { NextResponse } from "next/server";

import { tentwalaQuotationAssistantConfig } from "@/lib/assistant-config";
import type { AssistantKnowledgeChunk } from "@/lib/assistant-knowledge";
import { loadAssistantRuntimeContext } from "@/lib/assistant-runtime";

type ChatRole = "assistant" | "user";

type ChatMessage = {
  role: ChatRole;
  text: string;
};

type ChatAssistantRequest = {
  /**
   * Previous conversation messages only.
   * Do not include the latest user message here.
   */
  recentMessages?: ChatMessage[];

  /**
   * Latest message entered by the user.
   */
  userMessage?: string;
};

type OpenAiInputItem = {
  role: "assistant" | "developer" | "user";
  content: string;
};

const MAX_HISTORY_MESSAGES = 20;
const MAX_MESSAGE_LENGTH = 6000;
const MAX_KNOWLEDGE_CHUNKS = 4;

const KNOWLEDGE_STOP_WORDS = new Set([
  "the",
  "and",
  "for",
  "that",
  "this",
  "with",
  "what",
  "when",
  "where",
  "which",
  "who",
  "why",
  "how",
  "are",
  "was",
  "were",
  "will",
  "would",
  "could",
  "should",
  "have",
  "has",
  "had",
  "from",
  "into",
  "about",
  "your",
  "you",
  "our",
  "they",
  "their",
  "there",
  "here",
  "please",
  "tell",
  "want",
  "need",
  "hello",
  "hii",
  "hey",
  "thanks",
  "thank",
  "okay",
  "ok",
]);

function extractOutputText(
  responseData: Record<string, unknown>
): string {
  /**
   * Some SDK responses expose output_text directly.
   */
  if (
    typeof responseData.output_text === "string" &&
    responseData.output_text.trim()
  ) {
    return responseData.output_text.trim();
  }

  /**
   * Raw fetch responses normally contain an output array.
   */
  const output = Array.isArray(responseData.output)
    ? responseData.output
    : [];

  for (const item of output) {
    if (!item || typeof item !== "object") {
      continue;
    }

    const rawContent = (
      item as {
        content?: unknown;
      }
    ).content;

    const content = Array.isArray(rawContent)
      ? rawContent
      : [];

    for (const part of content) {
      if (!part || typeof part !== "object") {
        continue;
      }

      const typedPart = part as {
        type?: unknown;
        text?: unknown;
      };

      if (
        typedPart.type === "output_text" &&
        typeof typedPart.text === "string" &&
        typedPart.text.trim()
      ) {
        return typedPart.text.trim();
      }
    }
  }

  return "";
}

function isTranscriptLikeAssistantReply(
  text: string
): boolean {
  return /^(user|assistant|system|developer)\s*:/i.test(
    text.trim()
  );
}

/**
 * Validate conversation messages at runtime.
 *
 * TypeScript types do not validate incoming HTTP request bodies,
 * so we still need to verify the role and text here.
 */
function sanitizeRecentMessages(
  messages: unknown
): ChatMessage[] {
  if (!Array.isArray(messages)) {
    return [];
  }

  const sanitizedMessages: ChatMessage[] = [];

  for (const message of messages) {
    if (!message || typeof message !== "object") {
      continue;
    }

    const role = (
      message as {
        role?: unknown;
      }
    ).role;

    const text = (
      message as {
        text?: unknown;
      }
    ).text;

    if (role !== "user" && role !== "assistant") {
      continue;
    }

    if (typeof text !== "string") {
      continue;
    }

    const cleanedText = text
      .trim()
      .slice(0, MAX_MESSAGE_LENGTH);

    if (!cleanedText) {
      continue;
    }

    /**
     * Temporary protection against incorrectly saved messages such as:
     *
     * assistant: "user: I want a birthday party"
     */
    if (
      role === "assistant" &&
      isTranscriptLikeAssistantReply(cleanedText)
    ) {
      console.warn(
        "Skipping malformed assistant history message:",
        cleanedText
      );

      continue;
    }

    sanitizedMessages.push({
      role,
      text: cleanedText,
    });
  }

  return sanitizedMessages.slice(
    -MAX_HISTORY_MESSAGES
  );
}

/**
 * Prevent the latest user message from being sent twice.
 *
 * Ideally the frontend should not include the current message
 * inside recentMessages, but this protects the backend.
 */
function removeDuplicateCurrentMessage(
  recentMessages: ChatMessage[],
  userMessage: string
): ChatMessage[] {
  const lastMessage =
    recentMessages[recentMessages.length - 1];

  if (
    lastMessage?.role === "user" &&
    lastMessage.text.trim().toLowerCase() ===
    userMessage.trim().toLowerCase()
  ) {
    return recentMessages.slice(0, -1);
  }

  return recentMessages;
}

function getSearchTerms(text: string): string[] {
  const terms = text
    .toLowerCase()
    .split(/[\s,.:;!?()[\]{}"'/_\-]+/)
    .map((term) => term.trim())
    .filter((term) => {
      return (
        term.length > 2 &&
        !KNOWLEDGE_STOP_WORDS.has(term)
      );
    });

  return Array.from(new Set(terms));
}

/**
 * Basic relevance matching for knowledge chunks.
 *
 * Later, this can be replaced with embeddings or vector search.
 */
function getRelevantKnowledgeContext(
  userMessage: string,
  recentMessages: ChatMessage[],
  knowledgeChunks: AssistantKnowledgeChunk[]
): string {
  /**
   * Recent messages help understand follow-ups such as:
   *
   * User: "Is fuel included?"
   *
   * The previous conversation may indicate they are discussing
   * a generator.
   */
  const conversationText = [
    ...recentMessages
      .slice(-8)
      .map((message) => message.text),
    userMessage,
  ]
    .join(" ")
    .toLowerCase();

  const searchTerms =
    getSearchTerms(conversationText);

  if (searchTerms.length === 0) {
    return "";
  }

  const rankedChunks = knowledgeChunks
    .filter((chunk) => {
      return (
        chunk.active === true &&
        chunk.status === "published"
      );
    })
    .map((chunk) => {
      const tags = Array.isArray(chunk.tags)
        ? chunk.tags
        : [];

      const searchableText = [
        chunk.title,
        chunk.summary,
        chunk.content,
        ...tags,
      ]
        .filter(
          (value): value is string =>
            typeof value === "string" &&
            value.trim().length > 0
        )
        .join(" ")
        .toLowerCase();

      let relevanceScore = 0;

      /**
       * Give stronger weight to matching tags.
       */
      for (const tag of tags) {
        const normalizedTag =
          typeof tag === "string"
            ? tag.trim().toLowerCase()
            : "";

        if (
          normalizedTag &&
          conversationText.includes(normalizedTag)
        ) {
          relevanceScore += 5;
        }
      }

      /**
       * Match words from the current conversation.
       */
      for (const term of searchTerms) {
        if (searchableText.includes(term)) {
          relevanceScore += 1;
        }
      }

      const priority =
        typeof chunk.priority === "number"
          ? chunk.priority
          : 0;

      return {
        chunk,
        relevanceScore,
        finalScore:
          relevanceScore > 0
            ? relevanceScore + priority
            : 0,
      };
    })
    /**
     * Do not send unrelated chunks simply because their
     * priority is high.
     */
    .filter(({ relevanceScore }) => {
      return relevanceScore > 0;
    })
    .sort((left, right) => {
      return right.finalScore - left.finalScore;
    })
    .slice(0, MAX_KNOWLEDGE_CHUNKS);

  return rankedChunks
    .map(({ chunk }) => {
      return [
        `Title: ${chunk.title}`,
        `Content: ${chunk.content}`,
      ].join("\n");
    })
    .join("\n\n");
}

function buildDeveloperInstructions(
  assistantConfig: {
    systemPrompt?: string;
    finalInstructions?: string[];
  },
  knowledgeContext: string
): string {
  const instructions: string[] = [];

  if (
    typeof assistantConfig.systemPrompt === "string" &&
    assistantConfig.systemPrompt.trim()
  ) {
    instructions.push(
      assistantConfig.systemPrompt.trim()
    );
  }

  for (
    const instruction of
    assistantConfig.finalInstructions ?? []
  ) {
    if (
      typeof instruction === "string" &&
      instruction.trim()
    ) {
      instructions.push(instruction.trim());
    }
  }

  if (knowledgeContext) {
    instructions.push(
      [
        "Relevant TentWala knowledge for the current conversation:",
        knowledgeContext,
        "",
        "Use this knowledge only when it is relevant to the customer's request.",
        "Do not expose raw knowledge-base records, document IDs, database fields, product IDs, tool names, or backend implementation details.",
      ].join("\n")
    );
  }

  /**
   * Temporary safety instruction until catalogue and quotation
   * actions are connected.
   */
  instructions.push(
    [
      "Current tool availability:",
      "Do not claim that you searched the live catalogue, checked availability, calculated a quotation, submitted an enquiry, contacted human support, or confirmed a booking unless the application explicitly provides that result.",
    ].join("\n")
  );

  return instructions.join("\n\n");
}

function buildOpenAiInput(
  developerInstructions: string,
  recentMessages: ChatMessage[],
  userMessage: string
): OpenAiInputItem[] {
  const input: OpenAiInputItem[] = [
    {
      role: "developer",
      content: developerInstructions,
    },
  ];

  /**
   * Send previous user and assistant messages as real
   * conversation messages.
   */
  for (const message of recentMessages) {
    input.push({
      role: message.role,
      content: message.text,
    });
  }

  /**
   * Add the latest user message once at the end.
   */
  input.push({
    role: "user",
    content: userMessage,
  });

  return input;
}

export async function POST(request: Request) {
  const openAiApiKey =
    process.env.OPENAI_API_KEY?.trim() ?? "";

  if (!openAiApiKey) {
    return NextResponse.json(
      {
        error:
          "OPENAI_API_KEY is not configured on the server.",
      },
      {
        status: 500,
      }
    );
  }

  let body: ChatAssistantRequest;

  try {
    body =
      (await request.json()) as ChatAssistantRequest;
  } catch {
    return NextResponse.json(
      {
        error: "Invalid JSON request body.",
      },
      {
        status: 400,
      }
    );
  }

  const userMessage =
    typeof body.userMessage === "string"
      ? body.userMessage
        .trim()
        .slice(0, MAX_MESSAGE_LENGTH)
      : "";

  if (!userMessage) {
    return NextResponse.json(
      {
        error: "userMessage is required.",
      },
      {
        status: 400,
      }
    );
  }

  let recentMessages =
    sanitizeRecentMessages(body.recentMessages);

  recentMessages = removeDuplicateCurrentMessage(
    recentMessages,
    userMessage
  );

  try {
    const {
      assistantConfig,
      knowledgeChunks,
    } = await loadAssistantRuntimeContext();

    if (!assistantConfig) {
      return NextResponse.json(
        {
          error:
            "No active assistant configuration was found.",
        },
        {
          status: 503,
        }
      );
    }

    const knowledgeContext =
      getRelevantKnowledgeContext(
        userMessage,
        recentMessages,
        knowledgeChunks ?? []
      );

    const developerInstructions =
      buildDeveloperInstructions(
        assistantConfig,
        knowledgeContext
      );

    const openAiInput = buildOpenAiInput(
      developerInstructions,
      recentMessages,
      userMessage
    );

    const selectedModel =
      process.env.OPENAI_CHAT_MODEL?.trim() ||
      assistantConfig.model ||
      tentwalaQuotationAssistantConfig.model;

    console.log("TentWala assistant request:", {
      model: selectedModel,
      historyMessageCount:
        recentMessages.length,
      knowledgeIncluded:
        Boolean(knowledgeContext),
      userMessageLength:
        userMessage.length,
    });

    /**
     * Full messages may contain names, phone numbers and locations.
     * Log them only during development.
     */
    if (
      process.env.NODE_ENV === "development"
    ) {
      console.log(
        "OpenAI developer instructions:\n",
        developerInstructions
      );

      console.log(
        "OpenAI conversation input:",
        JSON.stringify(openAiInput, null, 2)
      );
    }

    const controller = new AbortController();

    const timeoutId = setTimeout(() => {
      controller.abort();
    }, 30_000);

    let response: Response;

    try {
      response = await fetch(
        "https://api.openai.com/v1/responses",
        {
          method: "POST",

          headers: {
            Authorization:
              `Bearer ${openAiApiKey}`,
            "Content-Type": "application/json",
          },

          signal: controller.signal,

          body: JSON.stringify({
            model: selectedModel,

            input: openAiInput,

            max_output_tokens:
              Number(
                process.env
                  .OPENAI_CHAT_MAX_OUTPUT_TOKENS ??
                assistantConfig.maxTokens ??
                tentwalaQuotationAssistantConfig
                  .maxTokens ??
                400
              ) || 400,

            temperature:
              assistantConfig.temperature ??
              tentwalaQuotationAssistantConfig
                .temperature,

            top_p:
              assistantConfig.top_p ??
              tentwalaQuotationAssistantConfig
                .top_p,

            /**
             * Conversation history is managed by this application.
             */
            store: false,
          }),
        }
      );
    } finally {
      clearTimeout(timeoutId);
    }

    /**
     * Read as text first so OpenAI error responses can also
     * be inspected.
     */
    const rawResponse = await response.text();

    if (!response.ok) {
      console.error("OpenAI request failed:", {
        status: response.status,
        statusText: response.statusText,
        error: rawResponse,
      });

      return NextResponse.json(
        {
          error:
            "The assistant service is currently unavailable.",

          details:
            process.env.NODE_ENV ===
              "development"
              ? rawResponse
              : undefined,
        },
        {
          status:
            response.status === 429
              ? 429
              : 502,
        }
      );
    }

    let responseData: Record<
      string,
      unknown
    >;

    try {
      responseData = JSON.parse(
        rawResponse
      ) as Record<string, unknown>;
    } catch {
      console.error(
        "OpenAI returned invalid JSON:",
        rawResponse
      );

      return NextResponse.json(
        {
          error:
            "OpenAI returned an invalid response.",
        },
        {
          status: 502,
        }
      );
    }

    /**
     * An HTTP 200 response can still contain an incomplete
     * or failed generation status.
     */
    if (
      typeof responseData.status === "string" &&
      responseData.status !== "completed"
    ) {
      console.error(
        "OpenAI response was not completed:",
        {
          status: responseData.status,
          error: responseData.error,
          incompleteDetails:
            responseData.incomplete_details,
        }
      );

      return NextResponse.json(
        {
          error:
            "The assistant could not complete its response.",
        },
        {
          status: 502,
        }
      );
    }

    const reply =
      extractOutputText(responseData).trim();

    console.log("OpenAI output text:", reply);

    if (!reply) {
      console.error(
        "OpenAI returned an empty reply:",
        JSON.stringify(responseData, null, 2)
      );

      return NextResponse.json(
        {
          error:
            "OpenAI returned an empty reply.",
        },
        {
          status: 502,
        }
      );
    }

    if (
      isTranscriptLikeAssistantReply(reply)
    ) {
      console.error(
        "OpenAI returned a transcript-style reply:",
        reply
      );

      return NextResponse.json(
        {
          error:
            "OpenAI returned a malformed assistant reply.",

          details:
            process.env.NODE_ENV ===
              "development"
              ? reply
              : undefined,
        },
        {
          status: 502,
        }
      );
    }

    return NextResponse.json({
      reply,
    });
  } catch (error) {
    const isAbortError =
      error instanceof Error &&
      error.name === "AbortError";

    console.error(
      "TentWala assistant API error:",
      error
    );

    return NextResponse.json(
      {
        error: isAbortError
          ? "The assistant request timed out."
          : "An unexpected assistant error occurred.",
      },
      {
        status: isAbortError ? 504 : 500,
      }
    );
  }
}