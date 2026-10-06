// "use client";

// import { useCallback, useEffect, useMemo, useRef, useState } from "react";
// import {
//   addDoc,
//   collection,
//   onSnapshot,
//   orderBy,
//   query,
//   serverTimestamp,
//   where,
// } from "firebase/firestore";
// import { db } from "@/lib/firebase";
// import {
//   appendChatMessageRecord,
//   createChatSessionRecord,
//   getOrCreateChatSessionIdentity,
//   linkChatSessionToQuotation,
//   updateChatSessionFields,
//   updateChatSessionStatus,
// } from "@/lib/chat-session";
// import type { ChatMessageType, ChatStep as PersistedChatStep } from "@/lib/chat";
// import {
//   buildQuotationPayload,
//   buildSelectedProductState,
//   buildWhatsAppMessage,
//   BudgetTierKey,
//   CategoryOption,
//   getBudgetLabel,
//   getBundleProductsForEventType,
//   getEstimatedTotals,
//   getEventTypeProducts,
//   getProductEstimate,
//   normalizePriceTiers,
//   normalizeQuotationConfig,
//   ProductOption,
//   SelectedProductFormState,
// } from "@/lib/quotation";

// type ChatUiStep =
//   | "name"
//   | "phone"
//   | "location"
//   | "category"
//   | "eventTypeLoading"
//   | "eventType"
//   | "budget"
//   | "bundles"
//   | "notes"
//   | "confirm"
//   | "complete";

// type ChatMessage = {
//   id: string;
//   sender: "bot" | "user";
//   text: string;
// };

// type ChatIdentity = {
//   isNewSession: boolean;
//   sessionId: string;
//   visitorId: string;
// };

// type ChatAssistantApiResponse = {
//   reply?: string;
// };

// const ASSISTANT_CONFIG_ID = "tentwala_quotation_bot_v1";
// const KNOWLEDGE_BASE_ID = "tentwala_quotation_kb_v1";

// const categoriesRef = collection(db, "product_categories");
// const productsRef = collection(db, "products");
// const quotationRequestsRef = collection(db, "quotation_requests");
// const whatsappNumber = (process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "").replace(
//   /\D/g,
//   ""
// );

// function createInitialMessages(): ChatMessage[] {
//   return [
//     {
//       id: "welcome",
//       sender: "bot",
//       text: "Welcome to TentWala. I can help you plan your event and prepare a quotation right here.",
//     }
//   ];
// }

// function makeMessage(sender: ChatMessage["sender"], text: string) {
//   return {
//     id: `${sender}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
//     sender,
//     text,
//   };
// }

// function mapUiStepToPersistedStep(step: ChatUiStep): PersistedChatStep {
//   switch (step) {
//     case "eventTypeLoading":
//     case "eventType":
//       return "event_type";
//     default:
//       return step;
//   }
// }

// function mapPersistedRoleToSender(role: "user" | "assistant" | "system") {
//   return role === "user" ? "user" : "bot";
// }

// function normalizeIntentText(value: string) {
//   return value.toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
// }

// function findCategoryIntent(
//   value: string,
//   categories: CategoryOption[]
// ) {
//   const normalized = normalizeIntentText(value);

//   const keywordMatch = categories.find((category) => {
//     const categoryName = normalizeIntentText(category.name);

//     if (normalized.includes(categoryName)) {
//       return true;
//     }

//     if (categoryName.includes("wedding") && normalized.includes("wedding")) {
//       return true;
//     }

//     if (
//       categoryName.includes("family") &&
//       (normalized.includes("family") || normalized.includes("friends gathering"))
//     ) {
//       return true;
//     }

//     if (
//       categoryName.includes("corporate") &&
//       (normalized.includes("corporate") || normalized.includes("institutional"))
//     ) {
//       return true;
//     }

//     if (
//       categoryName.includes("religious") &&
//       (normalized.includes("religious") || normalized.includes("domestic ceremony"))
//     ) {
//       return true;
//     }

//     return false;
//   });

//   return keywordMatch ?? null;
// }

// export function QuotationChatbot({
//   initialCategoryId = "",
//   initialProductId = "",
//   onClose,
//   variant = "page",
// }: {
//   initialCategoryId?: string;
//   initialProductId?: string;
//   onClose?: () => void;
//   variant?: "page" | "widget";
// }) {
//   const [messages, setMessages] = useState<ChatMessage[]>(createInitialMessages);
//   const [step, setStep] = useState<ChatUiStep>("name");
//   const [textInput, setTextInput] = useState("");
//   const [categories, setCategories] = useState<CategoryOption[]>([]);
//   const [products, setProducts] = useState<ProductOption[]>([]);
//   const [selectedCategoryId, setSelectedCategoryId] = useState(initialCategoryId);
//   const [selectedEventTypeId, setSelectedEventTypeId] = useState("");
//   const [budgetTier, setBudgetTier] = useState<BudgetTierKey>("medium");
//   const [name, setName] = useState("");
//   const [phoneNumber, setPhoneNumber] = useState("");
//   const [eventLocation, setEventLocation] = useState("");
//   const [notes, setNotes] = useState("");
//   const [selectedProducts, setSelectedProducts] = useState<
//     Record<string, SelectedProductFormState>
//   >({});
//   const [isLoadingCategories, setIsLoadingCategories] = useState(true);
//   const [, setIsLoadingProducts] = useState(Boolean(initialCategoryId));
//   const [isSubmitting, setIsSubmitting] = useState(false);
//   const [error, setError] = useState("");
//   const [successMessage, setSuccessMessage] = useState("");
//   const [chatIdentity, setChatIdentity] = useState<ChatIdentity | null>(() =>
//     getOrCreateChatSessionIdentity()
//   );
//   const pendingEventTypePrompt = useRef(false);
//   const hasHydratedMessages = useRef(false);

//   const appendMessage = useCallback(
//     async (
//       sender: ChatMessage["sender"],
//       text: string,
//       {
//         messageType = "text",
//         stepOverride,
//       }: {
//         messageType?: ChatMessageType;
//         stepOverride?: ChatUiStep;
//       } = {}
//     ) => {
//       const nextMessage = makeMessage(sender, text);

//       setMessages((current) => {
//         if (current.some((message) => message.id === nextMessage.id)) {
//           return current;
//         }

//         return [...current, nextMessage];
//       });

//       if (!chatIdentity) {
//         return nextMessage.id;
//       }

//       try {
//         await appendChatMessageRecord({
//           messageId: nextMessage.id,
//           messageType,
//           role: sender === "user" ? "user" : "assistant",
//           sessionId: chatIdentity.sessionId,
//           step: mapUiStepToPersistedStep(stepOverride ?? step),
//           text,
//           visitorId: chatIdentity.visitorId,
//         });
//       } catch (appendError) {
//         console.error(appendError);
//       }

//       return nextMessage.id;
//     },
//     [chatIdentity, step]
//   );

//   function resetLocalChatState() {
//     setMessages(createInitialMessages());
//     setStep("name");
//     setTextInput("");
//     setSelectedCategoryId(initialCategoryId);
//     setSelectedEventTypeId("");
//     setBudgetTier("medium");
//     setName("");
//     setPhoneNumber("");
//     setEventLocation("");
//     setNotes("");
//     setSelectedProducts({});
//     setProducts([]);
//     setIsLoadingProducts(Boolean(initialCategoryId));
//     setError("");
//     setSuccessMessage("");
//   }

//   async function restartChat() {
//     if (chatIdentity) {
//       try {
//         await updateChatSessionStatus(chatIdentity.sessionId, "abandoned");
//       } catch (statusError) {
//         console.error(statusError);
//       }
//     }

//     resetLocalChatState();
//     hasHydratedMessages.current = false;

//     const nextIdentity = getOrCreateChatSessionIdentity();
//     setChatIdentity(nextIdentity);
//   }

//   useEffect(() => {
//     if (!chatIdentity) {
//       return;
//     }

//     const currentPath =
//       typeof window !== "undefined" ? window.location.pathname : "";

//     void createChatSessionRecord({
//       assistantConfigId: ASSISTANT_CONFIG_ID,
//       currentStep: mapUiStepToPersistedStep(step),
//       knowledgeBaseId: KNOWLEDGE_BASE_ID,
//       landingPage: currentPath,
//       sessionId: chatIdentity.sessionId,
//       visitorId: chatIdentity.visitorId,
//     }).catch((sessionError) => {
//       console.error(sessionError);
//     });
//   }, [chatIdentity, step]);

//   useEffect(() => {
//     if (!chatIdentity) {
//       return;
//     }

//     const messagesQuery = query(
//       collection(db, "chat_sessions", chatIdentity.sessionId, "messages"),
//       orderBy("created_at", "asc")
//     );

//     const unsubscribe = onSnapshot(
//       messagesQuery,
//       (snapshot) => {
//         if (snapshot.empty) {
//           if (!hasHydratedMessages.current && chatIdentity.isNewSession) {
//             hasHydratedMessages.current = true;
//             void appendMessage("bot", "Welcome to TentWala. I can guide you through a quotation in a simple chat flow.", {
//               stepOverride: "name",
//               messageType: "summary",
//             });
//           }

//           return;
//         }

//         const nextMessages = snapshot.docs.map((entry) => {
//           const data = entry.data();

//           return {
//             id: entry.id,
//             sender: mapPersistedRoleToSender(
//               String(data.role ?? "assistant") as "user" | "assistant" | "system"
//             ),
//             text: String(data.text ?? ""),
//           } satisfies ChatMessage;
//         });

//         hasHydratedMessages.current = true;
//         setMessages(nextMessages);
//       },
//       (snapshotError) => {
//         console.error(snapshotError);
//       }
//     );

//     return unsubscribe;
//   }, [appendMessage, chatIdentity]);

//   useEffect(() => {
//     const categoriesQuery = query(
//       categoriesRef,
//       where("is_active", "==", true),
//       orderBy("sort_order", "asc")
//     );

//     const unsubscribe = onSnapshot(
//       categoriesQuery,
//       (snapshot) => {
//         setCategories(
//           snapshot.docs.map((entry) => {
//             const data = entry.data();

//             return {
//               id: entry.id,
//               name: String(data.name ?? ""),
//               short_description: String(data.short_description ?? ""),
//             };
//           })
//         );
//         setIsLoadingCategories(false);
//       },
//       (snapshotError) => {
//         console.error(snapshotError);
//         setError(
//           "Could not load categories for the quotation chat. Check Firestore rules and indexes."
//         );
//         setIsLoadingCategories(false);
//       }
//     );

//     return unsubscribe;
//   }, []);

//   useEffect(() => {
//     if (!selectedCategoryId) {
//       return;
//     }

//     const productsQuery = query(
//       productsRef,
//       where("is_active", "==", true),
//       where("category_ids", "array-contains", selectedCategoryId),
//       orderBy("sort_order", "asc")
//     );

//     const unsubscribe = onSnapshot(
//       productsQuery,
//       (snapshot) => {
//         const nextProducts = snapshot.docs.map((entry) => {
//           const data = entry.data();
//           const quotationConfig = normalizeQuotationConfig(
//             data.quotation_config as ProductOption["quotation_config"] | undefined
//           );
//           const priceTiers = normalizePriceTiers(
//             data.price_tiers as ProductOption["price_tiers"] | undefined
//           );

//           return {
//             id: entry.id,
//             name: String(data.name ?? ""),
//             item_type: String(data.item_type ?? ""),
//             node_type: data.node_type ? String(data.node_type) : undefined,
//             layer: typeof data.layer === "number" ? data.layer : undefined,
//             core_product_ids: Array.isArray(data.core_product_ids)
//               ? data.core_product_ids.map((value) => String(value))
//               : [],
//             optional_product_ids: Array.isArray(data.optional_product_ids)
//               ? data.optional_product_ids.map((value) => String(value))
//               : [],
//             customer_selectable:
//               typeof data.customer_selectable === "boolean"
//                 ? data.customer_selectable
//                 : true,
//             quotation_enabled:
//               typeof data.quotation_enabled === "boolean"
//                 ? data.quotation_enabled
//                 : Boolean(
//                     (
//                       data.quotation_config as ProductOption["quotation_config"]
//                     )?.quotation_enabled ?? true
//                   ),
//             short_description: String(data.short_description ?? ""),
//             service_group: data.service_group
//               ? String(data.service_group)
//               : undefined,
//             pricing_model: String(data.pricing_model ?? ""),
//             price_tiers: priceTiers,
//             quotation_config: quotationConfig,
//           };
//         });

//         const selectableProducts = nextProducts.filter(
//           (product) =>
//             product.customer_selectable !== false &&
//             product.quotation_enabled !== false
//         );

//         setProducts(selectableProducts);
//         setIsLoadingProducts(false);
//         setError("");

//         if (pendingEventTypePrompt.current) {
//           pendingEventTypePrompt.current = false;

//           const nextStep =
//             selectableProducts.filter(
//               (product) =>
//                 product.node_type === "event_type" && product.layer === 3
//             ).length === 0
//               ? "category"
//               : "eventType";

//           const prompt =
//             nextStep === "category"
//               ? "I could not find event types for that category yet. Please choose another category."
//               : "Great. Now choose the event type that best matches your celebration.";

//           setStep(nextStep);

//           if (chatIdentity) {
//             void updateChatSessionFields(chatIdentity.sessionId, {
//               current_step: mapUiStepToPersistedStep(nextStep),
//               quotation_flow_status: "collecting",
//             }).catch((moveError) => {
//               console.error(moveError);
//             });
//           }

//           void appendMessage("bot", prompt, { stepOverride: nextStep });
//         }
//       },
//       (snapshotError) => {
//         console.error(snapshotError);
//         setError(
//           "Could not load products for the selected category. Check Firestore rules and indexes."
//         );
//         setIsLoadingProducts(false);
//       }
//     );

//     return unsubscribe;
//   }, [appendMessage, chatIdentity, initialProductId, selectedCategoryId]);

//   useEffect(() => {
//     if (!chatIdentity) {
//       return;
//     }

//     void updateChatSessionFields(chatIdentity.sessionId, {
//       collected_name: name,
//       collected_phone_number: phoneNumber,
//       collected_location: eventLocation,
//       quotation_budget_tier: budgetTier,
//       quotation_category_id: selectedCategoryId,
//       quotation_category_name:
//         categories.find((category) => category.id === selectedCategoryId)?.name ?? "",
//       quotation_event_type_id: selectedEventTypeId,
//       quotation_event_type_name:
//         products.find((product) => product.id === selectedEventTypeId)?.name ?? "",
//     }).catch((updateError) => {
//       console.error(updateError);
//     });
//   }, [
//     budgetTier,
//     categories,
//     chatIdentity,
//     eventLocation,
//     name,
//     phoneNumber,
//     products,
//     selectedCategoryId,
//     selectedEventTypeId,
//   ]);

//   const eventTypeProducts = useMemo(
//     () => getEventTypeProducts(products),
//     [products]
//   );
//   const { bundleProducts, coreBundleIdSet, selectedEventType } = useMemo(
//     () => getBundleProductsForEventType(products, selectedEventTypeId),
//     [products, selectedEventTypeId]
//   );
//   const estimatedTotals = useMemo(
//     () => getEstimatedTotals(bundleProducts, selectedProducts, budgetTier),
//     [bundleProducts, selectedProducts, budgetTier]
//   );

//   async function requestAssistantReply({
//     userMessage,
//   }: {
//     userMessage?: string;
//   }) {
//     try {
//       const response = await fetch("/api/chat-assistant", {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//         },
//         body: JSON.stringify({
//           recentMessages: messages.slice(-6).map((message) => ({
//             role: message.sender === "user" ? "user" : "assistant",
//             text: message.text,
//           })),
//           userMessage,
//         }),
//       });

//       if (!response.ok) {
//         return {} satisfies ChatAssistantApiResponse;
//       }

//       const data = (await response.json()) as ChatAssistantApiResponse;
//       return { reply: data.reply?.trim() } satisfies ChatAssistantApiResponse;
//     } catch (replyError) {
//       console.error(replyError);
//       return {} satisfies ChatAssistantApiResponse;
//     }
//   }

//   async function moveToStep(
//     nextStep: ChatUiStep,
//     prompt?: string,
//     {
//       appendPrompt = true,
//       useAi = true,
//       userMessage,
//     }: {
//       appendPrompt?: boolean;
//       useAi?: boolean;
//       userMessage?: string;
//     } = {}
//   ) {
//     setStep(nextStep);

//     if (chatIdentity) {
//       try {
//         await updateChatSessionFields(chatIdentity.sessionId, {
//           current_step: mapUiStepToPersistedStep(nextStep),
//           quotation_flow_status:
//             nextStep === "confirm" || nextStep === "complete"
//               ? "ready_to_submit"
//               : "collecting",
//         });
//       } catch (moveError) {
//         console.error(moveError);
//       }
//     }

//     if (prompt && appendPrompt) {
//       const assistantTurn =
//         useAi && nextStep !== "eventTypeLoading"
//           ? await requestAssistantReply({
//               userMessage,
//             })
//           : { reply: prompt };

//       await appendMessage("bot", assistantTurn.reply ?? prompt, { stepOverride: nextStep });
//     }
//   }

//   async function handleTextSubmit(event: React.FormEvent<HTMLFormElement>) {
//     event.preventDefault();

//     const value = textInput.trim();
//     setError("");

//     if (!value) {
//       if (step === "notes") {
//         await handleSkipNotes();
//       } else {
//         setError("Please enter a message.");
//       }
//       return;
//     }

//     await appendMessage("user", value);
//     setTextInput("");

//     if (step === "name") {
//       setName(value);
//       const assistantTurn = await requestAssistantReply({
//         userMessage: value,
//       });
//       await moveToStep("phone", assistantTurn.reply || "What phone number should we use for your quotation?", {
//         useAi: false,
//         userMessage: value,
//       });
//       return;
//     }

//     if (step === "phone") {
//       setPhoneNumber(value);
//       const assistantTurn = await requestAssistantReply({
//         userMessage: value,
//       });
//       await moveToStep("location", assistantTurn.reply || "Where is the event taking place?", {
//         useAi: false,
//         userMessage: value,
//       });
//       return;
//     }

//     if (step === "location") {
//       setEventLocation(value);
//       const detectedCategory = findCategoryIntent(value, categories);

//       if (detectedCategory) {
//         setSelectedCategoryId(detectedCategory.id);
//         setSelectedEventTypeId("");
//         setSelectedProducts({});
//         setProducts([]);
//         setIsLoadingProducts(true);
//         pendingEventTypePrompt.current = true;
//         const assistantTurn = await requestAssistantReply({
//           userMessage: value,
//         });
//         await moveToStep(
//           "eventTypeLoading",
//           assistantTurn.reply || "I understood your event category. Let me load the matching event types for you.",
//           {
//             appendPrompt: false,
//             useAi: false,
//             userMessage: value,
//           }
//         );
//         return;
//       }

//       const assistantTurn = await requestAssistantReply({
//         userMessage: value,
//       });
//       await moveToStep("category", assistantTurn.reply || "Please choose the category for your event.", {
//         useAi: false,
//         userMessage: value,
//       });
//       return;
//     }

//     if (step === "notes") {
//       setNotes(value);
//       const assistantTurn = await requestAssistantReply({
//         userMessage: value,
//       });
//       await moveToStep("confirm", assistantTurn.reply || "Perfect. Review your quotation summary below and submit when you're ready.", {
//         useAi: false,
//         userMessage: value,
//       });
//     }
//   }

//   async function handleCategorySelect(category: CategoryOption) {
//     setSelectedCategoryId(category.id);
//     setSelectedEventTypeId("");
//     setSelectedProducts({});
//     setProducts([]);
//     setIsLoadingProducts(true);
//     pendingEventTypePrompt.current = true;
//     setError("");
//     setSuccessMessage("");
//     await appendMessage("user", category.name, { stepOverride: "category" });
//     await moveToStep(
//       "eventTypeLoading",
//       "I'm loading the matching event types for you.",
//       {
//         appendPrompt: false,
//         useAi: false,
//         userMessage: category.name,
//       }
//     );
//   }

//   async function handleEventTypeSelect(product: ProductOption) {
//     setSelectedEventTypeId(product.id);
//     setSelectedProducts(
//       buildSelectedProductState(products, product.id, initialProductId)
//     );
//     await appendMessage("user", product.name, { stepOverride: "eventType" });
//     await moveToStep("budget", "Which budget tier would you like me to estimate?", {
//       userMessage: product.name,
//     });
//   }

//   async function handleBudgetSelect(nextBudgetTier: BudgetTierKey) {
//     setBudgetTier(nextBudgetTier);
//     await appendMessage("user", getBudgetLabel(nextBudgetTier), {
//       stepOverride: "budget",
//     });
//     await moveToStep(
//       "bundles",
//       "Select the services you want in the quotation. You can also adjust quantity or duration where required.",
//       {
//         userMessage: getBudgetLabel(nextBudgetTier),
//       }
//     );
//   }

//   function handleProductToggle(productId: string) {
//     setSelectedProducts((current) => {
//       const existing = current[productId];

//       return {
//         ...current,
//         [productId]: {
//           duration: existing?.duration ?? "1",
//           quantity: existing?.quantity ?? "1",
//           selected: !existing?.selected,
//         },
//       };
//     });
//   }

//   function handleProductFieldChange(
//     productId: string,
//     field: "duration" | "quantity",
//     value: string
//   ) {
//     setSelectedProducts((current) => ({
//       ...current,
//       [productId]: {
//         duration: current[productId]?.duration ?? "1",
//         quantity: current[productId]?.quantity ?? "1",
//         selected: current[productId]?.selected ?? false,
//         [field]: value,
//       },
//     }));
//   }

//   async function handleBundleContinue() {
//     try {
//       buildQuotationPayload({
//         budgetTier,
//         categories,
//         eventLocation: {
//           address: eventLocation,
//           source: "manual",
//         },
//         name,
//         notes,
//         phoneNumber,
//         products,
//         selectedCategoryId,
//         selectedEventTypeId,
//         selectedProducts,
//       });
//     } catch (bundleError) {
//       setError(
//         bundleError instanceof Error
//           ? bundleError.message
//           : "Please review your service selections."
//       );
//       return;
//     }

//     const selectedCount = bundleProducts.filter(
//       (product) => selectedProducts[product.id]?.selected
//     ).length;

//     await appendMessage(
//       "user",
//       `Selected ${selectedCount} service${selectedCount === 1 ? "" : "s"}`,
//       { stepOverride: "bundles", messageType: "summary" }
//     );
//     await moveToStep(
//       "notes",
//       "Any extra notes to help us prepare the quotation? You can type them below or skip this step.",
//       {
//         userMessage: `Selected ${selectedCount} services`,
//       }
//     );
//   }

//   async function handleSkipNotes() {
//     setNotes("");
//     await appendMessage("user", "No additional notes", { stepOverride: "notes" });
//     await moveToStep(
//       "confirm",
//       "Perfect. Review your quotation summary below and submit when you're ready.",
//       {
//         userMessage: "No additional notes",
//       }
//     );
//   }

//   async function handleSubmitQuotation() {
//     if (!whatsappNumber) {
//       setError(
//         "WhatsApp number is not configured yet. Add NEXT_PUBLIC_WHATSAPP_NUMBER to your .env.local file."
//       );
//       return;
//     }

//     setIsSubmitting(true);
//     setError("");
//     setSuccessMessage("");

//     try {
//       const payload = buildQuotationPayload({
//         budgetTier,
//         categories,
//         eventLocation: {
//           address: eventLocation,
//           source: "manual",
//         },
//         name,
//         notes,
//         phoneNumber,
//         products,
//         selectedCategoryId,
//         selectedEventTypeId,
//         selectedProducts,
//       });

//       const quotationRef = await addDoc(quotationRequestsRef, {
//         ...payload,
//         chat_session_id: chatIdentity?.sessionId ?? "",
//         created_at: serverTimestamp(),
//         source: "chatbot",
//         visitor_id: chatIdentity?.visitorId ?? "",
//       });

//       if (chatIdentity) {
//         await linkChatSessionToQuotation(chatIdentity.sessionId, {
//           quotationRequestId: quotationRef.id,
//           quotationStatus: payload.status,
//         });
//       }

//       const whatsappMessage = buildWhatsAppMessage(payload);
//       const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(
//         whatsappMessage
//       )}`;

//       const popup = window.open(whatsappUrl, "_blank", "noopener,noreferrer");

//       if (!popup) {
//         window.location.assign(whatsappUrl);
//       }

//       setSuccessMessage(
//         "Your quotation request has been submitted and WhatsApp has been opened with the same details."
//       );
//       await appendMessage(
//         "bot",
//         "Your quotation request is submitted. I've also opened WhatsApp with the same request details for quick follow-up.",
//         { stepOverride: "complete", messageType: "summary" }
//       );
//       setStep("complete");
//     } catch (submitError) {
//       console.error(submitError);
//       setError(
//         submitError instanceof Error
//           ? submitError.message
//           : "Could not submit the quotation request to Firestore."
//       );
//     } finally {
//       setIsSubmitting(false);
//     }
//   }

//   function openFullQuotationPage() {
//     const params = new URLSearchParams();

//     if (selectedCategoryId) {
//       params.set("category", selectedCategoryId);
//     }

//     if (selectedEventTypeId) {
//       params.set("product", selectedEventTypeId);
//     }

//     const target = params.toString()
//       ? `/contact?${params.toString()}`
//       : "/contact";

//     window.location.assign(target);
//   }

//   const currentCategory = categories.find(
//     (category) => category.id === selectedCategoryId
//   );
//   const isWidget = variant === "widget";
//   if (isWidget) {
//     return (
//       <section className="flex h-full min-h-0 flex-col rounded-[1.9rem] bg-transparent">
//         <div className="rounded-[1.55rem] bg-[linear-gradient(135deg,#243f78,#2e356f)] px-5 py-5 text-white shadow-[0_18px_40px_rgba(36,63,120,0.28)]">
//           <div className="flex items-start justify-between gap-4">
//             <div className="space-y-2">
//               {/* <p className="text-xs font-semibold uppercase tracking-[0.24em] text-white/70">
//                 Quotation Concierge
//               </p> */}
//               <h2 className="font-serif text-[1.7rem] leading-tight text-white">
//                 TentWala
//               </h2>
//               {/* <p className="max-w-sm text-sm leading-6 text-white/82">
//                 Tell us about your event and we will guide you through the quotation
//                 beautifully.
//               </p> */}
//             </div>

//             <button
//               className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/18 bg-white/10 text-xl text-white transition hover:bg-white/16"
//               onClick={onClose}
//               type="button"
//             >
//               ×
//             </button>
//           </div>

//           {/* <div className="mt-4 flex gap-2">
//             <button
//               className="inline-flex h-11 items-center justify-center rounded-full border border-white/18 bg-white/10 px-5 text-sm font-semibold text-white transition hover:bg-white/16"
//               onClick={() => void restartChat()}
//               type="button"
//             >
//               Restart chat
//             </button>
//           </div> */}
//         </div>

//         <div className="mt-3 flex min-h-0 flex-1 flex-col gap-3">
//           <div className="min-h-0 flex-1 overflow-y-auto rounded-[1.6rem] border border-[#ebe4d9] bg-[linear-gradient(180deg,#fffdfa,#f7f2ea)] p-4 shadow-[0_18px_36px_rgba(29,45,68,0.06)]">
//             <div className="space-y-4">
//               {messages.map((message) => (
//                 <div
//                   key={message.id}
//                   className={`flex ${
//                     message.sender === "user" ? "justify-end" : "justify-start"
//                   }`}
//                 >
//                   <div className="max-w-[88%] space-y-1">
//                     <p
//                       className={`px-1 text-[11px] font-semibold uppercase tracking-[0.16em] ${
//                         message.sender === "user"
//                           ? "text-right text-[#51617f]"
//                           : "text-[#8c7345]"
//                       }`}
//                     >
//                       {message.sender === "user" ? "You" : "TentWala"}
//                     </p>
//                     <div
//                       className={`rounded-[1.35rem] px-4 py-3 text-sm leading-7 shadow-[0_12px_26px_rgba(29,45,68,0.06)] ${
//                         message.sender === "user"
//                           ? "bg-[linear-gradient(135deg,#243f78,#2c4f91)] text-white"
//                           : "border border-[#e7dfd1] bg-white text-[#30405f]"
//                       }`}
//                     >
//                       {message.text}
//                     </div>
//                   </div>
//                 </div>
//               ))}

//               {error ? (
//                 <div className="rounded-[1.25rem] bg-red-50 px-4 py-3 text-sm text-red-700">
//                   {error}
//                 </div>
//               ) : null}

//               {successMessage ? (
//                 <div className="rounded-[1.25rem] bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
//                   {successMessage}
//                 </div>
//               ) : null}
//             </div>
//           </div>

//           <div className="max-h-[42vh] overflow-y-auto rounded-[1.6rem] border border-[#ebe4d9] bg-white/96 p-4 shadow-[0_18px_36px_rgba(29,45,68,0.06)]">
//             {step === "name" || step === "phone" || step === "location" || step === "notes" ? (
//               <form
//                 className="space-y-3"
//                 onSubmit={(event) => void handleTextSubmit(event)}
//               >
//                 <div className="flex items-center gap-3">
//                   <input
//                     className="h-12 flex-1 rounded-full border border-[#d9d6d0] bg-white px-4 text-sm outline-none transition focus:border-[#243f78]"
//                     onChange={(event) => setTextInput(event.target.value)}
//                     placeholder={
//                       step === "name"
//                         ? "Enter your name"
//                         : step === "phone"
//                           ? "Enter your phone number"
//                           : step === "location"
//                             ? "Enter city or venue location"
//                             : "Add notes about guest count, timing, or special needs"
//                     }
//                     value={textInput}
//                   />
//                   <button
//                     className="inline-flex h-12 items-center justify-center rounded-full bg-[linear-gradient(135deg,#243f78,#2c4f91)] px-5 text-sm font-semibold text-white shadow-[0_16px_28px_rgba(36,63,120,0.2)] transition hover:brightness-105"
//                     type="submit"
//                   >
//                     Send
//                   </button>
//                 </div>
//                 {step === "notes" ? (
//                   <button
//                     className="inline-flex h-10 items-center justify-center rounded-full border border-[#d8d3cb] bg-[#faf7f1] px-4 text-sm font-semibold text-[#24304f] transition hover:bg-white"
//                     onClick={() => void handleSkipNotes()}
//                     type="button"
//                   >
//                     Skip notes
//                   </button>
//                 ) : null}
//               </form>
//             ) : null}

//             {step === "category" ? (
//               <div className="space-y-3">
//                 {isLoadingCategories ? (
//                   <p className="text-sm text-zinc-600">Loading categories...</p>
//                 ) : (
//                   <div className="flex flex-wrap gap-3">
//                     {categories.map((category) => (
//                       <button
//                         key={category.id}
//                         className="rounded-full border border-[#ddd4c5] bg-[#fffdfa] px-4 py-2 text-sm font-medium text-[#2f3f67] shadow-[0_10px_18px_rgba(29,45,68,0.04)] transition hover:border-[#243f78] hover:bg-white hover:text-[#243f78]"
//                         onClick={() => void handleCategorySelect(category)}
//                         type="button"
//                       >
//                         {category.name}
//                       </button>
//                     ))}
//                   </div>
//                 )}
//               </div>
//             ) : null}

//             {step === "eventTypeLoading" ? (
//               <p className="text-sm text-zinc-600">
//                 Loading event types for the selected category...
//               </p>
//             ) : null}

//             {step === "eventType" ? (
//               <div className="space-y-3">
//                 <div className="-mx-1 flex snap-x snap-mandatory gap-3 overflow-x-auto px-1 pb-2">
//                   {eventTypeProducts.map((product) => (
//                     <button
//                       key={product.id}
//                       className="min-w-[17rem] shrink-0 snap-start rounded-[1.4rem] border border-[#e4dccf] bg-[linear-gradient(180deg,#fffdfa,#f8f3eb)] p-4 text-left shadow-[0_12px_24px_rgba(29,45,68,0.04)] transition hover:border-[#243f78] hover:bg-white"
//                       onClick={() => void handleEventTypeSelect(product)}
//                       type="button"
//                     >
//                       <p className="font-semibold text-[#1d2d44]">{product.name}</p>
//                       <p className="mt-1 text-sm leading-6 text-zinc-600">
//                         {product.short_description}
//                       </p>
//                     </button>
//                   ))}
//                 </div>
//               </div>
//             ) : null}

//             {step === "budget" ? (
//               <div className="flex flex-wrap gap-3">
//                 {(["low", "medium", "high"] as BudgetTierKey[]).map((tier) => (
//                   <button
//                     key={tier}
//                     className="rounded-full border border-[#ddd4c5] bg-[#fffdfa] px-5 py-2 text-sm font-semibold text-[#2f3f67] shadow-[0_10px_18px_rgba(29,45,68,0.04)] transition hover:border-[#243f78] hover:bg-white hover:text-[#243f78]"
//                     onClick={() => void handleBudgetSelect(tier)}
//                     type="button"
//                   >
//                     {getBudgetLabel(tier)}
//                   </button>
//                 ))}
//               </div>
//             ) : null}

//             {step === "bundles" ? (
//               <div className="space-y-4">
//                 <div className="rounded-[1.4rem] border border-[#e4dccf] bg-[linear-gradient(180deg,#fffdfa,#f8f3eb)] p-4 shadow-[0_12px_24px_rgba(29,45,68,0.04)]">
//                   <p className="text-sm leading-7 text-[#30405f]">
//                     I have understood the event direction. For detailed service
//                     selection and bundle customization, continue on the full quotation
//                     page.
//                   </p>
//                   {selectedEventType?.name ? (
//                     <p className="mt-3 text-sm font-medium text-[#243f78]">
//                       Event type: {selectedEventType.name}
//                     </p>
//                   ) : null}
//                   <p className="mt-2 text-sm text-zinc-600">
//                     Estimated range so far: Rs. {estimatedTotals.minimum} - Rs.{" "}
//                     {estimatedTotals.maximum}
//                   </p>
//                 </div>

//                 <div className="flex flex-wrap gap-3">
//                   <button
//                     className="inline-flex h-11 items-center justify-center rounded-full bg-[linear-gradient(135deg,#173f73,#214f86)] px-5 text-sm font-semibold text-white shadow-[0_16px_28px_rgba(23,63,115,0.2)] transition hover:brightness-105"
//                     onClick={openFullQuotationPage}
//                     type="button"
//                   >
//                     Open full quotation page
//                   </button>
//                   <button
//                     className="inline-flex h-11 items-center justify-center rounded-full border border-[#d8d3cb] bg-[#faf7f1] px-5 text-sm font-semibold text-[#24304f] transition hover:bg-white"
//                     onClick={() => void moveToStep(
//                       "notes",
//                       "If you want, you can add any special notes here before continuing.",
//                       {
//                         useAi: false,
//                       }
//                     )}
//                     type="button"
//                   >
//                     Add notes here
//                   </button>
//                 </div>
//               </div>
//             ) : null}

//             {step === "confirm" || step === "complete" ? (
//               <div className="space-y-4">
//                 <div className="rounded-[1.4rem] border border-[#d8dfde] bg-[#fbfaf7] p-4">
//                   <div className="space-y-2 text-sm text-zinc-600">
//                     <p>
//                       <span className="font-semibold text-zinc-900">Category:</span>{" "}
//                       {currentCategory?.name}
//                     </p>
//                     <p>
//                       <span className="font-semibold text-zinc-900">Event type:</span>{" "}
//                       {selectedEventType?.name}
//                     </p>
//                     <p>
//                       <span className="font-semibold text-zinc-900">Budget:</span>{" "}
//                       {getBudgetLabel(budgetTier)}
//                     </p>
//                     <p>
//                       <span className="font-semibold text-zinc-900">Notes:</span>{" "}
//                       {notes || "No additional notes"}
//                     </p>
//                     <p className="pt-2 text-base font-semibold text-[#1d2d44]">
//                       Estimated total: Rs. {estimatedTotals.minimum} - Rs.{" "}
//                       {estimatedTotals.maximum}
//                     </p>
//                   </div>
//                 </div>

//                 {step === "confirm" ? (
//                   <button
//                     className="inline-flex h-11 items-center justify-center rounded-full bg-[linear-gradient(135deg,#173f73,#214f86)] px-5 text-sm font-semibold text-white shadow-[0_16px_28px_rgba(23,63,115,0.2)] transition hover:brightness-105 disabled:cursor-not-allowed disabled:bg-zinc-300 disabled:shadow-none"
//                     disabled={isSubmitting}
//                     onClick={() => void handleSubmitQuotation()}
//                     type="button"
//                   >
//                     {isSubmitting ? "Submitting request..." : "Submit quotation request"}
//                   </button>
//                 ) : null}
//               </div>
//             ) : null}
//           </div>
//         </div>
//       </section>
//     );
//   }

//   return (
//     <section
//       className={`rounded-[2rem] border border-[#d8dfde] bg-white/88 shadow-[0_24px_60px_rgba(29,45,68,0.08)] backdrop-blur ${
//         isWidget
//           ? "flex h-full min-h-0 flex-col border-transparent bg-transparent p-0 shadow-none"
//           : "p-5 sm:p-7"
//       }`}
//     >
//       <div className={`flex flex-col gap-6 ${isWidget ? "min-h-0 flex-1" : ""}`}>
//         <div
//           className={`flex flex-col gap-3 ${
//             isWidget
//               ? "rounded-[1.55rem] bg-[linear-gradient(135deg,#243f78,#2e356f)] px-5 py-5 text-white shadow-[0_18px_40px_rgba(36,63,120,0.28)]"
//               : "sm:flex-row sm:items-end sm:justify-between"
//           }`}
//         >
//           <div className="space-y-2">
//             <p
//               className={`text-xs font-semibold uppercase tracking-[0.24em] ${
//                 isWidget ? "text-white/70" : "text-[#4faebc]"
//               }`}
//             >
//               {isWidget ? "Quotation Concierge" : "Quotation Chat"}
//             </p>
//             <h2
//               className={`font-serif leading-tight ${
//                 isWidget ? "text-[1.7rem] text-white" : "text-3xl text-[#1d2d44] sm:text-4xl"
//               }`}
//             >
//               {isWidget ? "TentWala" : "Guided quotation, one step at a time"}
//             </h2>
//             <p
//               className={`${
//                 isWidget
//                   ? "max-w-sm text-sm leading-6 text-white/82"
//                   : "max-w-3xl text-sm leading-7 text-zinc-600 sm:text-base"
//               }`}
//             >
//               {isWidget
//                 ? "Tell us about your event and we will guide you beautifully through the quotation."
//                 : "This chatbot uses the same quotation logic as your form, but asks the questions in a simpler conversation flow."}
//             </p>
//           </div>

//           <div className="flex gap-2">
//             <button
//               className={`inline-flex h-11 items-center justify-center rounded-full px-5 text-sm font-semibold transition ${
//                 isWidget
//                   ? "border border-white/18 bg-white/10 text-white shadow-none hover:bg-white/16"
//                   : "border border-[#1d2d44]/10 bg-white/80 text-[#1d2d44] shadow-[0_10px_22px_rgba(29,45,68,0.06)] hover:bg-white"
//               }`}
//               onClick={() => void restartChat()}
//               type="button"
//             >
//               Restart chat
//             </button>
//             {onClose ? (
//               <button
//                 className={`inline-flex h-11 items-center justify-center rounded-full px-4 text-sm font-semibold transition ${
//                   isWidget
//                     ? "border border-white/18 bg-white/10 text-white shadow-none hover:bg-white/16"
//                     : "border border-[#1d2d44]/10 bg-white/80 text-[#1d2d44] shadow-[0_10px_22px_rgba(29,45,68,0.06)] hover:bg-white"
//                 }`}
//                 onClick={onClose}
//                 type="button"
//               >
//                 {isWidget ? "×" : "Close"}
//               </button>
//             ) : null}
//           </div>
//         </div>

//         <div
//           className={`grid gap-4 ${
//             isWidget
//               ? "min-h-0 flex-1 grid-cols-1"
//               : "lg:grid-cols-[1.2fr_0.8fr]"
//           }`}
//         >
//           <div
//             className={`rounded-[1.8rem] border border-white/80 bg-[linear-gradient(180deg,rgba(249,247,243,0.98),rgba(243,238,231,0.92))] shadow-[0_18px_36px_rgba(29,45,68,0.07)] ${
//               isWidget ? "flex min-h-0 flex-1 flex-col p-3" : "p-4 sm:p-5"
//             }`}
//           >
//             <div className={`space-y-4 ${isWidget ? "min-h-0 flex-1 overflow-y-auto pr-1" : ""}`}>
//               {messages.map((message) => (
//                 <div
//                   key={message.id}
//                   className={`flex ${
//                     message.sender === "user" ? "justify-end" : "justify-start"
//                   }`}
//                 >
//                   <div
//                     className={`max-w-[90%] rounded-[1.4rem] px-4 py-3 text-sm leading-7 shadow-[0_12px_28px_rgba(29,45,68,0.06)] sm:text-[0.96rem] ${
//                       message.sender === "user"
//                         ? "bg-[linear-gradient(135deg,#243f78,#2c4f91)] text-white shadow-[0_16px_28px_rgba(36,63,120,0.24)]"
//                         : isWidget
//                           ? "border border-[#e7e0d4] bg-[linear-gradient(180deg,#ffffff,#fbf7f0)] text-[#2f3f67]"
//                           : "border border-white/80 bg-white/96 text-zinc-700"
//                     }`}
//                   >
//                     {message.text}
//                   </div>
//                 </div>
//               ))}

//               {error ? (
//                 <div className="rounded-[1.25rem] bg-red-50 px-4 py-3 text-sm text-red-700">
//                   {error}
//                 </div>
//               ) : null}

//               {successMessage ? (
//                 <div className="rounded-[1.25rem] bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
//                   {successMessage}
//                 </div>
//               ) : null}
//             </div>
//           </div>

//           <div className="space-y-4">
//             <div className={`rounded-[1.8rem] border border-white/80 bg-white/92 shadow-[0_18px_40px_rgba(29,45,68,0.06)] ${isWidget ? "p-4" : "p-5"}`}>
//               {step === "name" || step === "phone" || step === "location" || step === "notes" ? (
//                 <form className="space-y-3" onSubmit={(event) => void handleTextSubmit(event)}>
//                   <div className={isWidget ? "flex items-center gap-3" : ""}>
//                     <input
//                       className={`h-12 w-full rounded-2xl border border-[#d8dfde] bg-[#fbfaf7] px-4 text-sm outline-none transition focus:border-[#173f73] focus:bg-white ${
//                         isWidget ? "flex-1 rounded-full border-[#d9d6d0] bg-white" : ""
//                       }`}
//                       onChange={(event) => setTextInput(event.target.value)}
//                       placeholder="Enter your name"
//                       value={textInput}
//                     />
//                     {isWidget ? (
//                       <button
//                         className="inline-flex h-12 min-w-12 items-center justify-center rounded-full bg-[linear-gradient(135deg,#243f78,#2c4f91)] px-5 text-sm font-semibold text-white shadow-[0_16px_28px_rgba(36,63,120,0.2)] transition hover:brightness-105"
//                         type="submit"
//                       >
//                         Send
//                       </button>
//                     ) : null}
//                   </div>
//                   <div className={`flex flex-wrap gap-3 ${isWidget ? "pt-1" : ""}`}>
//                     {!isWidget ? (
//                     <button
//                       className="inline-flex h-11 items-center justify-center rounded-full bg-[linear-gradient(135deg,#173f73,#214f86)] px-5 text-sm font-semibold text-white shadow-[0_16px_28px_rgba(23,63,115,0.2)] transition hover:brightness-105"
//                       type="submit"
//                     >
//                       Continue
//                     </button>
//                     ) : null}
//                     {step === "notes" ? (
//                       <button
//                         className="inline-flex h-11 items-center justify-center rounded-full border border-[#1d2d44]/12 bg-white px-5 text-sm font-semibold text-[#1d2d44] transition hover:bg-[#f7f7f4]"
//                         onClick={() => void handleSkipNotes()}
//                         type="button"
//                       >
//                         Skip notes
//                       </button>
//                     ) : null}
//                   </div>
//                 </form>
//               ) : null}

//               {step === "category" ? (
//                 <div className="space-y-3">
//                   {isLoadingCategories ? (
//                     <p className="text-sm text-zinc-600">Loading categories...</p>
//                   ) : (
//                     <div className="flex flex-wrap gap-3">
//                       {categories.map((category) => (
//                         <button
//                           key={category.id}
//                           className={`rounded-full border px-4 py-2 text-sm font-medium shadow-[0_10px_18px_rgba(29,45,68,0.04)] transition ${
//                             isWidget
//                               ? "border-[#ddd4c5] bg-[#fffdfa] text-[#2f3f67] hover:border-[#243f78] hover:bg-white hover:text-[#243f78]"
//                               : "border-[#1d2d44]/10 bg-[#fbfaf7] text-[#1d2d44] hover:border-[#173f73] hover:bg-white hover:text-[#173f73]"
//                           }`}
//                           onClick={() => void handleCategorySelect(category)}
//                           type="button"
//                         >
//                           {category.name}
//                         </button>
//                       ))}
//                     </div>
//                   )}
//                 </div>
//               ) : null}

//               {step === "eventTypeLoading" ? (
//                 <p className="text-sm text-zinc-600">
//                   Loading event types for the selected category...
//                 </p>
//               ) : null}

//               {step === "eventType" ? (
//                 <div className="space-y-3">
//                   <div className="grid gap-3">
//                     {eventTypeProducts.map((product) => (
//                       <button
//                         key={product.id}
//                         className={`rounded-[1.4rem] border p-4 text-left shadow-[0_12px_24px_rgba(29,45,68,0.04)] transition ${
//                           isWidget
//                             ? "border-[#e4dccf] bg-[linear-gradient(180deg,#fffdfa,#f8f3eb)] hover:border-[#243f78] hover:bg-white"
//                             : "border-[#d8dfde] bg-[#fbfaf7] hover:border-[#173f73] hover:bg-white"
//                         }`}
//                         onClick={() => void handleEventTypeSelect(product)}
//                         type="button"
//                       >
//                         <p className="font-semibold text-[#1d2d44]">{product.name}</p>
//                         <p className="mt-1 text-sm leading-6 text-zinc-600">
//                           {product.short_description}
//                         </p>
//                       </button>
//                     ))}
//                   </div>
//                 </div>
//               ) : null}

//               {step === "budget" ? (
//                 <div className="flex flex-wrap gap-3">
//                   {(["low", "medium", "high"] as BudgetTierKey[]).map((tier) => (
//                     <button
//                       key={tier}
//                       className={`rounded-full border px-5 py-2 text-sm font-semibold shadow-[0_10px_18px_rgba(29,45,68,0.04)] transition ${
//                         isWidget
//                           ? "border-[#ddd4c5] bg-[#fffdfa] text-[#2f3f67] hover:border-[#243f78] hover:bg-white hover:text-[#243f78]"
//                           : "border-[#1d2d44]/10 bg-[#fbfaf7] text-[#1d2d44] hover:border-[#173f73] hover:bg-white hover:text-[#173f73]"
//                       }`}
//                       onClick={() => void handleBudgetSelect(tier)}
//                       type="button"
//                     >
//                       {getBudgetLabel(tier)}
//                     </button>
//                   ))}
//                 </div>
//               ) : null}

//               {step === "bundles" ? (
//                 <div className="space-y-4">
//                   <div className="grid gap-4">
//                     {bundleProducts.map((product) => {
//                       const productState = selectedProducts[product.id] ?? {
//                         duration: product.quotation_config.minimum_duration
//                           ? String(product.quotation_config.minimum_duration)
//                           : "1",
//                         quantity: product.quotation_config.minimum_quantity
//                           ? String(product.quotation_config.minimum_quantity)
//                           : "1",
//                         selected: coreBundleIdSet.has(product.id),
//                       };
//                       const estimate = getProductEstimate(
//                         product,
//                         budgetTier,
//                         productState
//                       );

//                       return (
//                         <article
//                           key={product.id}
//                           className={`rounded-[1.4rem] border p-4 shadow-[0_12px_24px_rgba(29,45,68,0.04)] ${
//                             isWidget
//                               ? "border-[#e4dccf] bg-[linear-gradient(180deg,#fffdfa,#f8f3eb)]"
//                               : "border-[#d8dfde] bg-[#fbfaf7]"
//                           }`}
//                         >
//                           <label className="flex items-start gap-3">
//                             <input
//                               checked={productState.selected}
//                               className="mt-1 h-4 w-4"
//                               onChange={() => handleProductToggle(product.id)}
//                               type="checkbox"
//                             />
//                             <div className="flex-1 space-y-2">
//                               <div className="flex flex-wrap items-center gap-2">
//                                 <p className="font-semibold text-[#1d2d44]">
//                                   {product.name}
//                                 </p>
//                                 <span className="rounded-full border border-[#1d2d44]/10 bg-white px-3 py-1 text-[11px] uppercase tracking-[0.16em] text-zinc-500">
//                                   {coreBundleIdSet.has(product.id)
//                                     ? "Core bundle"
//                                     : "Optional add-on"}
//                                 </span>
//                               </div>
//                               <p className="text-sm leading-6 text-zinc-600">
//                                 {product.short_description}
//                               </p>
//                               <p className="text-sm font-medium text-zinc-700">
//                                 {estimate
//                                   ? `Rs. ${estimate.minimum} - Rs. ${estimate.maximum}`
//                                   : "Manual review required for this selection"}
//                               </p>

//                               {productState.selected ? (
//                                 <div className="grid gap-3 pt-1 sm:grid-cols-2">
//                                   {product.quotation_config.quantity_required ? (
//                                     <input
//                                       className="h-11 rounded-2xl border border-[#d8dfde] bg-white px-4 text-sm outline-none transition focus:border-[#173f73]"
//                                       min={product.quotation_config.minimum_quantity ?? 1}
//                                       onChange={(event) =>
//                                         handleProductFieldChange(
//                                           product.id,
//                                           "quantity",
//                                           event.target.value
//                                         )
//                                       }
//                                       placeholder={
//                                         product.quotation_config.quantity_label ??
//                                         "Quantity"
//                                       }
//                                       type="number"
//                                       value={productState.quantity}
//                                     />
//                                   ) : null}
//                                   {product.quotation_config.duration_required ? (
//                                     <input
//                                       className="h-11 rounded-2xl border border-[#d8dfde] bg-white px-4 text-sm outline-none transition focus:border-[#173f73]"
//                                       min={product.quotation_config.minimum_duration ?? 1}
//                                       onChange={(event) =>
//                                         handleProductFieldChange(
//                                           product.id,
//                                           "duration",
//                                           event.target.value
//                                         )
//                                       }
//                                       placeholder={
//                                         product.quotation_config.duration_label ??
//                                         "Duration"
//                                       }
//                                       type="number"
//                                       value={productState.duration}
//                                     />
//                                   ) : null}
//                                 </div>
//                               ) : null}
//                             </div>
//                           </label>
//                         </article>
//                       );
//                     })}
//                   </div>

//                   <button
//                     className="inline-flex h-11 items-center justify-center rounded-full bg-[linear-gradient(135deg,#173f73,#214f86)] px-5 text-sm font-semibold text-white shadow-[0_16px_28px_rgba(23,63,115,0.2)] transition hover:brightness-105"
//                     onClick={() => void handleBundleContinue()}
//                     type="button"
//                   >
//                     Continue with selected services
//                   </button>
//                 </div>
//               ) : null}

//               {step === "confirm" || step === "complete" ? (
//                 <div className="space-y-4">
//                   <div className="rounded-[1.4rem] border border-[#d8dfde] bg-[#fbfaf7] p-4">
//                     <div className="space-y-2 text-sm text-zinc-600">
//                       <p>
//                         <span className="font-semibold text-zinc-900">Category:</span>{" "}
//                         {currentCategory?.name}
//                       </p>
//                       <p>
//                         <span className="font-semibold text-zinc-900">Event type:</span>{" "}
//                         {selectedEventType?.name}
//                       </p>
//                       <p>
//                         <span className="font-semibold text-zinc-900">Budget:</span>{" "}
//                         {getBudgetLabel(budgetTier)}
//                       </p>
//                       <p>
//                         <span className="font-semibold text-zinc-900">Notes:</span>{" "}
//                         {notes || "No additional notes"}
//                       </p>
//                       <p className="pt-2 text-base font-semibold text-[#1d2d44]">
//                         Estimated total: Rs. {estimatedTotals.minimum} - Rs.{" "}
//                         {estimatedTotals.maximum}
//                       </p>
//                     </div>
//                   </div>

//                   {step === "confirm" ? (
//                     <button
//                       className="inline-flex h-11 items-center justify-center rounded-full bg-[linear-gradient(135deg,#173f73,#214f86)] px-5 text-sm font-semibold text-white shadow-[0_16px_28px_rgba(23,63,115,0.2)] transition hover:brightness-105 disabled:cursor-not-allowed disabled:bg-zinc-300 disabled:shadow-none"
//                       disabled={isSubmitting}
//                       onClick={() => void handleSubmitQuotation()}
//                       type="button"
//                     >
//                       {isSubmitting ? "Submitting request..." : "Submit quotation request"}
//                     </button>
//                   ) : null}
//                 </div>
//               ) : null}
//             </div>
//           </div>
//         </div>
//       </div>
//     </section>
//   );
// }


"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  appendChatMessageRecord,
  createChatSessionRecord,
  getOrCreateChatSessionIdentity,
  updateChatSessionStatus,
} from "@/lib/chat-session";
import type {
  ChatMessageType,
  ChatStep as PersistedChatStep,
} from "@/lib/chat";

type ChatMessage = {
  id: string;
  sender: "bot" | "user";
  text: string;
};

type ChatIdentity = {
  isNewSession: boolean;
  sessionId: string;
  visitorId: string;
};

type ChatAssistantApiResponse = {
  reply?: string;
  error?: string;
  details?: string;
};

type QuotationChatbotProps = {
  initialCategoryId?: string;
  initialProductId?: string;
  onClose?: () => void;
  variant?: "page" | "widget";
};

const ASSISTANT_CONFIG_ID = "tentwala_quotation_bot_v1";
const KNOWLEDGE_BASE_ID = "tentwala_quotation_kb_v1";
const MAX_HISTORY_MESSAGES = 20;

/**
 * The existing chat-session schema currently expects a quotation step.
 * This value is persisted only for backward compatibility. It does not
 * control the conversation or the UI in this natural-chat version.
 */
const LEGACY_PERSISTED_STEP: PersistedChatStep = "name";

const WELCOME_MESSAGE =
  "Welcome to TentWala. Tell me about the event you are planning or any service you need.";

function createInitialMessages(): ChatMessage[] {
  return [
    {
      id: "welcome",
      sender: "bot",
      text: WELCOME_MESSAGE,
    },
  ];
}

function makeMessage(sender: ChatMessage["sender"], text: string): ChatMessage {
  return {
    id: `${sender}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    sender,
    text,
  };
}

function mapPersistedRoleToSender(
  role: "user" | "assistant" | "system"
): ChatMessage["sender"] {
  return role === "user" ? "user" : "bot";
}

function isTranscriptLikeAssistantText(text: string): boolean {
  return /^(user|assistant|system|developer)\s*:/i.test(text.trim());
}

function sanitizeReply(value: unknown): string {
  if (typeof value !== "string") {
    return "";
  }

  const reply = value.trim();

  if (!reply || isTranscriptLikeAssistantText(reply)) {
    return "";
  }

  return reply;
}

export function QuotationChatbot({
  initialCategoryId = "",
  initialProductId = "",
  onClose,
  variant = "page",
}: QuotationChatbotProps) {
  /**
   * These props are retained so existing callers do not break. Catalogue and
   * product selection will be reintroduced later as contextual UI/actions.
   */
  void initialCategoryId;
  void initialProductId;

  const [messages, setMessages] = useState<ChatMessage[]>(createInitialMessages);
  const [textInput, setTextInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState("");
  const [chatIdentity, setChatIdentity] = useState<ChatIdentity | null>(() =>
    getOrCreateChatSessionIdentity()
  );

  const hasHydratedMessages = useRef(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const appendMessage = useCallback(
    async (
      sender: ChatMessage["sender"],
      text: string,
      messageType: ChatMessageType = "text"
    ): Promise<string> => {
      const cleanedText = text.trim();

      if (!cleanedText) {
        return "";
      }

      if (sender === "bot" && isTranscriptLikeAssistantText(cleanedText)) {
        console.warn("Skipping malformed assistant message:", cleanedText);
        return "";
      }

      const nextMessage = makeMessage(sender, cleanedText);

      setMessages((current) => [...current, nextMessage]);

      if (!chatIdentity) {
        return nextMessage.id;
      }

      try {
        await appendChatMessageRecord({
          messageId: nextMessage.id,
          messageType,
          role: sender === "user" ? "user" : "assistant",
          sessionId: chatIdentity.sessionId,
          step: LEGACY_PERSISTED_STEP,
          text: cleanedText,
          visitorId: chatIdentity.visitorId,
        });
      } catch (appendError) {
        console.error("Could not persist chat message:", appendError);
      }

      return nextMessage.id;
    },
    [chatIdentity]
  );

  function resetLocalChatState() {
    setMessages(createInitialMessages());
    setTextInput("");
    setIsSending(false);
    setError("");
  }

  async function restartChat() {
    if (chatIdentity) {
      try {
        await updateChatSessionStatus(chatIdentity.sessionId, "abandoned");
      } catch (statusError) {
        console.error("Could not abandon previous chat session:", statusError);
      }
    }

    resetLocalChatState();
    hasHydratedMessages.current = false;

    const nextIdentity = getOrCreateChatSessionIdentity();
    setChatIdentity(nextIdentity);
  }

  /**
   * Create or initialise the persisted chat session. We keep the legacy step
   * only because the existing session schema expects it; it does not drive UI.
   */
  useEffect(() => {
    if (!chatIdentity) {
      return;
    }

    const currentPath =
      typeof window !== "undefined" ? window.location.pathname : "";

    void createChatSessionRecord({
      assistantConfigId: ASSISTANT_CONFIG_ID,
      currentStep: LEGACY_PERSISTED_STEP,
      knowledgeBaseId: KNOWLEDGE_BASE_ID,
      landingPage: currentPath,
      sessionId: chatIdentity.sessionId,
      visitorId: chatIdentity.visitorId,
    }).catch((sessionError) => {
      console.error("Could not create chat session:", sessionError);
    });
  }, [chatIdentity]);

  /**
   * Hydrate the conversation from Firestore and keep it live across tabs.
   */
  useEffect(() => {
    if (!chatIdentity) {
      return;
    }

    const messagesQuery = query(
      collection(db, "chat_sessions", chatIdentity.sessionId, "messages"),
      orderBy("created_at", "asc")
    );

    const unsubscribe = onSnapshot(
      messagesQuery,
      (snapshot) => {
        if (snapshot.empty) {
          if (!hasHydratedMessages.current) {
            hasHydratedMessages.current = true;
            setMessages(createInitialMessages());

            if (chatIdentity.isNewSession) {
              const welcomeMessageId = `welcome-${chatIdentity.sessionId}`;

              void appendChatMessageRecord({
                messageId: welcomeMessageId,
                messageType: "summary",
                role: "assistant",
                sessionId: chatIdentity.sessionId,
                step: LEGACY_PERSISTED_STEP,
                text: WELCOME_MESSAGE,
                visitorId: chatIdentity.visitorId,
              }).catch((welcomeError) => {
                console.error("Could not persist welcome message:", welcomeError);
              });
            }
          }

          return;
        }

        const nextMessages = snapshot.docs
          .map((entry) => {
            const data = entry.data();
            const sender = mapPersistedRoleToSender(
              String(data.role ?? "assistant") as
              | "user"
              | "assistant"
              | "system"
            );
            const text = String(data.text ?? "").trim();

            return {
              id: entry.id,
              sender,
              text,
            } satisfies ChatMessage;
          })
          .filter((message) => {
            if (!message.text) {
              return false;
            }

            return !(
              message.sender === "bot" &&
              isTranscriptLikeAssistantText(message.text)
            );
          });

        hasHydratedMessages.current = true;
        setMessages(
          nextMessages.length > 0 ? nextMessages : createInitialMessages()
        );
      },
      (snapshotError) => {
        console.error("Could not hydrate chat messages:", snapshotError);
        setError("Could not load the previous conversation.");
      }
    );

    return unsubscribe;
  }, [chatIdentity]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "end",
    });
  }, [messages, isSending]);

  async function requestAssistantReply({
    userMessage,
    previousMessages,
  }: {
    userMessage: string;
    previousMessages: ChatMessage[];
  }): Promise<ChatAssistantApiResponse> {
    try {
      const response = await fetch("/api/chat-assistant", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          recentMessages: previousMessages
            .filter((message) => {
              return !(
                message.sender === "bot" &&
                isTranscriptLikeAssistantText(message.text)
              );
            })
            .slice(-MAX_HISTORY_MESSAGES)
            .map((message) => ({
              role: message.sender === "user" ? "user" : "assistant",
              text: message.text,
            })),
          userMessage,
        }),
      });

      const payload = (await response
        .json()
        .catch(() => null)) as ChatAssistantApiResponse | null;

      if (!response.ok) {
        console.error(
          "chat-assistant request failed:",
          payload ?? response.statusText
        );

        return {
          error: payload?.error ?? "Unable to get an assistant response.",
          details: payload?.details,
        };
      }

      const reply = sanitizeReply(payload?.reply);

      if (!reply) {
        console.error("Rejected empty or malformed assistant reply:", payload);
        return {
          error: "The assistant returned an invalid response.",
        };
      }

      return { reply };
    } catch (replyError) {
      console.error("chat-assistant request failed:", replyError);
      return {
        error: "Unable to connect to the assistant right now.",
      };
    }
  }

  async function handleTextSubmit(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    const value = textInput.trim();
    setError("");

    if (!value) {
      setError("Please enter a message.");
      return;
    }

    if (isSending) {
      return;
    }

    /**
     * Capture history before adding the current message because userMessage is
     * sent separately to the API and must not be duplicated in recentMessages.
     */
    const previousMessages = messages;

    setTextInput("");
    setIsSending(true);

    await appendMessage("user", value);

    const assistantTurn = await requestAssistantReply({
      userMessage: value,
      previousMessages,
    });

    if (assistantTurn.reply) {
      await appendMessage("bot", assistantTurn.reply);
    } else {
      setError(
        assistantTurn.error ??
        "I could not get a response right now. Please try again."
      );
    }

    setIsSending(false);
  }

  const isWidget = variant === "widget";

  return (
    <section
      className={
        isWidget
          ? "flex h-full min-h-0 flex-col bg-[var(--background)]"
          : "rounded-[2rem] border border-[#d8dfde] bg-white/88 p-5 shadow-[0_24px_60px_rgba(29,45,68,0.08)] backdrop-blur sm:p-7"
      }
    >
      <header
        className={
          isWidget
            ? "relative flex h-[76px] shrink-0 items-center justify-between bg-[#AB9061] px-5 text-white"
            : "mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"
        }
      >
        <div className={isWidget ? "space-y-0" : "space-y-2"}>
          {!isWidget ? (
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#4faebc]">
              TentWala AI Concierge
            </p>
          ) : null}

          <h2
            className={
              isWidget
                ? "font-serif text-[26px] uppercase leading-none text-white"
                : "font-serif text-3xl leading-tight text-[#1d2d44] sm:text-4xl"
            }
          >
            <span className="text-[var(--color-gold)]">TENT</span>WALA
          </h2>

          {!isWidget ? (
            <p className="max-w-3xl text-sm leading-7 text-zinc-600 sm:text-base">
              Describe your event naturally. You can share several details at
              once, ask questions, or request a specific service.
            </p>
          ) : null}
        </div>

        <div className={isWidget ? "flex items-center gap-5" : "flex gap-2"}>
          <button
            className={
              isWidget
                ? "inline-flex h-[32px] min-w-[90px] items-center justify-center rounded-full border border-white bg-transparent px-5 text-sm font-medium text-white transition hover:bg-white/10"
                : "inline-flex h-11 items-center justify-center rounded-full border border-[#1d2d44]/10 bg-white/80 px-5 text-sm font-semibold text-[#1d2d44] transition hover:bg-white"
            }
            disabled={isSending}
            onClick={() => void restartChat()}
            type="button"
          >
            Restart
          </button>

          {onClose ? (
            <button
              aria-label="Close chat"
              className={
                isWidget
                  ? "relative inline-flex h-9 w-9 items-center justify-center text-transparent transition hover:opacity-75 before:absolute before:h-[30px] before:w-0.5 before:rotate-45 before:bg-white after:absolute after:h-[30px] after:w-0.5 after:-rotate-45 after:bg-white"
                  : "inline-flex h-11 items-center justify-center rounded-full border border-[#1d2d44]/10 bg-white/80 px-4 text-sm font-semibold text-[#1d2d44] transition hover:bg-white"
              }
              onClick={onClose}
              type="button"
            >
              {isWidget ? "×" : "Close"}
            </button>
          ) : null}
        </div>
      </header>

      <div
        className={
          isWidget
            ? "flex min-h-0 flex-1 flex-col"
            : "flex min-h-[38rem] flex-col gap-4"
        }
      >
        <div
          className={
            isWidget
              ? "min-h-0 flex-1 overflow-y-auto bg-[var(--background)] px-3 py-5"
              : "min-h-0 flex-1 overflow-y-auto rounded-[1.8rem] border border-white/80 bg-[linear-gradient(180deg,rgba(249,247,243,0.98),rgba(243,238,231,0.92))] p-4 shadow-[0_18px_36px_rgba(29,45,68,0.07)] sm:p-5"
          }
        >
          <div className={isWidget ? "space-y-3" : "space-y-4"}>
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.sender === "user" ? "justify-end" : "justify-start"
                  }`}
              >
                <div className={isWidget ? "max-w-[92%]" : "max-w-[90%] space-y-1"}>
                  {!isWidget ? (
                    <p
                      className={`px-1 text-[11px] font-semibold uppercase tracking-[0.16em] ${message.sender === "user"
                          ? "text-right text-[#51617f]"
                          : "text-[#8c7345]"
                        }`}
                    >
                      {message.sender === "user" ? "You" : "TentWala"}
                    </p>
                  ) : null}

                  <div
                    className={`whitespace-pre-wrap px-4 py-3 text-sm leading-6 ${isWidget
                      ? message.sender === "user"
                        ? "rounded-[19px] bg-[#b49a68] text-white"
                        : "rounded-[20px] border border-[var(--color-gold)] bg-transparent text-[#b49a68]"
                      : message.sender === "user"
                        ? "rounded-[1.4rem] bg-[linear-gradient(135deg,#243f78,#2c4f91)] text-white shadow-[0_16px_28px_rgba(36,63,120,0.24)] sm:text-[0.96rem]"
                        : "rounded-[1.4rem] border border-[#e7e0d4] bg-[linear-gradient(180deg,#ffffff,#fbf7f0)] text-[#2f3f67] shadow-[0_12px_28px_rgba(29,45,68,0.06)] sm:text-[0.96rem]"
                      }`}
                  >
                    {message.text}
                  </div>
                </div>
              </div>
            ))}

            {isSending ? (
              <div className="flex justify-start">
                <div className="rounded-[20px] border border-[var(--color-gold)] bg-transparent px-4 py-3 text-sm text-[#b49a68]">
                  TentWala is thinking…
                </div>
              </div>
            ) : null}

            {error ? (
              <div className="rounded-[1.25rem] bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            ) : null}

            <div ref={messagesEndRef} />
          </div>
        </div>

        <form
          className={
            isWidget
              ? "border-t border-[#ead9bb] bg-[var(--background)] p-4"
              : "rounded-[1.8rem] border border-white/80 bg-white/92 p-4 shadow-[0_18px_40px_rgba(29,45,68,0.06)]"
          }
          onSubmit={(event) => void handleTextSubmit(event)}
        >
          <div className={isWidget ? "flex items-center gap-[11px]" : "flex items-end gap-3"}>
            <textarea
              aria-label="Chat message"
              className={
                isWidget
                  ? "h-[47px] max-h-[47px] w-[min(100%,370px)] flex-1 resize-none rounded-[10px] border border-[var(--color-gold)] bg-transparent px-4 py-[13px] text-sm leading-5 text-black outline-none transition placeholder:text-[#a7a3a0] focus:border-[#a78e5f] disabled:cursor-not-allowed disabled:opacity-70"
                  : "max-h-36 min-h-12 flex-1 resize-none rounded-[1.35rem] border border-[#d9d6d0] bg-white px-4 py-3 text-sm leading-6 text-[#1d2d44] outline-none transition placeholder:text-zinc-400 focus:border-[#243f78] disabled:cursor-not-allowed disabled:bg-zinc-50"
              }
              disabled={isSending}
              onChange={(event) => setTextInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  event.currentTarget.form?.requestSubmit();
                }
              }}
              placeholder={
                isWidget
                  ? "Type your answer here..."
                  : "Tell us about your event or ask a question"
              }
              rows={1}
              value={textInput}
            />

            <button
              className={
                isWidget
                  ? "relative inline-flex h-[47px] w-[47px] shrink-0 items-center justify-center rounded-[12px] bg-[#b49a68] text-transparent transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60 before:absolute before:h-0.5 before:w-3 before:bg-white after:absolute after:h-2 after:w-2 after:rotate-45 after:border-r-2 after:border-t-2 after:border-white after:content-['']"
                  : "inline-flex h-12 min-w-20 items-center justify-center rounded-full bg-[linear-gradient(135deg,#243f78,#2c4f91)] px-5 text-sm font-semibold text-white shadow-[0_16px_28px_rgba(36,63,120,0.2)] transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60"
              }
              disabled={isSending || !textInput.trim()}
              type="submit"
            >
              {isWidget ? "→" : isSending ? "Sending" : "Send"}
            </button>
          </div>

          <p className={isWidget ? "sr-only" : "mt-2 px-1 text-xs leading-5 text-zinc-500"}>
            Press Enter to send. Use Shift + Enter for a new line.
          </p>
        </form>
      </div>
    </section>
  );
}
