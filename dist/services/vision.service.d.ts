import { type GenerativeModel } from '@google/generative-ai';
export declare function getGeminiClient(): GenerativeModel;
export declare function getEmbeddingModel(): GenerativeModel;
export interface VisionAnalysis {
    material_type: string;
    grade: 'A' | 'B' | 'C' | 'U';
    confidence: number;
    health_flags: string[];
    usage_classification: string[];
    ai_benchmark_price_per_kg?: number;
    ai_benchmark_price_range?: {
        min: number;
        max: number;
    };
}
export declare function analyzeMaterialPhoto(photoBase64: string, sellerDescription?: string): Promise<VisionAnalysis>;
export declare function generateEmbedding(text: string): Promise<number[]>;
export declare function chatCompletion(systemPrompt: string, userMessage: string): Promise<string>;
//# sourceMappingURL=vision.service.d.ts.map