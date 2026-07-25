import { z, ExecutionContext } from '@nitrostack/core';
declare const ForecastSchema: z.ZodObject<{
    factory_id: z.ZodString;
    days_ahead: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    factory_id: string;
    days_ahead: number;
}, {
    factory_id: string;
    days_ahead?: number | undefined;
}>;
declare const ComplianceReportSchema: z.ZodObject<{
    factory_id: z.ZodString;
    period: z.ZodDefault<z.ZodEnum<["monthly", "quarterly", "annual"]>>;
}, "strip", z.ZodTypeAny, {
    factory_id: string;
    period: "monthly" | "quarterly" | "annual";
}, {
    factory_id: string;
    period?: "monthly" | "quarterly" | "annual" | undefined;
}>;
declare const ESGImpactSchema: z.ZodObject<{
    factory_id: z.ZodString;
}, "strip", z.ZodTypeAny, {
    factory_id: string;
}, {
    factory_id: string;
}>;
export declare class ComplianceTools {
    forecastWasteGeneration(input: z.infer<typeof ForecastSchema>, ctx: ExecutionContext): Promise<{
        factory_id: string;
        forecasts: {
            material_type: string;
            predicted_quantity_kg: number;
            predicted_date: string;
            confidence: number;
        }[];
        pre_notified_buyers: number;
        message: string;
    }>;
    getComplianceReport(input: z.infer<typeof ComplianceReportSchema>, ctx: ExecutionContext): Promise<{
        factory_id: string;
        period: "monthly" | "quarterly" | "annual";
        report: {
            waste_diverted_tonnes: number;
            co2_saved_tonnes: number;
            revenue_from_waste: number;
            disposal_cost_saved: number;
            total_transactions: number;
            epr_compliance_status: string;
            generated_at: string;
        };
        message: string;
    }>;
    calculateESGImpact(input: z.infer<typeof ESGImpactSchema>, ctx: ExecutionContext): Promise<{
        factory_id: string;
        esg_metrics: {
            total_waste_listed_kg: number;
            total_waste_sold_kg: number;
            waste_diverted_tonnes: number;
            co2_saved_tonnes: number;
            match_rate_percent: number;
            circularity_score: number;
            estimated_revenue: number;
            landfill_cost_saved: number;
        };
        message: string;
    }>;
}
export {};
//# sourceMappingURL=compliance.tools.d.ts.map