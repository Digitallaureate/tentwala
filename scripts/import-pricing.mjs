// Imports the filled products-pricing-summary.csv into the Firestore `products`
// collection.
//
//   npm run import:pricing                 -> dry run (prints changes, writes nothing)
//   npm run import:pricing -- --apply      -> writes the changes (after saving a backup)
//
// Options:
//   --file=<path>      CSV to read (default: the products-only-pricing-review export)
//   --include-flags    also import customer_selectable, quotation_enabled,
//                      is_active, is_featured and sort_order (skipped by default,
//                      because they change what the site shows and in what order)
//
// Imported by default: pricing_model, price_tiers, quotation_config.

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { initializeApp } from "firebase/app";
import {
  collection,
  doc,
  getDocs,
  getFirestore,
  writeBatch,
} from "firebase/firestore";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");

const defaultFile = path.join(
  projectRoot,
  "firestore-exports",
  "products-only-pricing-review",
  "products-pricing-summary.csv"
);

const tierColumns = [
  { key: "low", label: "Utsav" },
  { key: "medium", label: "Bhavya" },
  { key: "high", label: "Shaahi" },
];

const flagColumns = [
  { column: "customer_selectable", field: "customer_selectable", type: "boolean" },
  { column: "quotation_enabled", field: "quotation_enabled", type: "boolean" },
  { column: "is_active", field: "is_active", type: "boolean" },
  { column: "is_featured", field: "is_featured", type: "boolean" },
  { column: "sort_order", field: "sort_order", type: "number" },
];

function loadEnvFile(fileName) {
  const envPath = path.join(projectRoot, fileName);

  if (!existsSync(envPath)) {
    return;
  }

  for (const line of readFileSync(envPath, "utf8").split(/\r?\n/)) {
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

// Minimal CSV reader: quoted fields, escaped quotes, CRLF, UTF-8 BOM.
function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;
  const source = text.replace(/^﻿/, "");

  for (let index = 0; index < source.length; index += 1) {
    const char = source[index];

    if (inQuotes) {
      if (char === '"' && source[index + 1] === '"') {
        field += '"';
        index += 1;
      } else if (char === '"') {
        inQuotes = false;
      } else {
        field += char;
      }
    } else if (char === '"') {
      inQuotes = true;
    } else if (char === ",") {
      row.push(field);
      field = "";
    } else if (char === "\n" || char === "\r") {
      if (char === "\r" && source[index + 1] === "\n") {
        index += 1;
      }

      row.push(field);
      field = "";

      if (row.some((cell) => cell !== "")) {
        rows.push(row);
      }

      row = [];
    } else {
      field += char;
    }
  }

  if (field !== "" || row.length > 0) {
    row.push(field);

    if (row.some((cell) => cell !== "")) {
      rows.push(row);
    }
  }

  const [header, ...body] = rows;

  return body.map((cells) =>
    Object.fromEntries(
      header.map((name, index) => [name.trim(), (cells[index] ?? "").trim()])
    )
  );
}

function parseNumber(value, problems, label) {
  if (value === "") {
    return undefined;
  }

  const parsed = Number(value.replace(/,/g, ""));

  if (!Number.isFinite(parsed) || parsed < 0) {
    problems.push(`${label} is not a valid number: "${value}"`);
    return undefined;
  }

  return parsed;
}

function parseBoolean(value, problems, label) {
  const normalized = value.toLowerCase();

  if (normalized === "true") {
    return true;
  }

  if (normalized === "false") {
    return false;
  }

  problems.push(`${label} must be TRUE or FALSE: "${value}"`);
  return undefined;
}

// Builds the new price_tiers from the row. Returns `null` when every price cell
// is blank (an "on request" product), meaning "no listed prices".
function buildPriceTiers(row, existing, problems, warnings) {
  const tiers = {};
  let filledCells = 0;

  for (const { key, label } of tierColumns) {
    const minimum = parseNumber(row[`${key}_min`], problems, `${key}_min`);
    const maximum = parseNumber(row[`${key}_max`], problems, `${key}_max`);

    filledCells += [minimum, maximum].filter((value) => value !== undefined).length;

    if (minimum === undefined && maximum === undefined) {
      continue;
    }

    if (minimum === undefined || maximum === undefined) {
      problems.push(`${key}: both min and max are needed`);
      continue;
    }

    if (minimum > maximum) {
      problems.push(`${key}: min ${minimum} is higher than max ${maximum}`);
      continue;
    }

    tiers[key] = {
      label,
      minimum_price: minimum,
      maximum_price: maximum,
    };
  }

  if (filledCells === 0) {
    return null;
  }

  if (tiers.low && tiers.medium && tiers.low.minimum_price > tiers.medium.minimum_price) {
    warnings.push("Utsav starts higher than Bhavya");
  }

  if (tiers.medium && tiers.high && tiers.medium.minimum_price > tiers.high.minimum_price) {
    warnings.push("Bhavya starts higher than Shaahi");
  }

  return tiers;
}

function buildQuotationConfig(row, existing, problems) {
  const config = { ...(existing ?? {}) };

  for (const [column, field] of [
    ["quantity_required", "quantity_required"],
    ["duration_required", "duration_required"],
    ["manual_review_required", "manual_review_required"],
  ]) {
    const value = parseBoolean(row[column], problems, column);

    if (value !== undefined) {
      config[field] = value;
    }
  }

  for (const [column, type] of [
    ["quantity_label", "text"],
    ["quantity_unit", "text"],
    ["minimum_quantity", "number"],
    ["duration_label", "text"],
    ["duration_unit", "text"],
    ["minimum_duration", "number"],
  ]) {
    const raw = row[column];

    if (raw === "") {
      delete config[column];
    } else if (type === "number") {
      const value = parseNumber(raw, problems, column);

      if (value !== undefined) {
        config[column] = value;
      }
    } else {
      config[column] = raw;
    }
  }

  return config;
}

// Key-order independent comparison.
function canonical(value) {
  if (Array.isArray(value)) {
    return value.map(canonical);
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.keys(value)
        .sort()
        .map((key) => [key, canonical(value[key])])
    );
  }

  return value;
}

function isSame(a, b) {
  return JSON.stringify(canonical(a ?? null)) === JSON.stringify(canonical(b ?? null));
}

function describeTiers(tiers) {
  if (!tiers || Object.keys(tiers).length === 0) {
    return "(no prices)";
  }

  return tierColumns
    .map(({ key }) =>
      tiers[key]
        ? `${key} ${tiers[key].minimum_price}-${tiers[key].maximum_price}`
        : null
    )
    .filter(Boolean)
    .join(" | ");
}

async function main() {
  loadEnvFile(".env.local");
  loadEnvFile(".env");

  const shouldApply = process.argv.includes("--apply");
  const includeFlags = process.argv.includes("--include-flags");
  const filePath = getArgValue("file") || defaultFile;

  if (!existsSync(filePath)) {
    throw new Error(`CSV file not found: ${filePath}`);
  }

  const rows = parseCsv(readFileSync(filePath, "utf8"));

  console.log(`Reading ${rows.length} rows from ${filePath}`);
  console.log(
    shouldApply
      ? "MODE: APPLY (changes will be written to Firestore)"
      : "MODE: dry run (nothing will be written; add --apply to write)"
  );
  console.log(
    includeFlags
      ? "Including flags: customer_selectable, quotation_enabled, is_active, is_featured, sort_order"
      : "Skipping flags (use --include-flags to import them)"
  );
  console.log("");

  const app = initializeApp(buildFirebaseConfig());
  const db = getFirestore(app);
  const snapshot = await getDocs(collection(db, "products"));
  const existingById = new Map(snapshot.docs.map((entry) => [entry.id, entry.data()]));

  if (existingById.size === 0) {
    throw new Error(
      "Read zero products from Firestore. Check rules, network access and the project configuration."
    );
  }

  const updates = [];
  const backup = {};
  const rejected = [];
  const missing = [];
  const seenIds = new Set();
  let unchanged = 0;

  for (const row of rows) {
    const id = row.id;
    const problems = [];
    const warnings = [];

    if (!id) {
      rejected.push({ id: "(blank id)", problems: ["row has no id"] });
      continue;
    }

    if (seenIds.has(id)) {
      rejected.push({ id, problems: ["id appears more than once in the file"] });
      continue;
    }

    seenIds.add(id);

    const current = existingById.get(id);

    if (!current) {
      missing.push(id);
      continue;
    }

    if (!row.pricing_model) {
      problems.push("pricing_model is blank");
    }

    const parsedTiers = buildPriceTiers(row, current.price_tiers, problems, warnings);
    // Blank price cells mean "on request": clear the old (placeholder) prices so the
    // site shows "On request" and the quotation falls back to manual review.
    const nextTiers = parsedTiers ?? {};
    const nextConfig = buildQuotationConfig(row, current.quotation_config, problems);
    const next = {
      pricing_model: row.pricing_model,
      price_tiers: nextTiers,
      quotation_config: nextConfig,
    };

    if (includeFlags) {
      for (const { column, field, type } of flagColumns) {
        const value =
          type === "boolean"
            ? parseBoolean(row[column], problems, column)
            : parseNumber(row[column], problems, column);

        if (value !== undefined) {
          next[field] = value;
        }
      }
    }

    if (problems.length > 0) {
      rejected.push({ id, problems });
      continue;
    }

    const changedFields = Object.keys(next).filter(
      (field) => !isSame(current[field], next[field])
    );

    if (changedFields.length === 0) {
      unchanged += 1;
      continue;
    }

    const changes = {};
    backup[id] = {};

    for (const field of changedFields) {
      changes[field] = next[field];
      backup[id][field] = current[field] ?? null;
    }

    updates.push({ id, changes, changedFields, current, name: current.name ?? id, warnings });
  }

  for (const update of updates) {
    console.log(`~ ${update.name} (${update.id})`);

    for (const field of update.changedFields) {
      if (field === "price_tiers") {
        console.log(
          `    price_tiers: ${describeTiers(update.current.price_tiers)}  ->  ${describeTiers(update.changes.price_tiers)}`
        );
      } else if (field === "quotation_config") {
        console.log("    quotation_config: updated");
      } else {
        console.log(
          `    ${field}: ${JSON.stringify(update.current[field])}  ->  ${JSON.stringify(update.changes[field])}`
        );
      }
    }

    for (const warning of update.warnings) {
      console.log(`    ! warning: ${warning}`);
    }
  }

  const notInFile = [...existingById.keys()].filter((id) => !seenIds.has(id));

  console.log("");
  console.log("Summary");
  console.log(`  rows in file:            ${rows.length}`);
  console.log(`  will update:             ${updates.length}`);
  console.log(`  already up to date:      ${unchanged}`);
  console.log(`  rejected (fix & rerun):  ${rejected.length}`);
  console.log(`  ids not found in Firestore: ${missing.length}`);
  console.log(`  Firestore products not in file (left untouched): ${notInFile.length}`);

  if (rejected.length > 0) {
    console.log("");
    console.log("Rejected rows:");

    for (const entry of rejected) {
      console.log(`  - ${entry.id}: ${entry.problems.join("; ")}`);
    }
  }

  if (missing.length > 0) {
    console.log("");
    console.log(`ids not found in Firestore: ${missing.join(", ")}`);
  }

  if (!shouldApply) {
    console.log("");
    console.log("Dry run only. Review the changes above, then run with --apply.");
    return;
  }

  if (rejected.length > 0) {
    throw new Error(
      "Some rows were rejected. Fix them first (nothing was written), or remove them from the file."
    );
  }

  if (updates.length === 0) {
    console.log("Nothing to update.");
    return;
  }

  const backupDirectory = path.join(projectRoot, "firestore-exports");

  mkdirSync(backupDirectory, { recursive: true });

  const backupPath = path.join(
    backupDirectory,
    `pricing-import-backup-${new Date().toISOString().replace(/[:.]/g, "-")}.json`
  );

  writeFileSync(backupPath, `${JSON.stringify(backup, null, 2)}\n`, "utf8");
  console.log(`Backup of the old values saved: ${backupPath}`);

  const batchSize = 400;

  for (let start = 0; start < updates.length; start += batchSize) {
    const batch = writeBatch(db);

    for (const update of updates.slice(start, start + batchSize)) {
      batch.update(doc(db, "products", update.id), update.changes);
    }

    await batch.commit();
    console.log(`Wrote ${Math.min(start + batchSize, updates.length)} of ${updates.length}`);
  }

  console.log("Import complete.");
}

main().catch((error) => {
  console.error("Pricing import failed.");
  console.error(error);
  process.exitCode = 1;
});
