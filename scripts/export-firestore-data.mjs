import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { initializeApp } from "firebase/app";
import {
  collection,
  documentId,
  getDocs,
  getFirestore,
  orderBy,
  query,
} from "firebase/firestore";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");

const defaultCollections = [
  "product_categories",
  "category_details",
  "products",
  "quotation_requests",
  "assistant_configs",
  "assistant_knowledge_bases",
  "assistant_knowledge_chunks",
];

function loadEnvFile(fileName) {
  const envPath = path.join(projectRoot, fileName);

  if (!existsSync(envPath)) {
    return;
  }

  const lines = readFileSync(envPath, "utf8").split(/\r?\n/);

  for (const line of lines) {
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    const equalsIndex = trimmed.indexOf("=");

    if (equalsIndex === -1) {
      continue;
    }

    const key = trimmed.slice(0, equalsIndex).trim();
    let value = trimmed.slice(equalsIndex + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

function getArgValue(name) {
  const prefix = `--${name}=`;
  const arg = process.argv.find((entry) => entry.startsWith(prefix));

  return arg ? arg.slice(prefix.length) : "";
}

function getCollectionsToExport() {
  const rawCollections = getArgValue("collections");

  if (!rawCollections) {
    return defaultCollections;
  }

  return rawCollections
    .split(",")
    .map((collectionName) => collectionName.trim())
    .filter(Boolean);
}

function getOutputDirectory() {
  const explicitOutputDir = getArgValue("out");
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");

  return path.resolve(
    projectRoot,
    explicitOutputDir || path.join("firestore-exports", timestamp)
  );
}

function serializeValue(value) {
  if (value === null || value === undefined) {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map(serializeValue);
  }

  if (typeof value !== "object") {
    return value;
  }

  if (typeof value.toDate === "function") {
    return value.toDate().toISOString();
  }

  if (
    typeof value.latitude === "number" &&
    typeof value.longitude === "number"
  ) {
    return {
      latitude: value.latitude,
      longitude: value.longitude,
    };
  }

  if (typeof value.path === "string" && typeof value.id === "string") {
    return {
      id: value.id,
      path: value.path,
    };
  }

  return Object.fromEntries(
    Object.entries(value).map(([key, nestedValue]) => [
      key,
      serializeValue(nestedValue),
    ])
  );
}

function buildFirebaseConfig() {
  const config = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  };

  const missingKeys = Object.entries(config)
    .filter(([, value]) => !value)
    .map(([key]) => key);

  if (missingKeys.length > 0) {
    throw new Error(
      `Missing Firebase environment variables: ${missingKeys.join(", ")}`
    );
  }

  return config;
}

async function exportCollection(db, collectionName) {
  const collectionRef = collection(db, collectionName);
  const snapshot = await getDocs(query(collectionRef, orderBy(documentId())));

  return snapshot.docs.map((docSnapshot) => ({
    id: docSnapshot.id,
    path: docSnapshot.ref.path,
    data: serializeValue(docSnapshot.data()),
  }));
}

function buildPricingSummary(products) {
  return products.map(({ id, data }) => ({
    id,
    code: data.code ?? "",
    name: data.name ?? "",
    slug: data.slug ?? "",
    layer: data.layer ?? "",
    node_type: data.node_type ?? data.item_type ?? "",
    category_ids: data.category_ids ?? [],
    pricing_model: data.pricing_model ?? "",
    price_tiers: data.price_tiers ?? {},
    quotation_config: data.quotation_config ?? {},
    component_product_ids: data.component_product_ids ?? [],
    core_product_ids: data.core_product_ids ?? [],
    optional_product_ids: data.optional_product_ids ?? [],
    customer_selectable: data.customer_selectable ?? "",
    quotation_enabled: data.quotation_enabled ?? "",
    is_active: data.is_active ?? "",
    is_featured: data.is_featured ?? "",
    sort_order: data.sort_order ?? "",
  }));
}

function getTierValue(priceTiers, tierName, priceName) {
  const value = priceTiers?.[tierName]?.[priceName];

  return typeof value === "number" ? String(value) : "";
}

function escapeCsvValue(value) {
  const stringValue = Array.isArray(value)
    ? value.join("|")
    : String(value ?? "");

  if (/[",\n\r]/.test(stringValue)) {
    return `"${stringValue.replaceAll('"', '""')}"`;
  }

  return stringValue;
}

function buildPricingCsv(summary) {
  const rows = [
    [
      "id",
      "code",
      "name",
      "layer",
      "node_type",
      "pricing_model",
      "low_min",
      "low_max",
      "medium_min",
      "medium_max",
      "high_min",
      "high_max",
      "quantity_required",
      "quantity_label",
      "quantity_unit",
      "minimum_quantity",
      "duration_required",
      "duration_label",
      "duration_unit",
      "minimum_duration",
      "manual_review_required",
      "category_ids",
      "component_product_ids",
      "core_product_ids",
      "optional_product_ids",
      "customer_selectable",
      "quotation_enabled",
      "is_active",
      "is_featured",
      "sort_order",
    ],
    ...summary.map((product) => {
      const config = product.quotation_config ?? {};
      const priceTiers = product.price_tiers ?? {};

      return [
        product.id,
        product.code,
        product.name,
        product.layer,
        product.node_type,
        product.pricing_model,
        getTierValue(priceTiers, "low", "minimum_price"),
        getTierValue(priceTiers, "low", "maximum_price"),
        getTierValue(priceTiers, "medium", "minimum_price"),
        getTierValue(priceTiers, "medium", "maximum_price"),
        getTierValue(priceTiers, "high", "minimum_price"),
        getTierValue(priceTiers, "high", "maximum_price"),
        config.quantity_required,
        config.quantity_label,
        config.quantity_unit,
        config.minimum_quantity,
        config.duration_required,
        config.duration_label,
        config.duration_unit,
        config.minimum_duration,
        config.manual_review_required,
        product.category_ids,
        product.component_product_ids,
        product.core_product_ids,
        product.optional_product_ids,
        product.customer_selectable,
        product.quotation_enabled,
        product.is_active,
        product.is_featured,
        product.sort_order,
      ];
    }),
  ];

  return `${rows
    .map((row) => row.map(escapeCsvValue).join(","))
    .join("\n")}\n`;
}

function buildTeamPricingReviewCsv(summary) {
  return `${buildTeamPricingReviewRows(summary)
    .map((row) => row.map(escapeCsvValue).join(","))
    .join("\n")}\n`;
}

function buildTeamPricingReviewRows(summary) {
  return [
    [
      "id_do_not_change",
      "code",
      "product_name",
      "layer",
      "node_type",
      "service_group",
      "current_pricing_model",
      "current_basic_min",
      "current_basic_max",
      "current_standard_min",
      "current_standard_max",
      "current_premium_min",
      "current_premium_max",
      "current_quantity_required",
      "current_quantity_label",
      "current_quantity_unit",
      "current_minimum_quantity",
      "current_duration_required",
      "current_duration_label",
      "current_duration_unit",
      "current_minimum_duration",
      "current_manual_review_required",
      "category_ids",
      "component_product_ids",
      "core_product_ids",
      "optional_product_ids",
      "team_correct_pricing_model",
      "team_correct_basic_min",
      "team_correct_basic_max",
      "team_correct_standard_min",
      "team_correct_standard_max",
      "team_correct_premium_min",
      "team_correct_premium_max",
      "team_quantity_required",
      "team_quantity_label",
      "team_quantity_unit",
      "team_minimum_quantity",
      "team_duration_required",
      "team_duration_label",
      "team_duration_unit",
      "team_minimum_duration",
      "team_manual_review_required",
      "team_extra_rule_or_method_notes",
    ],
    ...summary.map((product) => {
      const config = product.quotation_config ?? {};
      const priceTiers = product.price_tiers ?? {};

      return [
        product.id,
        product.code,
        product.name,
        product.layer,
        product.node_type,
        product.service_group,
        product.pricing_model,
        getTierValue(priceTiers, "low", "minimum_price"),
        getTierValue(priceTiers, "low", "maximum_price"),
        getTierValue(priceTiers, "medium", "minimum_price"),
        getTierValue(priceTiers, "medium", "maximum_price"),
        getTierValue(priceTiers, "high", "minimum_price"),
        getTierValue(priceTiers, "high", "maximum_price"),
        config.quantity_required,
        config.quantity_label,
        config.quantity_unit,
        config.minimum_quantity,
        config.duration_required,
        config.duration_label,
        config.duration_unit,
        config.minimum_duration,
        config.manual_review_required,
        product.category_ids,
        product.component_product_ids,
        product.core_product_ids,
        product.optional_product_ids,
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
      ];
    }),
  ];
}

function escapeExcelXmlValue(value) {
  const stringValue = Array.isArray(value)
    ? value.join("|")
    : String(value ?? "");

  return stringValue
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function getExcelCellType(value) {
  if (typeof value === "number") {
    return "Number";
  }

  const stringValue = String(value ?? "");

  return stringValue !== "" && Number.isFinite(Number(stringValue))
    ? "Number"
    : "String";
}

function buildExcelXmlWorkbook(sheetName, rows) {
  const worksheetRows = rows
    .map((row) => {
      const cells = row
        .map((value) => {
          const cellType = getExcelCellType(value);

          return `<Cell><Data ss:Type="${cellType}">${escapeExcelXmlValue(
            value
          )}</Data></Cell>`;
        })
        .join("");

      return `<Row>${cells}</Row>`;
    })
    .join("");

  return `<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:html="http://www.w3.org/TR/REC-html40">
 <DocumentProperties xmlns="urn:schemas-microsoft-com:office:office">
  <Author>TentWala export script</Author>
  <Created>${new Date().toISOString()}</Created>
 </DocumentProperties>
 <Styles>
  <Style ss:ID="Default" ss:Name="Normal">
   <Alignment ss:Vertical="Top"/>
   <Font ss:FontName="Calibri" ss:Size="11"/>
  </Style>
 </Styles>
 <Worksheet ss:Name="${escapeExcelXmlValue(sheetName)}">
  <Table>${worksheetRows}</Table>
 </Worksheet>
</Workbook>
`;
}

function writeJson(filePath, value) {
  writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

async function main() {
  loadEnvFile(".env.local");
  loadEnvFile(".env");

  const collectionsToExport = getCollectionsToExport();
  const outputDirectory = getOutputDirectory();

  mkdirSync(outputDirectory, { recursive: true });

  const app = initializeApp(buildFirebaseConfig());
  const db = getFirestore(app);
  const manifest = {
    exported_at: new Date().toISOString(),
    project_id: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    collections: {},
  };

  for (const collectionName of collectionsToExport) {
    console.log(`Exporting ${collectionName}...`);

    const docs = await exportCollection(db, collectionName);
    const outputPath = path.join(outputDirectory, `${collectionName}.json`);

    writeJson(outputPath, docs);

    manifest.collections[collectionName] = {
      count: docs.length,
      file: `${collectionName}.json`,
    };

    if (collectionName === "products") {
      const pricingSummary = buildPricingSummary(docs);

      writeJson(
        path.join(outputDirectory, "products-pricing-summary.json"),
        pricingSummary
      );
      writeFileSync(
        path.join(outputDirectory, "products-pricing-summary.csv"),
        buildPricingCsv(pricingSummary),
        "utf8"
      );
      writeFileSync(
        path.join(outputDirectory, "products-team-pricing-review.csv"),
        buildTeamPricingReviewCsv(pricingSummary),
        "utf8"
      );
      writeFileSync(
        path.join(outputDirectory, "products-team-pricing-review.xls"),
        buildExcelXmlWorkbook(
          "Products Pricing Review",
          buildTeamPricingReviewRows(pricingSummary)
        ),
        "utf8"
      );
    }
  }

  writeJson(path.join(outputDirectory, "manifest.json"), manifest);

  if (
    collectionsToExport.length > 0 &&
    Object.values(manifest.collections).every((entry) => entry.count === 0)
  ) {
    throw new Error(
      "Exported zero documents from every collection. Check Firestore rules, network access, and Firebase project configuration."
    );
  }

  console.log("");
  console.log(`Firestore export complete: ${outputDirectory}`);
  console.log(
    "Open products-pricing-summary.json first to review pricing and quotation setup."
  );
}

main().catch((error) => {
  console.error("Firestore export failed.");
  console.error(error);
  process.exitCode = 1;
});
