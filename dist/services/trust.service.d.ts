export declare function calculateTrustScore(metrics: {
    fulfillment_rate: number;
    response_time_hours: number;
    kyc_verified: boolean;
    completed_deals: number;
    dispute_rate: number;
    platform_age_days: number;
}): number;
export declare function computeAndUpdateTrustScore(factoryId: string): Promise<number>;
export declare function getTrustBadge(score: number): {
    badge: string;
    color: string;
};
//# sourceMappingURL=trust.service.d.ts.map