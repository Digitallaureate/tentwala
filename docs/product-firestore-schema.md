# Product Firestore Schema

This project uses a layered product model inside the `products` collection.

## Collection

`products/{product_id}`

## Common fields for every product document

```ts
{
  id: string;
  code: string;
  name: string;
  slug: string;
  layer: 1 | 2 | 3;
  node_type: "l1_item" | "bundle" | "event_type";
  item_type: "l1_item" | "bundle" | "event_type";
  category_ids: string[];
  short_description: string;
  description: string;
  pricing_model: string;
  service_group?: string;
  source?: "in_house" | "vendor" | "coordination" | "referral_only";

  thumbnail_url: string;
  banner_url: string;
  image_urls: string[];

  price_tiers: {
    low: {
      label: "Basic";
      minimum_price: number;
      maximum_price: number;
    };
    medium: {
      label: "Standard";
      minimum_price: number;
      maximum_price: number;
    };
    high: {
      label: "Premium";
      minimum_price: number;
      maximum_price: number;
    };
  };

  quotation_config: {
    quotation_enabled: boolean;
    quantity_required: boolean;
    duration_required: boolean;
    manual_review_required: boolean;
    quantity_label?: string;
    quantity_unit?: string;
    minimum_quantity?: number;
    duration_label?: string;
    duration_unit?: string;
    minimum_duration?: number;
  };

  search_tags: string[];
  search_text: string;
  is_featured: boolean;
  is_active: boolean;
  sort_order: number;
  exposure: "shown" | "rolled_up" | "internal" | "excluded" | "on_request";
  customer_selectable: boolean;
  quotation_enabled: boolean;

  component_product_ids?: string[];
  core_product_ids?: string[];
  optional_product_ids?: string[];

  service_highlights?: string[];
  included_items?: string[];
  ideal_for?: string[];
  pricing_notes?: string[];
  faq?: Array<{
    question: string;
    answer: string;
  }>;
  terms_and_conditions?: string[];
  availability_note?: string;

  created_at: Timestamp;
  updated_at: Timestamp;
}
```

## Layer meaning

- `layer: 1` and `node_type: "l1_item"`: base service/product item
- `layer: 2` and `node_type: "bundle"`: bundle made from linked L1 items
- `layer: 3` and `node_type: "event_type"`: event flow made from linked bundles

## Relationship fields

### L1 item

No relationship field is required.

### Bundle

```ts
component_product_ids: string[]
```

This stores the linked L1 product IDs.

### Event type

```ts
core_product_ids: string[]
optional_product_ids: string[]
```

These store the linked bundle IDs.

## Current placeholder pricing

Until final commercial pricing is ready, every product is seeded with:

```ts
price_tiers.low.minimum_price = 1
price_tiers.low.maximum_price = 1

price_tiers.medium.minimum_price = 3
price_tiers.medium.maximum_price = 3

price_tiers.high.minimum_price = 5
price_tiers.high.maximum_price = 5
```

## Current media placeholders

Until actual media is uploaded, every product should still include:

```ts
thumbnail_url: ""
banner_url: ""
image_urls: []
```

## Quotation config rules

The quotation form uses `quotation_config` to know what input to ask from the user.

Examples:

- area-based bundle: ask for `quantity` in `sq_ft`
- guest-based bundle: ask for `quantity` in guests
- power package: ask for `quantity` in `kva` and `duration` in days
- event type: no direct quantity or duration input

## Re-upload flow

To refresh the Firestore collection with the latest schema:

1. Open the Firestore utility page in the app.
2. Click `Upload products`.
3. This uses `setDoc()` with fixed document IDs, so existing product docs are overwritten with the latest schema shape.

## Important note

If a product document was uploaded before this schema update, it may be missing:

- `thumbnail_url`
- `banner_url`
- `image_urls`
- `price_tiers`
- `quotation_config`

Re-uploading products fixes that.
