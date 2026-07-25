export declare function transcribeVoice(audioBase64: string, language?: string): Promise<{
    transcript: string;
    detected_language: string;
}>;
export declare function extractListingInfo(transcript: string): {
    material_description: string;
    quantity_kg?: number;
    price_per_kg?: number;
    location?: string;
};
//# sourceMappingURL=voice.service.d.ts.map