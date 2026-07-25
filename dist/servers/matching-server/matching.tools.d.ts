import { z, ExecutionContext } from '@nitrostack/core';
import { type MaterialRequirement, type SupplierOption } from '../../services/matching.solver.js';
declare const FindOptimalMatchesSchema: z.ZodObject<{
    requirements: z.ZodArray<z.ZodObject<{
        material_type: z.ZodString;
        quantity_kg: z.ZodNumber;
        max_price_per_kg: z.ZodOptional<z.ZodNumber>;
        required_grade: z.ZodOptional<z.ZodEnum<["A", "B", "C"]>>;
    }, "strip", z.ZodTypeAny, {
        quantity_kg: number;
        material_type: string;
        max_price_per_kg?: number | undefined;
        required_grade?: "A" | "B" | "C" | undefined;
    }, {
        quantity_kg: number;
        material_type: string;
        max_price_per_kg?: number | undefined;
        required_grade?: "A" | "B" | "C" | undefined;
    }>, "many">;
    buyer_lat: z.ZodNumber;
    buyer_lng: z.ZodNumber;
    max_radius_km: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    buyer_lat: number;
    buyer_lng: number;
    max_radius_km: number;
    requirements: {
        quantity_kg: number;
        material_type: string;
        max_price_per_kg?: number | undefined;
        required_grade?: "A" | "B" | "C" | undefined;
    }[];
}, {
    buyer_lat: number;
    buyer_lng: number;
    requirements: {
        quantity_kg: number;
        material_type: string;
        max_price_per_kg?: number | undefined;
        required_grade?: "A" | "B" | "C" | undefined;
    }[];
    max_radius_km?: number | undefined;
}>;
declare const RankSuppliersSchema: z.ZodObject<{
    listing_ids: z.ZodArray<z.ZodString, "many">;
    buyer_lat: z.ZodOptional<z.ZodNumber>;
    buyer_lng: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    listing_ids: string[];
    buyer_lat?: number | undefined;
    buyer_lng?: number | undefined;
}, {
    listing_ids: string[];
    buyer_lat?: number | undefined;
    buyer_lng?: number | undefined;
}>;
export declare class MatchingTools {
    findOptimalMatches(input: z.infer<typeof FindOptimalMatchesSchema>, ctx: ExecutionContext): Promise<{
        assignments: never[];
        total_cost: number;
        coverage_percent: number;
        message: string;
        total_material_cost?: undefined;
        total_transport_cost?: undefined;
        unmet_requirements?: undefined;
    } | {
        assignments: {
            requirement: MaterialRequirement;
            supplier: SupplierOption;
            allocated_kg: number;
            cost: number;
            transport_cost: number;
        }[];
        total_material_cost: number;
        total_transport_cost: number;
        total_cost: number;
        coverage_percent: number;
        unmet_requirements: MaterialRequirement[];
        message: string;
    }>;
    rankSuppliersByMultiObjective(input: z.infer<typeof RankSuppliersSchema>, ctx: ExecutionContext): Promise<{
        ranked: {
            listing_id: unknown;
            factory_name: unknown;
            material_type: unknown;
            price_per_kg: number;
            grade: unknown;
            distance_km: number;
            trust_score: number;
            rank_score: number;
        }[];
        top_pick: {
            listing_id: unknown;
            factory_name: unknown;
            material_type: unknown;
            price_per_kg: number;
            grade: unknown;
            distance_km: number;
            trust_score: number;
            rank_score: number;
        };
        message: string;
    }>;
}
export {};
//# sourceMappingURL=matching.tools.d.ts.map