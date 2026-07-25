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
exports.LogisticsTools = void 0;
const core_1 = require("@nitrostack/core");
const RouteSchema = core_1.z.object({
    origin_lat: core_1.z.number(),
    origin_lng: core_1.z.number(),
    dest_lat: core_1.z.number(),
    dest_lng: core_1.z.number(),
});
const FreightSchema = core_1.z.object({
    distance_km: core_1.z.number().positive(),
    material_weight_kg: core_1.z.number().positive(),
    vehicle_type: core_1.z.enum(['light_commercial', 'medium_truck', 'heavy_truck', 'trailer']).default('medium_truck'),
});
const TransporterSchema = core_1.z.object({
    pickup_lat: core_1.z.number(),
    pickup_lng: core_1.z.number(),
    max_radius_km: core_1.z.number().positive().default(50),
});
const PickupSchema = core_1.z.object({
    listing_id: core_1.z.string().uuid(),
    pickup_date: core_1.z.string(),
    transporter_id: core_1.z.string().optional(),
});
class LogisticsTools {
    async calculateRoute(input, ctx) {
        // Use Google Maps distance if API key configured
        if (process.env.GOOGLE_MAPS_API_KEY) {
            try {
                const response = await fetch(`https://maps.googleapis.com/maps/api/distancematrix/json?origins=${input.origin_lat},${input.origin_lng}&destinations=${input.dest_lat},${input.dest_lng}&key=${process.env.GOOGLE_MAPS_API_KEY}`);
                const data = await response.json();
                const element = data.rows?.[0]?.elements?.[0];
                if (element) {
                    return {
                        distance_km: Math.round(element.distance.value / 1000),
                        distance_display: element.distance.text,
                        duration_minutes: Math.round(element.duration.value / 60),
                        duration_display: element.duration.text,
                        origin: { lat: input.origin_lat, lng: input.origin_lng },
                        destination: { lat: input.dest_lat, lng: input.dest_lng },
                    };
                }
            }
            catch {
                ctx.logger.warn('Google Maps API call failed, using haversine');
            }
        }
        const distance = haversineDistance(input.origin_lat, input.origin_lng, input.dest_lat, input.dest_lng);
        return {
            distance_km: Math.round(distance),
            distance_display: `${Math.round(distance)} km`,
            duration_minutes: Math.round(distance * 1.5),
            duration_display: `${Math.round(distance * 1.5)} min (estimated)`,
            origin: { lat: input.origin_lat, lng: input.origin_lng },
            destination: { lat: input.dest_lat, lng: input.dest_lng },
            method: 'haversine_estimate',
        };
    }
    async estimateFreightCost(input, ctx) {
        const ratePerKm = {
            light_commercial: 12,
            medium_truck: 18,
            heavy_truck: 28,
            trailer: 35,
        };
        const rate = ratePerKm[input.vehicle_type] || 18;
        const baseCost = input.distance_km * rate;
        const weightSurcharge = input.material_weight_kg > 5000 ? baseCost * 0.2 : 0;
        const totalCost = Math.round(baseCost + weightSurcharge);
        return {
            distance_km: input.distance_km,
            weight_kg: input.material_weight_kg,
            vehicle_type: input.vehicle_type,
            base_cost: Math.round(baseCost),
            weight_surcharge: Math.round(weightSurcharge),
            total_estimated_cost: totalCost,
            cost_per_kg: Math.round((totalCost / input.material_weight_kg) * 100) / 100,
            currency: 'INR',
            message: `Estimated freight: ₹${totalCost} for ${input.material_weight_kg}kg over ${input.distance_km}km via ${input.vehicle_type}`,
        };
    }
    async findNearbyTransporters(input, ctx) {
        // Mock transporter registry for hackathon
        const mockTransporters = [
            { id: 'trans_001', name: 'Pune Cargo Movers', vehicle_types: ['medium_truck', 'heavy_truck'], rating: 4.5, mobile: '+91-98765-00001' },
            { id: 'trans_002', name: 'FastFreight Logistics', vehicle_types: ['light_commercial', 'medium_truck'], rating: 4.3, mobile: '+91-98765-00002' },
            { id: 'trans_003', name: 'Bharat Transport Co', vehicle_types: ['heavy_truck', 'trailer'], rating: 4.1, mobile: '+91-98765-00003' },
            { id: 'trans_004', name: 'QuickMove Express', vehicle_types: ['light_commercial'], rating: 4.7, mobile: '+91-98765-00004' },
        ];
        return {
            transporters: mockTransporters,
            pickup_location: { lat: input.pickup_lat, lng: input.pickup_lng },
            message: `Found ${mockTransporters.length} registered transporters near your pickup location`,
        };
    }
    async schedulePickup(input, ctx) {
        return {
            scheduled: {
                listing_id: input.listing_id,
                pickup_date: input.pickup_date,
                transporter_id: input.transporter_id || 'trans_001',
                status: 'scheduled',
                tracking_id: `TRK-${Date.now().toString(36).toUpperCase()}`,
            },
            message: `Pickup scheduled for ${input.pickup_date}. Transporter will be at the seller's location. Tracking ID: TRK-${Date.now().toString(36).toUpperCase()}`,
        };
    }
}
exports.LogisticsTools = LogisticsTools;
__decorate([
    (0, core_1.ToolDecorator)({
        name: 'calculate_route',
        title: 'Calculate Route & Distance',
        description: 'Get distance and route between seller warehouse and buyer facility. Integrates with Google Maps MCP server.',
        inputSchema: RouteSchema,
        annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true },
    }),
    (0, core_1.Cache)({ ttl: 604800 }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [void 0, Object]),
    __metadata("design:returntype", Promise)
], LogisticsTools.prototype, "calculateRoute", null);
__decorate([
    (0, core_1.ToolDecorator)({
        name: 'estimate_freight_cost',
        title: 'Estimate Freight Cost',
        description: 'Estimate freight cost based on distance, material weight/volume, and vehicle type.',
        inputSchema: FreightSchema,
        annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    }),
    (0, core_1.Cache)({ ttl: 86400 }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [void 0, Object]),
    __metadata("design:returntype", Promise)
], LogisticsTools.prototype, "estimateFreightCost", null);
__decorate([
    (0, core_1.ToolDecorator)({
        name: 'find_nearby_transporters',
        title: 'Find Nearby Transporters',
        description: 'Search for registered transport partners near the pickup location.',
        inputSchema: TransporterSchema,
        annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true },
    }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [void 0, Object]),
    __metadata("design:returntype", Promise)
], LogisticsTools.prototype, "findNearbyTransporters", null);
__decorate([
    (0, core_1.ToolDecorator)({
        name: 'schedule_pickup',
        title: 'Schedule Pickup',
        description: 'Schedule material pickup with a transport partner. Buyer coordinates logistics directly.',
        inputSchema: PickupSchema,
        annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: true },
    }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [void 0, Object]),
    __metadata("design:returntype", Promise)
], LogisticsTools.prototype, "schedulePickup", null);
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
//# sourceMappingURL=logistics.tools.js.map