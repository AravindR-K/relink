export interface Factory {
    id: string;
    name: string;
    mobile: string;
    whatsapp_opt_in: boolean;
    gstin?: string;
    location: {
        lat: number;
        lng: number;
        address: string;
    };
    industry_type: IndustryType;
    erp_endpoint?: string;
    trust_score: number;
    created_at: string;
}
export type IndustryType = 'automotive' | 'textile' | 'plastic' | 'metal_fab' | 'electronics' | 'chemical' | 'construction' | 'packaging' | 'other';
export type MaterialGrade = 'A' | 'B' | 'C' | 'U';
export type Availability = 'one_time' | 'recurring' | 'seasonal';
export type ListingStatus = 'pending_verification' | 'verified' | 'matched' | 'sold' | 'cancelled';
export interface Listing {
    id: string;
    factory_id: string;
    factory_name?: string;
    material_type: string;
    grade: MaterialGrade;
    quantity_kg: number;
    availability: Availability;
    seller_quoted_price_per_kg: number;
    ai_benchmark_price_per_kg?: number;
    negotiable: boolean;
    usage_classification: string[];
    health_flags: string[];
    status: ListingStatus;
    photo_urls: string[];
    embedding?: number[];
    location?: {
        lat: number;
        lng: number;
        address: string;
    };
    seller_mobile?: string;
    trust_score?: number;
    created_at: string;
    updated_at: string;
}
export interface IndustrialZone {
    name: string;
    distance_km: number;
    seller_count: number;
    avg_price_per_kg: number;
    avg_grade: string;
    avg_trust_score: number;
    top_listing_ids: string[];
    cluster_center: {
        lat: number;
        lng: number;
    };
}
export interface WasteForecast {
    id: string;
    factory_id: string;
    predicted_material_type: string;
    predicted_quantity_kg: number;
    predicted_date: string;
    confidence: number;
    pre_notified_buyers: string[];
    created_at: string;
}
export interface ComplianceReport {
    factory_id: string;
    period: string;
    waste_diverted_tonnes: number;
    co2_saved_tonnes: number;
    revenue_from_waste: number;
    disposal_cost_saved: number;
    match_rate_percent: number;
    epr_compliance_status: 'compliant' | 'partial' | 'non_compliant';
    generated_at: string;
}
//# sourceMappingURL=index.d.ts.map