export interface MaterialRequirement {
    material_type: string;
    quantity_kg: number;
    max_price_per_kg?: number;
    required_grade?: 'A' | 'B' | 'C';
}
export interface SupplierOption {
    listing_id: string;
    factory_id: string;
    factory_name: string;
    material_type: string;
    quantity_kg: number;
    price_per_kg: number;
    grade: string;
    distance_km: number;
    trust_score: number;
    location: {
        lat: number;
        lng: number;
        address: string;
    };
}
export interface MatchResult {
    assignments: Array<{
        requirement: MaterialRequirement;
        supplier: SupplierOption;
        allocated_kg: number;
        cost: number;
        transport_cost: number;
    }>;
    total_cost: number;
    total_transport_cost: number;
    coverage_percent: number;
    unmet_requirements: MaterialRequirement[];
}
export declare function solveOptimalMatching(requirements: MaterialRequirement[], suppliers: SupplierOption[]): MatchResult;
//# sourceMappingURL=matching.solver.d.ts.map