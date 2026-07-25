# CircuLink — Buyer Sourcing Agent: Complete Technical Handoff & Context Master

[ignoring loop detection]

> **Purpose of this Document:** This master document contains the complete context, architectural design, database schemas, mathematical formulas, tool signatures, file maps, and implementation details for the **Buyer Sourcing Agent** in CircuLink. Use this file to resume work in **OpenCode** or any other environment without losing any detail.

---

## 1. Project Overview & Platform Identity

- **Platform Name:** CircuLink
- **Domain:** Enterprise B2B Industrial Raw Material & Reusable Industrial Waste Procurement Platform (Not retail e-commerce).
- **Core Value Proposition:** Connects manufacturing enterprises sourcing raw materials (metals, plastics, chemicals) with industrial sellers offering manufacturing scrap/byproducts (aluminum scrap, HDPE regrind, steel offcuts) to divert waste and monetize industrial byproducts.
- **Tech Stack:**
  - **Framework:** NitroStack MCP (Model Context Protocol) Server (`@nitrostack/core`, `@nitrostack/cli`)
  - **Database & Event Bus:** Supabase (PostgreSQL with PostGIS geography, Realtime subscriptions)
  - **AI Model:** Gemini 1.5 Flash (via `@google/generative-ai` & `vision.service.ts`)
  - **UI Widgets:** React / Next.js 15 App Router (`@nitrostack/widgets`)
  - **Language:** TypeScript (ES2022 / NodeNext module resolution)

---

## 2. Directory & File Map

```
c:\Users\admin\OneDrive\Desktop\relink\
├── OPENCODE_CONTEXT.md                <-- THIS HANDOFF FILE
├── package.json                       <-- Dependencies (@nitrostack/core, @supabase/supabase-js, zod, next, react)
├── tsconfig.json                      <-- TS config (rootDir: ./src, outDir: ./dist)
├── nitrostack.json                    <-- NitroStack MCP server configuration
│
├── src/
│   ├── types/
│   │   └── index.ts                   <-- Data models (BOMItem, SupplierScore, SourcingZone, ProcurementPlan, etc.)
│   ├── services/
│   │   ├── geo.utils.ts               <-- Geospatial utilities, Haversine, 15 pre-defined zones, DBSCAN dynamic clustering
│   │   ├── sourcing.service.ts        <-- Core sourcing engine: BOM decomposition, progressive search, weighted scoring, zone intelligence, multi-supplier solver, AI reasoning
│   │   ├── matching.solver.ts         <-- Multi-supplier constraint satisfaction allocation solver
│   │   ├── pricing.service.ts         <-- Market price benchmarks vs virgin material rates
│   │   ├── trust.service.ts           <-- Seller trust scores & verification logic
│   │   ├── vision.service.ts          <-- Gemini LLM chat completion helper
│   │   ├── notification.service.ts    <-- WhatsApp / SMS notification service
│   │   └── supabase.service.ts        <-- Supabase client singleton & fluent mock fallback
│   └── servers/
│       └── sourcing-server/
│           ├── sourcing.module.ts     <-- NitroStack Module definition for sourcing
│           └── sourcing.tools.ts      <-- 8 NitroStack MCP Tools (@Tool decorators + Zod input schemas)
│
└── widgets/                           <-- Next.js React Widget Components
    ├── app/                           <-- Next.js App Router root for widget preview gallery
    │   ├── layout.tsx                 <-- Root layout
    │   └── page.tsx                   <-- Live Preview Gallery (http://localhost:3001)
    ├── bom-visualizer/
    │   └── page.tsx                   <-- Mode 1 BOM Breakdown visual widget
    └── procurement-plan/
        └── page.tsx                   <-- Mode 2 Intelligent Procurement Plan visual widget
```

---

## 3. Mathematical Formulas & Algorithms

### 3.1 Haversine Distance Formula (`src/services/geo.utils.ts`)
```typescript
d = 2 * R * asin( sqrt( sin²(Δlat/2) + cos(lat1) * cos(lat2) * sin²(Δlng/2) ) )
```
Where $R = 6371 \text{ km}$. Used for precise factory-to-buyer distance calculation.

### 3.2 Dynamic Industrial Zone Clustering (`discoverZonesFromFactories`)
Uses DBSCAN spatial clustering with a 15km epsilon radius to group factory locations into geographic clusters, matching against 15 predefined Maharashtra MIDC zones (Chakan, Pimpri, Thane, Bhosari, Tarapur, Talegaon, Ranjangaon, Waluj, Ambad, Kagal, etc.).

### 3.3 Weighted Procurement Score (0–100) (`scoreSupplier`)
For ranking sellers across 6 weighted dimensions:
$$\text{Score} = (S_{\text{dist}} \times 0.20) + (S_{\text{price}} \times 0.25) + (S_{\text{grade}} \times 0.15) + (S_{\text{trust}} \times 0.20) + (S_{\text{qty}} \times 0.10) + (S_{\text{verif}} \times 0.10)$$

Where:
- $S_{\text{dist}} = \max(0, 100 - (\text{dist} / \text{max\_dist}) \times 100)$
- $S_{\text{price}} = \max(0, 100 - (\text{quoted\_price} / \text{max\_price}) \times 100)$
- $S_{\text{grade}} = \text{Grade A (100)}, \text{Grade B (70)}, \text{Grade C (40)}$
- $S_{\text{trust}} = \text{Seller trust score (0--100)}$
- $S_{\text{qty}} = \min(100, (\text{available\_kg} / \text{required\_kg}) \times 100)$
- $S_{\text{verif}} = \text{Verified (100)}, \text{Unverified (30)}$

### 3.4 Progressive Radius Expansion Search (`progressiveRadiusSearch`)
Search expands sequentially: `10km → 25km → 50km → 75km → 100km`.
The search terminates at the **first radius step** where cumulative available material quantity $\ge$ buyer required quantity.

---

## 4. Complete MCP Tool Catalog (8 Tools in `sourcing.tools.ts`)

| Tool Name | Key Inputs | Main Function |
|---|---|---|
| `decompose_product_to_bom` | `product_description` | Uses Gemini LLM to infer raw materials, recyclable substitutes, quantities, and grades. Returns enriched BOM with market benchmarks. |
| `intelligent_source_materials` | `materials[]`, `buyer_lat`, `buyer_lng`, `max_radius_km` | Full procurement pipeline: progressive search → scoring → zone discovery → multi-supplier combination → AI reasoning. |
| `search_materials` | `material_type`, `min_quantity_kg`, `max_price_per_kg`, `buyer_lat`, `buyer_lng` | Filtered search returning listings ranked by 6-dimension procurement score. |
| `recommend_best_place_to_source` | `material_type`, `quantity_kg`, `buyer_lat`, `buyer_lng` | Industrial cluster analysis computing real zone metrics (density, avg price, avg grade, avg trust). |
| `compare_listings` | `listing_ids[]`, `buyer_lat`, `buyer_lng` | Side-by-side comparison of up to 5 listings with score breakdowns. |
| `request_quote` | `listing_id`, `quantity_kg`, `buyer_factory_id`, `message` | Sends formal quote request and triggers WhatsApp/SMS notifications to seller. |
| `get_seller_contact` | `listing_id` | Reveals seller registered mobile number for human-to-human direct negotiation. |
| `save_search` | `buyer_factory_id`, `material_type`, `max_price_per_kg`, `buyer_lat`, `buyer_lng` | Registers persistent buyer watch criteria. |

---

## 5. UI Widgets & Preview Server

- **`widgets/bom-visualizer/page.tsx`**: Renders Mode 1 BOM card lists with benchmark price comparisons vs virgin rates.
- **`widgets/procurement-plan/page.tsx`**: Renders Mode 2 dashboard with search radius steps, recommended zones, multi-supplier allocation breakdown, ranked supplier scores, and AI reasoning.
- **Preview Gallery:** Run `npm run widgets:dev` and open `http://localhost:3001` to view interactive previews of both widgets.

---

## 6. How to Resume Work in OpenCode

1. **Working Git Branch:** `feature/pranav` (Pushed to `origin/feature/pranav`).
2. **Execute Automated Verification Suite:**
   ```powershell
   npx tsx C:\Users\admin\.gemini\antigravity\brain\aac31081-c490-4f74-8ec0-17f7dcd8f8cb\scratch\test_buyer_sourcing.mjs
   ```
   *(All 14 tests pass).*
3. **Execute Manual Tools Runner:**
   ```powershell
   npx tsx C:\Users\admin\.gemini\antigravity\brain\aac31081-c490-4f74-8ec0-17f7dcd8f8cb\scratch\manual_verify_tools.mjs
   ```
4. **Start Local Widget Preview:**
   ```powershell
   npm run widgets:dev
   ```

---
*End of Master Technical Handoff Document.*
