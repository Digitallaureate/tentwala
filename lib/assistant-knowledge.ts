export type KnowledgeBaseStatus = "draft" | "published" | "archived";

export type KnowledgeChunkType =
  | "company_profile"
  | "service_guide"
  | "quotation_guide"
  | "pricing_policy"
  | "service_policy"
  | "venue_guide"
  | "faq";

export interface AssistantKnowledgeBase {
  id: string;
  name: string;
  slug: string;
  assistantType: "quotation_bot";
  description: string;
  language: "en";
  version: number;
  tags: string[];
  status: KnowledgeBaseStatus;
  active: boolean;
}

export interface AssistantKnowledgeChunk {
  id: string;
  knowledgeBaseId: string;
  type: KnowledgeChunkType;
  audience: "customer";
  title: string;
  summary: string;
  content: string;
  relatedCategoryIds: string[];
  relatedProductIds: string[];
  tags: string[];
  priority: number;
  language: "en";
  requiresHumanConfirmation: boolean;
  version: number;
  status: KnowledgeBaseStatus;
  active: boolean;
}

const knowledgeBaseId = "tentwala_quotation_kb_v1";
const chunkId = (slug: string) => `${knowledgeBaseId}__${slug}`;

// NOTE:
// Use real Firestore category document IDs here if they differ from the slugs below.
const relatedCategoryIds = {
  corporateInstitutional: "corporate-institutional",
  familyFriendsGatherings: "family-friends-gatherings",
  religiousDomesticCeremonies: "religious-domestic-ceremonies",
  weddingFunctions: "wedding-functions",
} as const;

export const tentwalaKnowledgeBase: AssistantKnowledgeBase = {
  id: knowledgeBaseId,
  name: "TentWala Quotation Knowledge Base",
  slug: "tentwala-quotation-kb-v1",
  assistantType: "quotation_bot",
  description:
    "Customer-facing business, service, quotation, venue and policy knowledge for the TentWala quotation assistant.",
  language: "en",
  version: 1,
  tags: ["tentwala", "quotation", "event-services", "customer-support"],
  status: "published",
  active: true,
};

export const tentwalaKnowledgeChunks: AssistantKnowledgeChunk[] = [
  {
    id: chunkId("about-tentwala"),
    knowledgeBaseId,
    type: "company_profile",
    audience: "customer",
    title: "About TentWala",
    summary:
      "Introduces TentWala and the types of event support it provides.",
    content:
      "TentWala helps customers explore and arrange services for wedding functions, family and friends gatherings, corporate and institutional events, and religious or domestic ceremonies. Customers can select an event type, review recommended service bundles and optional add-ons, provide event details, and request an estimated quotation.",
    relatedCategoryIds: [],
    relatedProductIds: [],
    tags: ["tentwala", "about", "company", "event-services"],
    priority: 10,
    language: "en",
    requiresHumanConfirmation: false,
    version: 1,
    status: "published",
    active: true,
  },
  {
    id: chunkId("service-area-gurgaon"),
    knowledgeBaseId,
    type: "company_profile",
    audience: "customer",
    title: "TentWala Service Area",
    summary: "Explains TentWala's primary operating area.",
    content:
      "TentWala primarily provides event services within Gurgaon. Event location is collected during the quotation process so that serviceability, transportation, logistics, venue access and setup requirements can be reviewed. Requirements outside the regular service area may require manual confirmation.",
    relatedCategoryIds: [],
    relatedProductIds: [],
    tags: ["service-area", "gurgaon", "location", "transport", "serviceability"],
    priority: 9,
    language: "en",
    requiresHumanConfirmation: true,
    version: 1,
    status: "published",
    active: true,
  },
  {
    id: chunkId("services-overview"),
    knowledgeBaseId,
    type: "service_guide",
    audience: "customer",
    title: "TentWala Services Overview",
    summary:
      "Explains the main types of event services available through TentWala.",
    content:
      "TentWala supports event requirements such as tents and canopies, seating and furniture, flooring, stages, basic and premium decoration, generators and power backup, kitchen and dining equipment, event staff, catering, entertainment, photography and videography, baraat arrangements, venue coordination and event-management support. The exact currently available services must always be loaded from the active TentWala product catalogue.",
    relatedCategoryIds: [],
    relatedProductIds: [],
    tags: [
      "services",
      "tent",
      "seating",
      "decoration",
      "catering",
      "photography",
      "venue",
    ],
    priority: 9,
    language: "en",
    requiresHumanConfirmation: false,
    version: 1,
    status: "published",
    active: true,
  },
  {
    id: chunkId("event-categories-overview"),
    knowledgeBaseId,
    type: "service_guide",
    audience: "customer",
    title: "TentWala Event Categories",
    summary: "Explains the main event categories available in the catalogue.",
    content:
      "TentWala organises events into four main categories: Wedding Functions, Family and Friends Gatherings, Corporate and Institutional events, and Religious or Domestic Ceremonies. The exact event types available under each category must be loaded from the active event-type products connected through category_ids.",
    relatedCategoryIds: [
      relatedCategoryIds.weddingFunctions,
      relatedCategoryIds.familyFriendsGatherings,
      relatedCategoryIds.corporateInstitutional,
      relatedCategoryIds.religiousDomesticCeremonies,
    ],
    relatedProductIds: [],
    tags: ["event-categories", "wedding", "family", "corporate", "religious"],
    priority: 9,
    language: "en",
    requiresHumanConfirmation: false,
    version: 1,
    status: "published",
    active: true,
  },
  {
    id: chunkId("quotation-process"),
    knowledgeBaseId,
    type: "quotation_guide",
    audience: "customer",
    title: "How the TentWala Quotation Process Works",
    summary:
      "Explains how customer requirements are converted into an estimated quotation.",
    content:
      "The customer first selects an event category and event type. The selected event type loads its linked core bundles and optional bundles. Core bundles are normally selected by default, while optional bundles can be added according to the customer's requirement. The customer then provides the information required by the selected products. TentWala's quotation system calculates the estimate from the selected event, bundles, individual items, quantities and event information. Before the quotation request is submitted, the customer should be shown a summary and asked to confirm the collected details.",
    relatedCategoryIds: [],
    relatedProductIds: [],
    tags: ["quotation", "quotation-process", "event-type", "bundles", "estimate"],
    priority: 10,
    language: "en",
    requiresHumanConfirmation: false,
    version: 1,
    status: "published",
    active: true,
  },
  {
    id: chunkId("required-quotation-information"),
    knowledgeBaseId,
    type: "quotation_guide",
    audience: "customer",
    title: "Information Required for a Quotation",
    summary:
      "Explains which event details may be required for quotation calculation.",
    content:
      "Before a quotation request is submitted, the assistant should collect the customer's name, phone number, event location, event category, event type, guest count, budget tier and selected services. Additional inputs may also be required depending on the selected event type, bundles and individual items. Common examples include catering headcount, decoration area, stage area, event duration, number of days, service quantity, venue type, event date and event time. The exact required inputs must be determined from the quotation configuration of the selected products.",
    relatedCategoryIds: [],
    relatedProductIds: [],
    tags: [
      "quotation-inputs",
      "guest-count",
      "budget-tier",
      "duration",
      "venue",
      "event-date",
    ],
    priority: 10,
    language: "en",
    requiresHumanConfirmation: false,
    version: 1,
    status: "published",
    active: true,
  },
  {
    id: chunkId("guest-count-required"),
    knowledgeBaseId,
    type: "quotation_guide",
    audience: "customer",
    title: "Guest Count Is Required",
    summary: "Explains why guest count should be collected in the quotation flow.",
    content:
      "Guest count should be collected during the quotation flow because it affects service suitability, seating requirements, decor scale, catering planning and quotation preparation. The assistant should not skip guest count for event quotations.",
    relatedCategoryIds: [],
    relatedProductIds: [],
    tags: ["guest-count", "quotation", "required-field", "planning"],
    priority: 10,
    language: "en",
    requiresHumanConfirmation: false,
    version: 1,
    status: "published",
    active: true,
  },
  {
    id: chunkId("core-and-optional-bundles"),
    knowledgeBaseId,
    type: "quotation_guide",
    audience: "customer",
    title: "Core Bundles and Optional Add-ons",
    summary: "Explains how recommended bundles and optional add-ons work.",
    content:
      "Each event type may contain recommended core bundles and optional add-ons. Core bundles represent services commonly required for the selected event and are normally selected by default. Optional bundles allow the customer to add services such as catering, premium decoration, entertainment, photography, guest accommodation, baraat arrangements or venue coordination. The exact core and optional bundle relationships must always be loaded from the selected event-type product.",
    relatedCategoryIds: [],
    relatedProductIds: [],
    tags: ["core-bundles", "optional-addons", "service-selection", "event-type"],
    priority: 10,
    language: "en",
    requiresHumanConfirmation: false,
    version: 1,
    status: "published",
    active: true,
  },
  {
    id: chunkId("customer-service-selection"),
    knowledgeBaseId,
    type: "faq",
    audience: "customer",
    title: "Choosing Only the Required Services",
    summary: "Explains whether customers may add or remove services.",
    content:
      "Customers can choose the services they require from the options available in the TentWala catalogue. Recommended core bundles are selected by default for convenience, but the customer may customise the selection where the applicable business and quotation rules allow it. Optional add-ons can be selected separately. The final estimate is calculated from the products that remain selected.",
    relatedCategoryIds: [],
    relatedProductIds: [],
    tags: ["service-selection", "customisation", "core-bundles", "optional-addons"],
    priority: 8,
    language: "en",
    requiresHumanConfirmation: false,
    version: 1,
    status: "published",
    active: true,
  },
  {
    id: chunkId("quantity-and-duration-rules"),
    knowledgeBaseId,
    type: "quotation_guide",
    audience: "customer",
    title: "Quantity and Duration Rules",
    summary:
      "Explains when quantity or duration must be collected for quotation calculation.",
    content:
      "If a selected service or bundle requires quantity or duration, the assistant should collect those values before preparing the final quotation summary. Examples may include number of chairs, number of tables, generator duration, staffing count, catering quantity or service duration.",
    relatedCategoryIds: [],
    relatedProductIds: [],
    tags: ["quantity", "duration", "quotation-rules", "service-selection"],
    priority: 10,
    language: "en",
    requiresHumanConfirmation: false,
    version: 1,
    status: "published",
    active: true,
  },
  {
    id: chunkId("minimum-quantity-and-guest-rules"),
    knowledgeBaseId,
    type: "quotation_guide",
    audience: "customer",
    title: "Minimum Quantity and Guest Rules",
    summary:
      "Explains that some services follow minimum quantity or guest-count requirements.",
    content:
      "Some services or bundles may have minimum quantity, minimum guest count or other requirement rules defined in the system. The assistant should collect the necessary values clearly and rely on the selected product's quotation configuration instead of guessing or inventing limits.",
    relatedCategoryIds: [],
    relatedProductIds: [],
    tags: ["minimum-rule", "guest-count", "quantity", "quotation-config"],
    priority: 10,
    language: "en",
    requiresHumanConfirmation: false,
    version: 1,
    status: "published",
    active: true,
  },
  {
    id: chunkId("estimated-vs-final-quotation"),
    knowledgeBaseId,
    type: "pricing_policy",
    audience: "customer",
    title: "Estimated and Final Quotations",
    summary:
      "Explains why an automatically generated quotation may not be final.",
    content:
      "A quotation generated during the enquiry process is an estimate based on the customer's information and the active TentWala product catalogue. Final price or availability may require review when the enquiry includes vendor-sourced services, custom requirements, unusual venue conditions, incomplete information or products marked for manual review. An estimated quotation is not a confirmed booking or guaranteed final amount.",
    relatedCategoryIds: [],
    relatedProductIds: [],
    tags: ["estimated-quotation", "final-quotation", "manual-review", "pricing"],
    priority: 10,
    language: "en",
    requiresHumanConfirmation: false,
    version: 1,
    status: "published",
    active: true,
  },
  {
    id: chunkId("vendor-service-confirmation"),
    knowledgeBaseId,
    type: "service_policy",
    audience: "customer",
    title: "Vendor-Sourced Service Confirmation",
    summary: "Explains how externally supplied services are confirmed.",
    content:
      "Some services, including catering, premium decoration, entertainment, photography, videography, wedding vehicles and similar arrangements, may be supplied through external vendors. Their availability and final pricing depend on the selected event date, location and vendor availability. These services are not confirmed until the required availability check has been completed.",
    relatedCategoryIds: [],
    relatedProductIds: [],
    tags: [
      "vendor",
      "availability",
      "catering",
      "photography",
      "entertainment",
      "confirmation",
    ],
    priority: 10,
    language: "en",
    requiresHumanConfirmation: true,
    version: 1,
    status: "published",
    active: true,
  },
  {
    id: chunkId("standalone-item-quotation"),
    knowledgeBaseId,
    type: "pricing_policy",
    audience: "customer",
    title: "Standalone Item Quotations",
    summary:
      "Explains quotations for individual items rather than complete event packages.",
    content:
      "Customers may request an individual item or service without selecting a complete event package. Examples include chairs, tables, generators, waiters, photography or entertainment. Standalone quotations are calculated using the selected item's quantity, duration and quotation configuration. Where applicable, service charge, transportation and labour may be displayed separately. The exact amount must always come from the TentWala quotation system.",
    relatedCategoryIds: [],
    relatedProductIds: [],
    tags: ["standalone-item", "individual-service", "quantity", "transport", "labour"],
    priority: 9,
    language: "en",
    requiresHumanConfirmation: false,
    version: 1,
    status: "published",
    active: true,
  },
  {
    id: chunkId("generator-rental-policy"),
    knowledgeBaseId,
    type: "service_policy",
    audience: "customer",
    title: "Generator Rental and Fuel Policy",
    summary:
      "Explains generator rental duration, overtime and fuel responsibility.",
    content:
      "Generator rental is charged on a fixed day-rate basis. One generator day includes up to twelve working hours. Usage beyond twelve hours may be charged separately per additional hour. Generator fuel is not included in the quotation and must be arranged and paid for by the customer.",
    relatedCategoryIds: [],
    relatedProductIds: [],
    tags: ["generator", "fuel", "power-backup", "overtime"],
    priority: 10,
    language: "en",
    requiresHumanConfirmation: false,
    version: 1,
    status: "published",
    active: true,
  },
  {
    id: chunkId("venue-coordination"),
    knowledgeBaseId,
    type: "venue_guide",
    audience: "customer",
    title: "Venue Coordination",
    summary: "Explains the venue types TentWala may help coordinate.",
    content:
      "TentWala may help customers coordinate community halls or community spaces, open grounds, parks, plots and suitable untied farmhouses or gardens. Venue coordination is normally an optional service because many customers already have a venue. Venue availability, rental charges, deposits and local requirements remain subject to confirmation. Banquet halls, vatikas and venues tied to another event-service provider may be handled only on request.",
    relatedCategoryIds: [],
    relatedProductIds: [],
    tags: ["venue", "community-hall", "open-ground", "farmhouse", "venue-coordination"],
    priority: 9,
    language: "en",
    requiresHumanConfirmation: true,
    version: 1,
    status: "published",
    active: true,
  },
  {
    id: chunkId("venue-type-and-setup-requirements"),
    knowledgeBaseId,
    type: "venue_guide",
    audience: "customer",
    title: "Venue Type and Setup Requirements",
    summary: "Explains how venue type affects the required event setup.",
    content:
      "The setup requirement depends on what is already available at the venue. A community hall may already have a covered structure, flooring, a power point and toilets, while an open ground may require a complete setup including shelter, seating, power, water and access planning. A farmhouse or garden commonly requires a near-complete lawn setup. A client-owned venue must be assessed according to what is absent from the site and may require more setup even though no venue rental is charged.",
    relatedCategoryIds: [],
    relatedProductIds: [],
    tags: [
      "venue-type",
      "community-hall",
      "open-ground",
      "farmhouse",
      "client-owned-venue",
      "setup",
    ],
    priority: 9,
    language: "en",
    requiresHumanConfirmation: true,
    version: 1,
    status: "published",
    active: true,
  },
  {
    id: chunkId("customer-responsibilities-and-exclusions"),
    knowledgeBaseId,
    type: "service_policy",
    audience: "customer",
    title: "Customer Responsibilities and Quotation Exclusions",
    summary:
      "Explains important customer responsibilities and normally excluded costs.",
    content:
      "Unless explicitly included in writing, generator fuel must be arranged and paid for by the customer. Venue rental charges, security deposits and charges levied by a venue or society are payable separately. Municipal permissions, police permissions, noise clearances and related statutory fees are the customer's responsibility unless TentWala explicitly agrees to coordinate them. The customer is also responsible for providing clear site access and parking arrangements for loading and unloading. Loss of or damage to rented items during the event may be charged at replacement value.",
    relatedCategoryIds: [],
    relatedProductIds: [],
    tags: [
      "exclusions",
      "customer-responsibility",
      "venue-charges",
      "permissions",
      "generator-fuel",
      "damage",
      "site-access",
    ],
    priority: 10,
    language: "en",
    requiresHumanConfirmation: false,
    version: 1,
    status: "published",
    active: true,
  },
  {
    id: chunkId("custom-and-unlisted-requests"),
    knowledgeBaseId,
    type: "faq",
    audience: "customer",
    title: "Custom and Unlisted Requests",
    summary: "Explains how custom services not found in the catalogue are handled.",
    content:
      "A customer may request a decoration, setup or service that is not currently listed in the TentWala catalogue. The requirement can be captured clearly in the quotation notes and sent for manual review. Its feasibility, availability and pricing must be confirmed by the TentWala team before it is treated as part of a final quotation.",
    relatedCategoryIds: [],
    relatedProductIds: [],
    tags: ["custom-request", "manual-review", "quotation-notes", "unlisted-service"],
    priority: 10,
    language: "en",
    requiresHumanConfirmation: true,
    version: 1,
    status: "published",
    active: true,
  },
];
