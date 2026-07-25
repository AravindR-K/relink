import { z, ExecutionContext } from '@nitrostack/core';
import type { IndustrialZone } from '../../types/index.js';
declare const SearchMaterialsSchema: z.ZodObject<{
    material_type: z.ZodOptional<z.ZodString>;
    min_quantity_kg: z.ZodOptional<z.ZodNumber>;
    max_price_per_kg: z.ZodOptional<z.ZodNumber>;
    buyer_lat: z.ZodOptional<z.ZodNumber>;
    buyer_lng: z.ZodOptional<z.ZodNumber>;
    max_radius_km: z.ZodDefault<z.ZodNumber>;
    grade: z.ZodOptional<z.ZodEnum<["A", "B", "C"]>>;
    limit: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    max_radius_km: number;
    limit: number;
    material_type?: string | undefined;
    grade?: "A" | "B" | "C" | undefined;
    min_quantity_kg?: number | undefined;
    max_price_per_kg?: number | undefined;
    buyer_lat?: number | undefined;
    buyer_lng?: number | undefined;
}, {
    material_type?: string | undefined;
    grade?: "A" | "B" | "C" | undefined;
    min_quantity_kg?: number | undefined;
    max_price_per_kg?: number | undefined;
    buyer_lat?: number | undefined;
    buyer_lng?: number | undefined;
    max_radius_km?: number | undefined;
    limit?: number | undefined;
}>;
declare const LocationRecommendationSchema: z.ZodObject<{
    material_type: z.ZodString;
    quantity_kg: z.ZodNumber;
    buyer_lat: z.ZodNumber;
    buyer_lng: z.ZodNumber;
    max_radius_km: z.ZodDefault<z.ZodNumber>;
    max_price_per_kg: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    quantity_kg: number;
    material_type: string;
    buyer_lat: number;
    buyer_lng: number;
    max_radius_km: number;
    max_price_per_kg?: number | undefined;
}, {
    quantity_kg: number;
    material_type: string;
    buyer_lat: number;
    buyer_lng: number;
    max_price_per_kg?: number | undefined;
    max_radius_km?: number | undefined;
}>;
declare const GetContactSchema: z.ZodObject<{
    listing_id: z.ZodString;
}, "strip", z.ZodTypeAny, {
    listing_id: string;
}, {
    listing_id: string;
}>;
declare const CompareListingsSchema: z.ZodObject<{
    listing_ids: z.ZodArray<z.ZodString, "many">;
}, "strip", z.ZodTypeAny, {
    listing_ids: string[];
}, {
    listing_ids: string[];
}>;
export declare class SourcingTools {
    searchMaterials(input: z.infer<typeof SearchMaterialsSchema>, ctx: ExecutionContext): Promise<{
        results: {
            id: unknown;
            factory_id: unknown;
            factory_name: {};
            material_type: unknown;
            grade: unknown;
            quantity_kg: unknown;
            seller_quoted_price_per_kg: unknown;
            ai_benchmark_price_per_kg: unknown;
            negotiable: unknown;
            usage_classification: unknown;
            health_flags: unknown;
            trust_score: {};
            location: {} | null;
            status: unknown;
            created_at: unknown;
        }[];
        total: number;
        message: string;
    }>;
    recommendBestPlaceToSource(input: z.infer<typeof LocationRecommendationSchema>, ctx: ExecutionContext): Promise<{
        recommended_zones: IndustrialZone[];
        recommendation: string;
        message: string;
    }>;
    getSellerContact(input: z.infer<typeof GetContactSchema>, ctx: ExecutionContext): Promise<{
        listing_id: string;
        seller_name: string;
        seller_mobile: string;
        whatsapp_available: boolean;
        message: string;
    }>;
    compareListings(input: z.infer<typeof CompareListingsSchema>, ctx: ExecutionContext): Promise<{
        compared: {
            id: unknown;
            factory_name: {};
            material_type: unknown;
            grade: unknown;
            quantity_kg: unknown;
            seller_price: unknown;
            ai_benchmark: unknown;
            negotiable: unknown;
            trust_score: {};
            health_flags: unknown;
        }[];
        message: string;
    }>;
}
export {};
//# sourceMappingURL=sourcing.tools.d.ts.map