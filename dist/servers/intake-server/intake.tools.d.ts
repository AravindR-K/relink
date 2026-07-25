import { z, ExecutionContext } from '@nitrostack/core';
declare const PhotoUploadSchema: z.ZodObject<{
    photo_base64: z.ZodString;
    seller_quoted_price_per_kg: z.ZodNumber;
    quantity_kg: z.ZodNumber;
    mobile: z.ZodString;
    factory_id: z.ZodString;
    material_description: z.ZodOptional<z.ZodString>;
    negotiable: z.ZodDefault<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    factory_id: string;
    photo_base64: string;
    seller_quoted_price_per_kg: number;
    quantity_kg: number;
    mobile: string;
    negotiable: boolean;
    material_description?: string | undefined;
}, {
    factory_id: string;
    photo_base64: string;
    seller_quoted_price_per_kg: number;
    quantity_kg: number;
    mobile: string;
    material_description?: string | undefined;
    negotiable?: boolean | undefined;
}>;
declare const RegisterSellerSchema: z.ZodObject<{
    mobile: z.ZodString;
    factory_name: z.ZodString;
    gstin: z.ZodOptional<z.ZodString>;
    location: z.ZodObject<{
        lat: z.ZodNumber;
        lng: z.ZodNumber;
        address: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        lat: number;
        lng: number;
        address: string;
    }, {
        lat: number;
        lng: number;
        address: string;
    }>;
    industry_type: z.ZodEnum<["automotive", "textile", "plastic", "metal_fab", "electronics", "chemical", "construction", "packaging", "other"]>;
    whatsapp_opt_in: z.ZodDefault<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    mobile: string;
    factory_name: string;
    location: {
        lat: number;
        lng: number;
        address: string;
    };
    industry_type: "automotive" | "textile" | "plastic" | "metal_fab" | "electronics" | "chemical" | "construction" | "packaging" | "other";
    whatsapp_opt_in: boolean;
    gstin?: string | undefined;
}, {
    mobile: string;
    factory_name: string;
    location: {
        lat: number;
        lng: number;
        address: string;
    };
    industry_type: "automotive" | "textile" | "plastic" | "metal_fab" | "electronics" | "chemical" | "construction" | "packaging" | "other";
    gstin?: string | undefined;
    whatsapp_opt_in?: boolean | undefined;
}>;
declare const VoiceIntakeSchema: z.ZodObject<{
    audio_base64: z.ZodString;
    mobile: z.ZodString;
    language: z.ZodDefault<z.ZodOptional<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    mobile: string;
    audio_base64: string;
    language: string;
}, {
    mobile: string;
    audio_base64: string;
    language?: string | undefined;
}>;
declare const ERPSyncSchema: z.ZodObject<{
    factory_id: z.ZodString;
    erp_endpoint: z.ZodString;
    default_price_per_kg: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    factory_id: string;
    erp_endpoint: string;
    default_price_per_kg?: number | undefined;
}, {
    factory_id: string;
    erp_endpoint: string;
    default_price_per_kg?: number | undefined;
}>;
export declare class IntakeTools {
    registerSeller(input: z.infer<typeof RegisterSellerSchema>, ctx: ExecutionContext): Promise<{
        factory: any;
        message: string;
    }>;
    createListingWithPrice(input: z.infer<typeof PhotoUploadSchema>, ctx: ExecutionContext): Promise<{
        listing: any;
        ai_analysis: {
            material_type: string;
            grade: "A" | "B" | "C" | "U";
            confidence: number;
            health_flags: string[];
            usage_classification: string[];
            ai_benchmark_price_per_kg: number | undefined;
            ai_benchmark_price_range: {
                min: number;
                max: number;
            } | null;
            price_validation: {
                isReasonable: boolean;
                flag: string | null;
            };
        };
        message: string;
    }>;
    voiceIntakeToListing(input: z.infer<typeof VoiceIntakeSchema>, ctx: ExecutionContext): Promise<{
        listing: any;
        transcript: string;
        detected_language: string;
        message: string;
    }>;
    syncErpSurplus(input: z.infer<typeof ERPSyncSchema>, ctx: ExecutionContext): Promise<{
        listings_created: number;
        listings: unknown[];
        message: string;
    }>;
}
export {};
//# sourceMappingURL=intake.tools.d.ts.map