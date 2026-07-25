import { z, ExecutionContext } from '@nitrostack/core';
declare const RouteSchema: z.ZodObject<{
    origin_lat: z.ZodNumber;
    origin_lng: z.ZodNumber;
    dest_lat: z.ZodNumber;
    dest_lng: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    origin_lat: number;
    origin_lng: number;
    dest_lat: number;
    dest_lng: number;
}, {
    origin_lat: number;
    origin_lng: number;
    dest_lat: number;
    dest_lng: number;
}>;
declare const FreightSchema: z.ZodObject<{
    distance_km: z.ZodNumber;
    material_weight_kg: z.ZodNumber;
    vehicle_type: z.ZodDefault<z.ZodEnum<["light_commercial", "medium_truck", "heavy_truck", "trailer"]>>;
}, "strip", z.ZodTypeAny, {
    distance_km: number;
    material_weight_kg: number;
    vehicle_type: "light_commercial" | "medium_truck" | "heavy_truck" | "trailer";
}, {
    distance_km: number;
    material_weight_kg: number;
    vehicle_type?: "light_commercial" | "medium_truck" | "heavy_truck" | "trailer" | undefined;
}>;
declare const TransporterSchema: z.ZodObject<{
    pickup_lat: z.ZodNumber;
    pickup_lng: z.ZodNumber;
    max_radius_km: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    max_radius_km: number;
    pickup_lat: number;
    pickup_lng: number;
}, {
    pickup_lat: number;
    pickup_lng: number;
    max_radius_km?: number | undefined;
}>;
declare const PickupSchema: z.ZodObject<{
    listing_id: z.ZodString;
    pickup_date: z.ZodString;
    transporter_id: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    listing_id: string;
    pickup_date: string;
    transporter_id?: string | undefined;
}, {
    listing_id: string;
    pickup_date: string;
    transporter_id?: string | undefined;
}>;
export declare class LogisticsTools {
    calculateRoute(input: z.infer<typeof RouteSchema>, ctx: ExecutionContext): Promise<{
        distance_km: number;
        distance_display: string;
        duration_minutes: number;
        duration_display: string;
        origin: {
            lat: number;
            lng: number;
        };
        destination: {
            lat: number;
            lng: number;
        };
        method?: undefined;
    } | {
        distance_km: number;
        distance_display: string;
        duration_minutes: number;
        duration_display: string;
        origin: {
            lat: number;
            lng: number;
        };
        destination: {
            lat: number;
            lng: number;
        };
        method: string;
    }>;
    estimateFreightCost(input: z.infer<typeof FreightSchema>, ctx: ExecutionContext): Promise<{
        distance_km: number;
        weight_kg: number;
        vehicle_type: "light_commercial" | "medium_truck" | "heavy_truck" | "trailer";
        base_cost: number;
        weight_surcharge: number;
        total_estimated_cost: number;
        cost_per_kg: number;
        currency: string;
        message: string;
    }>;
    findNearbyTransporters(input: z.infer<typeof TransporterSchema>, ctx: ExecutionContext): Promise<{
        transporters: {
            id: string;
            name: string;
            vehicle_types: string[];
            rating: number;
            mobile: string;
        }[];
        pickup_location: {
            lat: number;
            lng: number;
        };
        message: string;
    }>;
    schedulePickup(input: z.infer<typeof PickupSchema>, ctx: ExecutionContext): Promise<{
        scheduled: {
            listing_id: string;
            pickup_date: string;
            transporter_id: string;
            status: string;
            tracking_id: string;
        };
        message: string;
    }>;
}
export {};
//# sourceMappingURL=logistics.tools.d.ts.map