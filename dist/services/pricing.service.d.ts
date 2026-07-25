export interface PriceBenchmark {
    material_type: string;
    grade: string;
    market_price_per_kg: number;
    min_price_per_kg: number;
    max_price_per_kg: number;
    virgin_price_per_kg: number;
}
export declare function getMarketBenchmark(materialType: string, grade: string): PriceBenchmark | null;
export declare function validateSellerPrice(sellerPrice: number, benchmark: PriceBenchmark): {
    isReasonable: boolean;
    flag: string | null;
};
//# sourceMappingURL=pricing.service.d.ts.map