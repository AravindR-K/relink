"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MatchingTools = void 0;
const core_1 = require("@nitrostack/core");
const supabase_service_js_1 = require("../../services/supabase.service.js");
const matching_solver_js_1 = require("../../services/matching.solver.js");
const FindOptimalMatchesSchema = core_1.z.object({
    requirements: core_1.z.array(core_1.z.object({
        material_type: core_1.z.string().describe('Material type needed'),
        quantity_kg: core_1.z.number().positive().describe('Required quantity in kg'),
        max_price_per_kg: core_1.z.number().positive().optional().describe('Maximum acceptable price per kg'),
        required_grade: core_1.z.enum(['A', 'B', 'C']).optional().describe('Minimum grade requirement'),
    })).min(1).describe('Bill of Materials — all required materials'),
    buyer_lat: core_1.z.number().describe('Buyer location latitude'),
    buyer_lng: core_1.z.number().describe('Buyer location longitude'),
    max_radius_km: core_1.z.number().positive().default(100).describe('Maximum sourcing radius'),
});
const RankSuppliersSchema = core_1.z.object({
    listing_ids: core_1.z.array(core_1.z.string().uuid()).min(1).describe('Listing IDs to rank'),
    buyer_lat: core_1.z.number().optional().describe('Buyer latitude'),
    buyer_lng: core_1.z.number().optional().describe('Buyer longitude'),
});
class MatchingTools {
    async findOptimalMatches(input, ctx) {
        const supabase = (0, supabase_service_js_1.getSupabaseClient)();
        // Fetch all available verified listings
        const allMaterialTypes = input.requirements.map((r) => r.material_type);
        const { data: listings } = await supabase
            .from('listings')
            .select('*, factories!inner(name, trust_score, location)')
            .eq('status', 'verified')
            .in('material_type', allMaterialTypes)
            .gte('quantity_kg', 1);
        if (!listings || listings.length === 0) {
            return {
                assignments: [],
                total_cost: 0,
                coverage_percent: 0,
                message: 'No matching verified listings found for any of the required materials',
            };
        }
        const suppliers = listings.map((l) => {
            const factory = l.factories;
            const loc = factory?.location;
            return {
                listing_id: l.id,
                factory_id: l.factory_id,
                factory_name: factory?.name || 'Unknown',
                material_type: l.material_type,
                quantity_kg: l.quantity_kg,
                price_per_kg: l.seller_quoted_price_per_kg,
                grade: l.grade,
                distance_km: loc?.lat && loc?.lng && input.buyer_lat && input.buyer_lng
                    ? Math.round(haversineDistance(input.buyer_lat, input.buyer_lng, loc.lat, loc.lng))
                    : 50,
                trust_score: factory?.trust_score || 0,
                location: { lat: loc?.lat || 0, lng: loc?.lng || 0, address: '' },
            };
        });
        const result = (0, matching_solver_js_1.solveOptimalMatching)(input.requirements, suppliers);
        return {
            assignments: result.assignments,
            total_material_cost: result.total_cost,
            total_transport_cost: result.total_transport_cost,
            total_cost: result.total_cost + result.total_transport_cost,
            coverage_percent: result.coverage_percent,
            unmet_requirements: result.unmet_requirements,
            message: result.unmet_requirements.length > 0
                ? `Optimal match found: ${result.coverage_percent}% coverage. ${result.unmet_requirements.length} requirement(s) partially unmet.`
                : 'Optimal match found: 100% coverage across all requirements',
        };
    }
    async rankSuppliersByMultiObjective(input, ctx) {
        const supabase = (0, supabase_service_js_1.getSupabaseClient)();
        const { data: listings } = await supabase
            .from('listings')
            .select('*, factories(name, trust_score, location)')
            .in('id', input.listing_ids)
            .eq('status', 'verified');
        if (!listings || listings.length === 0)
            throw new Error('No valid listings found for ranking');
        const ranked = listings.map((l) => {
            const factory = l.factories;
            const loc = factory?.location;
            let distance = 50;
            if (input.buyer_lat && input.buyer_lng && loc?.lat && loc?.lng) {
                distance = Math.round(haversineDistance(input.buyer_lat, input.buyer_lng, loc.lat, loc.lng));
            }
            const price = l.seller_quoted_price_per_kg;
            const trust = factory?.trust_score || 0;
            const rankScore = (trust * 2) + (100 - Math.min(distance, 100)) + (100 - price * 0.5);
            return {
                listing_id: l.id,
                factory_name: factory?.name,
                material_type: l.material_type,
                price_per_kg: price,
                grade: l.grade,
                distance_km: distance,
                trust_score: trust,
                rank_score: Math.round(rankScore * 100) / 100,
            };
        });
        ranked.sort((a, b) => b.rank_score - a.rank_score);
        return {
            ranked,
            top_pick: ranked[0],
            message: `Ranked ${ranked.length} suppliers. Top pick: ${ranked[0]?.factory_name} (score: ${ranked[0]?.rank_score})`,
        };
    }
}
exports.MatchingTools = MatchingTools;
__decorate([
    (0, core_1.ToolDecorator)({
        name: 'find_optimal_matches',
        title: 'Find Optimal Matches (Multi-Supplier Solver)',
        description: 'Given a Bill of Materials (list of required materials), find the optimal combination of sellers minimizing total cost + transport. Solves the many-to-many allocation problem — combining materials from multiple factories to fulfill a complete BOM.',
        inputSchema: FindOptimalMatchesSchema,
        annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
        invocation: { invoking: 'Solving optimal supplier allocation...', invoked: 'Optimal match found' },
    }),
    (0, core_1.RateLimit)({ requests: 30, window: '1m' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [void 0, Object]),
    __metadata("design:returntype", Promise)
], MatchingTools.prototype, "findOptimalMatches", null);
__decorate([
    (0, core_1.ToolDecorator)({
        name: 'rank_suppliers_by_multi_objective',
        title: 'Rank Suppliers (Multi-Objective)',
        description: 'Rank potential suppliers by weighted criteria: proximity, price, seller trust, delivery speed, and availability reliability.',
        inputSchema: RankSuppliersSchema,
        annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    }),
    (0, core_1.RateLimit)({ requests: 100, window: '1m' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [void 0, Object]),
    __metadata("design:returntype", Promise)
], MatchingTools.prototype, "rankSuppliersByMultiObjective", null);
function haversineDistance(lat1, lng1, lat2, lng2) {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLng = ((lng2 - lng1) * Math.PI) / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) *
            Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}
//# sourceMappingURL=matching.tools.js.map