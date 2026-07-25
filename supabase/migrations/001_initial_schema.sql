-- ============================================================================
-- CircuLink: Agentic AI Manufacturing Waste-to-Revenue Platform
-- Supabase Database Schema (PostgreSQL + pgvector + PostGIS)
-- ============================================================================

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS postgis;

-- ============================================================================
-- TABLES
-- ============================================================================

-- Factory / Manufacturing Unit (tenant + seller identity)
CREATE TABLE factories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  mobile TEXT NOT NULL UNIQUE,
  whatsapp_opt_in BOOLEAN DEFAULT false,
  gstin TEXT UNIQUE,
  location GEOGRAPHY(POINT),
  industry_type TEXT NOT NULL CHECK (industry_type IN (
    'automotive', 'textile', 'plastic', 'metal_fab',
    'electronics', 'chemical', 'construction', 'packaging', 'other'
  )),
  erp_endpoint TEXT,
  trust_score FLOAT DEFAULT 50,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Material Listing (waste/byproduct catalog)
CREATE TABLE listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  factory_id UUID NOT NULL REFERENCES factories(id) ON DELETE CASCADE,
  material_type TEXT NOT NULL,
  grade CHAR(1) DEFAULT 'U' CHECK (grade IN ('A', 'B', 'C', 'U')),
  quantity_kg NUMERIC NOT NULL CHECK (quantity_kg > 0),
  availability TEXT DEFAULT 'one_time' CHECK (availability IN ('one_time', 'recurring', 'seasonal')),
  seller_quoted_price_per_kg NUMERIC NOT NULL DEFAULT 0,
  ai_benchmark_price_per_kg NUMERIC,
  negotiable BOOLEAN DEFAULT true,
  usage_classification TEXT[],
  health_flags TEXT[],
  status TEXT DEFAULT 'pending_verification' CHECK (status IN (
    'pending_verification', 'verified', 'matched', 'sold', 'cancelled'
  )),
  photo_urls TEXT[],
  embedding VECTOR(768),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- pgvector index for material similarity search
CREATE INDEX idx_listings_embedding ON listings
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);

-- Spatial index for location-based queries
CREATE INDEX idx_factories_location ON factories USING GIST (location);

-- Material index for type-based filtering
CREATE INDEX idx_listings_material_type ON listings (material_type);
CREATE INDEX idx_listings_status ON listings (status);
CREATE INDEX idx_listings_factory_id ON listings (factory_id);

-- Waste Forecasts (Prediction Agent output)
CREATE TABLE waste_forecasts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  factory_id UUID NOT NULL REFERENCES factories(id) ON DELETE CASCADE,
  predicted_material_type TEXT NOT NULL,
  predicted_quantity_kg NUMERIC NOT NULL,
  predicted_date DATE NOT NULL,
  confidence FLOAT DEFAULT 0.5,
  pre_notified_buyers UUID[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Contact Reveals (audit trail: when buyer viewed seller contact)
CREATE TABLE contact_reveals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID NOT NULL REFERENCES listings(id),
  buyer_id UUID REFERENCES factories(id),
  revealed_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================================
-- ROW LEVEL SECURITY (Multi-tenant Factory Isolation)
-- ============================================================================

ALTER TABLE factories ENABLE ROW LEVEL SECURITY;
ALTER TABLE listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE waste_forecasts ENABLE ROW LEVEL SECURITY;

-- Factory RLS: factory sees only its own record
CREATE POLICY "Factory sees own record" ON factories
  FOR ALL USING (id = auth.uid());

-- Factory RLS: anyone can read basic factory info (name, trust_score)
CREATE POLICY "Anyone reads factory public info" ON factories
  FOR SELECT USING (true);

-- Listing RLS: factory manages its own listings
CREATE POLICY "Factory manages own listings" ON listings
  FOR ALL USING (factory_id = auth.uid())
  WITH CHECK (factory_id = auth.uid());

-- Listing RLS: anyone can read verified listings
CREATE POLICY "Anyone reads verified listings" ON listings
  FOR SELECT USING (status IN ('verified', 'matched'));

-- Forecast RLS: factory sees its own forecasts
CREATE POLICY "Factory sees own forecasts" ON waste_forecasts
  FOR ALL USING (factory_id = auth.uid());

-- ============================================================================
-- SUPABASE REALTIME (Agent Event Bus)
-- ============================================================================

-- Publish tables that agents subscribe to via WebSocket
ALTER PUBLICATION supabase_realtime ADD TABLE listings;
ALTER PUBLICATION supabase_realtime ADD TABLE waste_forecasts;

-- ============================================================================
-- FUNCTIONS & TRIGGERS
-- ============================================================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_factories_modtime
  BEFORE UPDATE ON factories
  FOR EACH ROW EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER update_listings_modtime
  BEFORE UPDATE ON listings
  FOR EACH ROW EXECUTE FUNCTION update_modified_column();

-- ============================================================================
-- SEED DATA (Sample industrial zones + factories for hackathon demo)
-- ============================================================================

INSERT INTO factories (name, mobile, gstin, location, industry_type, trust_score) VALUES
  ('Auto Stampings Pvt Ltd', '+91-9876543210', '27AABCD1234E1Z5', ST_GeogFromText('POINT(73.85 18.75)'), 'automotive', 92),
  ('Precision Dies & Castings', '+91-9876543211', '27BBCDE5678F2Z6', ST_GeogFromText('POINT(73.80 18.62)'), 'metal_fab', 85),
  ('PolyPlast Industries', '+91-9876543212', '27CCDEF9012G3Z7', ST_GeogFromText('POINT(73.68 18.72)'), 'plastic', 88),
  ('SteelFab Engineering', '+91-9876543213', '27DDEFG3456H4Z8', ST_GeogFromText('POINT(73.84 18.64)'), 'metal_fab', 74),
  ('Chennai Copper Works', '+91-9876543214', '33EEFGH7890I5Z9', ST_GeogFromText('POINT(79.95 12.97)'), 'electronics', 90);

INSERT INTO listings (factory_id, material_type, grade, quantity_kg, seller_quoted_price_per_kg, ai_benchmark_price_per_kg, negotiable, usage_classification, health_flags, status) VALUES
  ((SELECT id FROM factories WHERE name = 'Auto Stampings Pvt Ltd'), 'aluminum_scrap', 'B', 500, 140, 148, true, ARRAY['remelting', 'casting', 'die_casting'], ARRAY['surface_oxidation'], 'verified'),
  ((SELECT id FROM factories WHERE name = 'PolyPlast Industries'), 'hdpe_regrind', 'A', 2000, 32, 35, true, ARRAY['injection_molding', 'pipe_extrusion', 'pallet_molding'], ARRAY[]::text[], 'verified'),
  ((SELECT id FROM factories WHERE name = 'SteelFab Engineering'), 'steel_offcut', 'B', 1500, 28, 32, true, ARRAY['remelting', 'rebar_manufacturing', 'forging'], ARRAY['rust'], 'verified'),
  ((SELECT id FROM factories WHERE name = 'Precision Dies & Castings'), 'aluminum_scrap', 'A', 800, 145, 155, false, ARRAY['remelting', 'extrusion', 'rolling_mill'], ARRAY[]::text[], 'verified'),
  ((SELECT id FROM factories WHERE name = 'Chennai Copper Works'), 'copper_wire', 'B', 300, 620, 650, true, ARRAY['remelting', 'wire_drawing', 'electrical_components'], ARRAY['mixed_materials'], 'verified');
