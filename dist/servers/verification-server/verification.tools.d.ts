import { z, ExecutionContext } from '@nitrostack/core';
declare const AnalyzeHealthSchema: z.ZodObject<{
    listing_id: z.ZodString;
    photo_base64: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    listing_id: string;
    photo_base64?: string | undefined;
}, {
    listing_id: string;
    photo_base64?: string | undefined;
}>;
declare const ClassifyUsageSchema: z.ZodObject<{
    material_type: z.ZodString;
    grade: z.ZodOptional<z.ZodEnum<["A", "B", "C", "U"]>>;
}, "strip", z.ZodTypeAny, {
    material_type: string;
    grade?: "A" | "B" | "C" | "U" | undefined;
}, {
    material_type: string;
    grade?: "A" | "B" | "C" | "U" | undefined;
}>;
declare const SellerTrustSchema: z.ZodObject<{
    factory_id: z.ZodString;
}, "strip", z.ZodTypeAny, {
    factory_id: string;
}, {
    factory_id: string;
}>;
declare const AnomalySchema: z.ZodObject<{
    listing_id: z.ZodString;
}, "strip", z.ZodTypeAny, {
    listing_id: string;
}, {
    listing_id: string;
}>;
export declare class VerificationTools {
    analyzeMaterialHealth(input: z.infer<typeof AnalyzeHealthSchema>, ctx: ExecutionContext): Promise<{
        listing_id: string;
        status: string;
        message: string;
        grade?: undefined;
        confidence?: undefined;
        health_flags?: undefined;
    } | {
        listing_id: string;
        grade: "A" | "B" | "C" | "U";
        confidence: number;
        health_flags: any[];
        message: string;
        status?: undefined;
    }>;
    classifyMaterialUsage(input: z.infer<typeof ClassifyUsageSchema>, ctx: ExecutionContext): Promise<{
        material_type: string;
        grade: string;
        downstream_applications: string[];
        message: string;
    }>;
    suggestFairPrice(input: {
        material_type: string;
        grade: 'A' | 'B' | 'C' | 'U';
    }, ctx: ExecutionContext): Promise<{
        material_type: string;
        grade: "A" | "B" | "C" | "U";
        benchmark_available: boolean;
        message: string;
        benchmark?: undefined;
    } | {
        material_type: string;
        grade: "A" | "B" | "C" | "U";
        benchmark: {
            market_price_per_kg: number;
            range: {
                min: number;
                max: number;
            };
            virgin_price_per_kg: number;
            savings_vs_virgin_percent: number;
        };
        message: string;
        benchmark_available?: undefined;
    }>;
    calculateSellerTrustScore(input: z.infer<typeof SellerTrustSchema>, ctx: ExecutionContext): Promise<{
        factory_id: string;
        trust_score: number;
        badge: string;
        badge_color: string;
        message: string;
    }>;
    detectListingAnomalies(input: z.infer<typeof AnomalySchema>, ctx: ExecutionContext): Promise<{
        listing_id: string;
        anomalies: string[];
        fraud_probability: number;
        status: string;
        message: string;
    }>;
}
export {};
//# sourceMappingURL=verification.tools.d.ts.map