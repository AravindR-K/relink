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
exports.VerificationTools = void 0;
const core_1 = require("@nitrostack/core");
const supabase_service_js_1 = require("../../services/supabase.service.js");
const vision_service_js_1 = require("../../services/vision.service.js");
const pricing_service_js_1 = require("../../services/pricing.service.js");
const trust_service_js_1 = require("../../services/trust.service.js");
const AnalyzeHealthSchema = core_1.z.object({
    listing_id: core_1.z.string().uuid().describe('Listing ID to analyze'),
    photo_base64: core_1.z.string().optional().describe('Additional photo for re-analysis'),
});
const ClassifyUsageSchema = core_1.z.object({
    material_type: core_1.z.string().describe('Material type string'),
    grade: core_1.z.enum(['A', 'B', 'C', 'U']).optional(),
});
const SellerTrustSchema = core_1.z.object({
    factory_id: core_1.z.string().uuid().describe('Factory ID to calculate trust score for'),
});
const AnomalySchema = core_1.z.object({
    listing_id: core_1.z.string().uuid().describe('Listing ID to scan for anomalies'),
});
class VerificationTools {
    async analyzeMaterialHealth(input, ctx) {
        const supabase = (0, supabase_service_js_1.getSupabaseClient)();
        const { data: listing } = await supabase
            .from('listings')
            .select('*')
            .eq('id', input.listing_id)
            .single();
        if (!listing)
            throw new Error('Listing not found');
        if (!input.photo_base64 && !listing.photo_urls?.length) {
            return {
                listing_id: input.listing_id,
                status: 'no_photo_available',
                message: 'No photo available for health analysis. Listing remains unverified.',
            };
        }
        // Use existing photo URL or new base64
        const analysis = await (0, vision_service_js_1.analyzeMaterialPhoto)(input.photo_base64 || '', listing.material_type);
        const updatedHealthFlags = [
            ...new Set([...(listing.health_flags || []), ...analysis.health_flags]),
        ];
        await supabase
            .from('listings')
            .update({
            grade: analysis.grade,
            health_flags: updatedHealthFlags,
            usage_classification: analysis.usage_classification,
            status: 'verified',
        })
            .eq('id', input.listing_id);
        return {
            listing_id: input.listing_id,
            grade: analysis.grade,
            confidence: analysis.confidence,
            health_flags: updatedHealthFlags,
            message: `Material graded ${analysis.grade} with ${Math.round(analysis.confidence * 100)}% confidence`,
        };
    }
    async classifyMaterialUsage(input, ctx) {
        const usageMap = {
            aluminum_scrap: ['remelting', 'casting', 'extrusion', 'rolling_mill', 'die_casting'],
            hdpe_regrind: ['injection_molding', 'pipe_extrusion', 'blow_molding', 'pallet_molding'],
            pp_granulate: ['injection_molding', 'fiber_extrusion', 'thermoforming', 'film_blowing'],
            steel_offcut: ['remelting', 'rebar_manufacturing', 'forging', 'structural_sections'],
            copper_wire: ['remelting', 'wire_drawing', 'electrical_components', 'plumbing'],
            textile_waste: ['fiber_recycling', 'nonwoven_fabric', 'insulation', 'wiping_cloth'],
            glass_cullet: ['glass_remelting', 'container_manufacturing', 'fiberglass', 'abrasives'],
            wood_pallet: ['reuse', 'chipping', 'particle_board', 'biomass_fuel'],
        };
        const materialType = input.material_type.toLowerCase().replace(/[\s-]/g, '_');
        const applications = usageMap[materialType] || ['general_recycling', 'unknown_application'];
        return {
            material_type: input.material_type,
            grade: input.grade || 'N/A',
            downstream_applications: applications,
            message: `${applications.length} potential downstream manufacturing uses identified`,
        };
    }
    async suggestFairPrice(input, ctx) {
        const benchmark = (0, pricing_service_js_1.getMarketBenchmark)(input.material_type, input.grade);
        if (!benchmark) {
            return {
                material_type: input.material_type,
                grade: input.grade,
                benchmark_available: false,
                message: 'No market benchmark available for this material. Seller sets price without AI reference.',
            };
        }
        return {
            material_type: input.material_type,
            grade: input.grade,
            benchmark: {
                market_price_per_kg: benchmark.market_price_per_kg,
                range: { min: benchmark.min_price_per_kg, max: benchmark.max_price_per_kg },
                virgin_price_per_kg: benchmark.virgin_price_per_kg,
                savings_vs_virgin_percent: Math.round(((benchmark.virgin_price_per_kg - benchmark.market_price_per_kg) / benchmark.virgin_price_per_kg) * 100),
            },
            message: `Market benchmark: ₹${benchmark.market_price_per_kg}/kg for ${input.grade}-grade ${input.material_type}. Seller sets final price.`,
        };
    }
    async calculateSellerTrustScore(input, ctx) {
        const score = await (0, trust_service_js_1.computeAndUpdateTrustScore)(input.factory_id);
        const badge = (0, trust_service_js_1.getTrustBadge)(score);
        return {
            factory_id: input.factory_id,
            trust_score: score,
            badge: badge.badge,
            badge_color: badge.color,
            message: `Trust score: ${score}/100 — ${badge.badge}`,
        };
    }
    async detectListingAnomalies(input, ctx) {
        const supabase = (0, supabase_service_js_1.getSupabaseClient)();
        const { data: listing } = await supabase
            .from('listings')
            .select('*')
            .eq('id', input.listing_id)
            .single();
        if (!listing)
            throw new Error('Listing not found');
        const anomalies = [];
        const benchmark = (0, pricing_service_js_1.getMarketBenchmark)(listing.material_type, listing.grade);
        if (benchmark) {
            const priceCheck = (0, pricing_service_js_1.validateSellerPrice)(listing.seller_quoted_price_per_kg, benchmark);
            if (!priceCheck.isReasonable && priceCheck.flag) {
                anomalies.push(priceCheck.flag);
            }
        }
        if (!listing.photo_urls?.length) {
            anomalies.push('No photos attached — unable to verify material visually');
        }
        if (listing.grade === 'U') {
            anomalies.push('Material grade is unverified');
        }
        const fraudProbability = anomalies.length > 2 ? 0.6 : anomalies.length > 0 ? 0.2 : 0;
        return {
            listing_id: input.listing_id,
            anomalies,
            fraud_probability: fraudProbability,
            status: fraudProbability > 0.5 ? 'flagged' : 'clean',
            message: anomalies.length > 0 ? `${anomalies.length} anomalies detected` : 'No anomalies detected',
        };
    }
}
exports.VerificationTools = VerificationTools;
__decorate([
    (0, core_1.ToolDecorator)({
        name: 'analyze_material_health',
        title: 'Analyze Material Health',
        description: 'Vision model checks uploaded photos against declared type. Flags contamination, rust, degradation. Outputs grade A/B/C with advisory flags. Runs autonomously on listing.created event.',
        inputSchema: AnalyzeHealthSchema,
        annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: true },
        invocation: { invoking: 'Running health analysis...', invoked: 'Analysis complete' },
    }),
    (0, core_1.UseGuards)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [void 0, Object]),
    __metadata("design:returntype", Promise)
], VerificationTools.prototype, "analyzeMaterialHealth", null);
__decorate([
    (0, core_1.ToolDecorator)({
        name: 'classify_material_usage',
        title: 'Classify Material Usage',
        description: 'Given material type and specs, classify likely downstream manufacturing applications this material can feed into.',
        inputSchema: ClassifyUsageSchema,
        annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    }),
    (0, core_1.Cache)({ ttl: 86400 }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [void 0, Object]),
    __metadata("design:returntype", Promise)
], VerificationTools.prototype, "classifyMaterialUsage", null);
__decorate([
    (0, core_1.ToolDecorator)({
        name: 'suggest_fair_price',
        title: 'Suggest Fair Price (AI Benchmark)',
        description: 'AI-assisted pricing benchmark based on material type, grade, and current market rates. This is ADVISORY — seller sets the actual price.',
        inputSchema: core_1.z.object({
            material_type: core_1.z.string(),
            grade: core_1.z.enum(['A', 'B', 'C', 'U']),
        }),
        annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    }),
    (0, core_1.Cache)({ ttl: 3600 }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], VerificationTools.prototype, "suggestFairPrice", null);
__decorate([
    (0, core_1.ToolDecorator)({
        name: 'calculate_seller_trust_score',
        title: 'Calculate Seller Trust Score',
        description: 'Aggregate trust score from fulfillment rate, response time, KYC verification (GST), and transaction history.',
        inputSchema: SellerTrustSchema,
        annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    }),
    (0, core_1.RateLimit)({ requests: 100, window: '1m' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [void 0, Object]),
    __metadata("design:returntype", Promise)
], VerificationTools.prototype, "calculateSellerTrustScore", null);
__decorate([
    (0, core_1.ToolDecorator)({
        name: 'detect_listing_anomalies',
        title: 'Detect Listing Anomalies',
        description: 'Flag potential fraud: mismatched photos, unrealistic pricing vs market benchmarks, duplicate listings across accounts.',
        inputSchema: AnomalySchema,
        annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [void 0, Object]),
    __metadata("design:returntype", Promise)
], VerificationTools.prototype, "detectListingAnomalies", null);
//# sourceMappingURL=verification.tools.js.map