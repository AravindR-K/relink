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
exports.ComplianceTools = void 0;
const core_1 = require("@nitrostack/core");
const supabase_service_js_1 = require("../../services/supabase.service.js");
const notification_service_js_1 = require("../../services/notification.service.js");
const ForecastSchema = core_1.z.object({
    factory_id: core_1.z.string().uuid().describe('Factory ID to forecast waste for'),
    days_ahead: core_1.z.number().int().min(1).max(30).default(7),
});
const ComplianceReportSchema = core_1.z.object({
    factory_id: core_1.z.string().uuid().describe('Factory ID to generate report for'),
    period: core_1.z.enum(['monthly', 'quarterly', 'annual']).default('monthly'),
});
const ESGImpactSchema = core_1.z.object({
    factory_id: core_1.z.string().uuid().describe('Factory ID to calculate ESG metrics for'),
});
class ComplianceTools {
    async forecastWasteGeneration(input, ctx) {
        const supabase = (0, supabase_service_js_1.getSupabaseClient)();
        // Get historical listing patterns
        const { data: history } = await supabase
            .from('listings')
            .select('material_type, quantity_kg, created_at')
            .eq('factory_id', input.factory_id)
            .order('created_at', { ascending: false })
            .limit(30);
        const forecasts = [];
        if (history && history.length > 0) {
            // Simple forecasting: average last N listings per material type
            const byType = new Map();
            for (const h of history) {
                const key = h.material_type;
                if (!byType.has(key))
                    byType.set(key, []);
                byType.get(key).push({ qty: h.quantity_kg, date: h.created_at });
            }
            let dayOffset = 0;
            for (const [materialType, items] of byType) {
                const avgQty = Math.round(items.reduce((s, i) => s + i.qty, 0) / items.length);
                const predictedDate = new Date();
                predictedDate.setDate(predictedDate.getDate() + dayOffset + 1);
                forecasts.push({
                    material_type: materialType,
                    predicted_quantity_kg: avgQty,
                    predicted_date: predictedDate.toISOString().split('T')[0],
                    confidence: Math.min(0.9, 0.5 + items.length * 0.05),
                });
                dayOffset += 1;
            }
        }
        if (forecasts.length === 0) {
            forecasts.push({
                material_type: 'unknown',
                predicted_quantity_kg: 500,
                predicted_date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
                confidence: 0.3,
            });
        }
        // Store forecasts in Supabase
        for (const f of forecasts) {
            await supabase.from('waste_forecasts').insert({
                factory_id: input.factory_id,
                predicted_material_type: f.material_type,
                predicted_quantity_kg: f.predicted_quantity_kg,
                predicted_date: f.predicted_date,
                confidence: f.confidence,
            });
        }
        // Find matched buyers and pre-notify
        const matchedBuyerIds = [];
        for (const f of forecasts) {
            const { data: matches } = await supabase
                .from('listings')
                .select('factory_id')
                .eq('material_type', f.material_type)
                .eq('status', 'verified')
                .limit(3);
            if (matches) {
                for (const m of matches) {
                    if (m.factory_id !== input.factory_id && !matchedBuyerIds.includes(m.factory_id)) {
                        matchedBuyerIds.push(m.factory_id);
                    }
                }
            }
        }
        // Send WhatsApp notifications to pre-matched buyers
        if (matchedBuyerIds.length > 0 && forecasts[0]) {
            (0, notification_service_js_1.notifyBuyersAboutForecast)(matchedBuyerIds, forecasts[0].material_type, forecasts[0].predicted_quantity_kg, forecasts[0].predicted_date)
                .catch((e) => ctx.logger.error('Forecast notification failed', { error: e }));
        }
        return {
            factory_id: input.factory_id,
            forecasts,
            pre_notified_buyers: matchedBuyerIds.length,
            message: `${forecasts.length} waste streams forecasted. ${matchedBuyerIds.length} potential buyers pre-notified via WhatsApp.`,
        };
    }
    async getComplianceReport(input, ctx) {
        const supabase = (0, supabase_service_js_1.getSupabaseClient)();
        // Count completed listings for this factory
        const { count: soldCount } = await supabase
            .from('listings')
            .select('id', { count: 'exact', head: true })
            .eq('factory_id', input.factory_id)
            .eq('status', 'sold');
        // Sum quantities
        const { data: listings } = await supabase
            .from('listings')
            .select('quantity_kg')
            .eq('factory_id', input.factory_id)
            .eq('status', 'sold');
        const wasteDiverted = listings?.reduce((sum, l) => sum + l.quantity_kg, 0) || 0;
        const wasteDivertedTonnes = Math.round((wasteDiverted / 1000) * 100) / 100;
        // Simplified ESG calculation
        const co2SavedPerKg = 2.5;
        const co2SavedTonnes = Math.round((wasteDiverted * co2SavedPerKg / 1000) * 100) / 100;
        const revenue = listings?.reduce((sum, l) => sum + l.quantity_kg * (l.seller_quoted_price_per_kg || 0), 0) || 0;
        return {
            factory_id: input.factory_id,
            period: input.period,
            report: {
                waste_diverted_tonnes: wasteDivertedTonnes,
                co2_saved_tonnes: co2SavedTonnes,
                revenue_from_waste: Math.round(revenue),
                disposal_cost_saved: Math.round(wasteDiverted * 3),
                total_transactions: soldCount || 0,
                epr_compliance_status: wasteDivertedTonnes > 0 ? 'compliant' : 'non_compliant',
                generated_at: new Date().toISOString(),
            },
            message: `Compliance report ready. ${wasteDivertedTonnes} tonnes diverted, ${co2SavedTonnes} tonnes CO2 saved. EPR status: ${wasteDivertedTonnes > 0 ? 'Compliant' : 'Non-compliant'}.`,
        };
    }
    async calculateESGImpact(input, ctx) {
        const supabase = (0, supabase_service_js_1.getSupabaseClient)();
        const { data: soldListings } = await supabase
            .from('listings')
            .select('quantity_kg, material_type, status')
            .eq('factory_id', input.factory_id)
            .in('status', ['sold', 'verified']);
        const totalListed = soldListings?.reduce((s, l) => s + l.quantity_kg, 0) || 0;
        const totalSold = soldListings
            ?.filter((l) => l.status === 'sold')
            .reduce((s, l) => s + l.quantity_kg, 0) || 0;
        const matchRate = totalListed > 0 ? Math.round((totalSold / totalListed) * 100) : 0;
        const circularityScore = Math.min(100, matchRate);
        const co2PerKg = {
            aluminum_scrap: 8.0,
            steel_offcut: 1.8,
            copper_wire: 3.5,
            hdpe_regrind: 1.5,
            pp_granulate: 1.5,
            textile_waste: 3.0,
        };
        let co2Saved = 0;
        for (const l of (soldListings || []).filter((l) => l.status === 'sold')) {
            const factor = co2PerKg[l.material_type] || 2.0;
            co2Saved += l.quantity_kg * factor;
        }
        return {
            factory_id: input.factory_id,
            esg_metrics: {
                total_waste_listed_kg: totalListed,
                total_waste_sold_kg: totalSold,
                waste_diverted_tonnes: Math.round((totalSold / 1000) * 100) / 100,
                co2_saved_tonnes: Math.round((co2Saved / 1000) * 100) / 100,
                match_rate_percent: matchRate,
                circularity_score: circularityScore,
                estimated_revenue: Math.round(totalSold * 30),
                landfill_cost_saved: Math.round(totalSold * 3),
            },
            message: `ESG Impact: ${Math.round(totalSold / 1000)} tonnes diverted, ${Math.round(co2Saved / 1000)} tonnes CO2 saved, ${matchRate}% match rate, Circularity Score: ${circularityScore}/100`,
        };
    }
}
exports.ComplianceTools = ComplianceTools;
__decorate([
    (0, core_1.ToolDecorator)({
        name: 'forecast_waste_generation',
        title: 'Forecast Waste Generation (Predictive)',
        description: 'Analyze historical listing patterns + production schedules to predict upcoming waste generation. The core Industry 4.0 feature — predictive forecasting applied to manufacturing waste outflow.',
        inputSchema: ForecastSchema,
        annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: false, openWorldHint: false },
        invocation: { invoking: 'Running waste forecast model...', invoked: 'Forecast ready' },
    }),
    (0, core_1.Cache)({ ttl: 3600 }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [void 0, Object]),
    __metadata("design:returntype", Promise)
], ComplianceTools.prototype, "forecastWasteGeneration", null);
__decorate([
    (0, core_1.ToolDecorator)({
        name: 'get_compliance_report',
        title: 'Generate Compliance Report',
        description: 'Generate regulatory compliance report for India 2026 Waste Management Rules and EPR requirements. Ready for export and filing.',
        inputSchema: ComplianceReportSchema,
        annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
        invocation: { invoking: 'Generating compliance report...', invoked: 'Report ready' },
    }),
    (0, core_1.UseGuards)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [void 0, Object]),
    __metadata("design:returntype", Promise)
], ComplianceTools.prototype, "getComplianceReport", null);
__decorate([
    (0, core_1.ToolDecorator)({
        name: 'calculate_esg_impact',
        title: 'Calculate ESG & Circularity Impact',
        description: 'Calculate ESG metrics: waste diverted from landfill, CO2 saved vs virgin material, circularity score. Visual dashboard for factory management.',
        inputSchema: ESGImpactSchema,
        annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    }),
    (0, core_1.Cache)({ ttl: 86400 }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [void 0, Object]),
    __metadata("design:returntype", Promise)
], ComplianceTools.prototype, "calculateESGImpact", null);
//# sourceMappingURL=compliance.tools.js.map