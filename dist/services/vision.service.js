"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getGeminiClient = getGeminiClient;
exports.getEmbeddingModel = getEmbeddingModel;
exports.analyzeMaterialPhoto = analyzeMaterialPhoto;
exports.generateEmbedding = generateEmbedding;
exports.chatCompletion = chatCompletion;
const generative_ai_1 = require("@google/generative-ai");
let genAI = null;
let visionModel = null;
let embeddingModel = null;
function getGeminiClient() {
    if (visionModel)
        return visionModel;
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        throw new Error('GEMINI_API_KEY environment variable is required');
    }
    genAI = new generative_ai_1.GoogleGenerativeAI(apiKey);
    visionModel = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
    return visionModel;
}
function getEmbeddingModel() {
    if (embeddingModel)
        return embeddingModel;
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        throw new Error('GEMINI_API_KEY environment variable is required');
    }
    if (!genAI)
        genAI = new generative_ai_1.GoogleGenerativeAI(apiKey);
    embeddingModel = genAI.getGenerativeModel({ model: 'text-embedding-004' });
    return embeddingModel;
}
async function analyzeMaterialPhoto(photoBase64, sellerDescription) {
    const model = getGeminiClient();
    const prompt = `Analyze this photo of industrial manufacturing waste/byproduct material.
${sellerDescription ? `Seller's description: "${sellerDescription}"` : ''}

Identify:
1. Material type (e.g. aluminum_scrap, hdpe_regrind, steel_offcut, pp_granulate, copper_wire, textile_waste, wood_pallet, glass_cullet, etc.)
2. Quality grade: A (clean, uncontaminated), B (minor defects/oxidation, usable), C (significant degradation, limited use), U (unverified/unable to determine from photo)
3. Any health flags: surface_oxidation, ferrous_contamination, chemical_contamination, moisture_damage, mixed_materials, physical_damage, excessive_wear, rust, etc.
4. What downstream manufacturing applications this material can feed into (e.g. injection_molding, pipe_extrusion, remelting, casting, extrusion, pelletizing, etc.)
5. A fair market price range in INR per kg for this grade of material (considering it's secondary/recycled, not virgin)

Respond ONLY with a valid JSON object matching this schema (no markdown, no backticks):
{
  "material_type": "string",
  "grade": "A|B|C|U",
  "confidence": 0.0-1.0,
  "health_flags": ["string"],
  "usage_classification": ["string"],
  "ai_benchmark_price_per_kg": number|null,
  "ai_benchmark_price_range": { "min": number, "max": number }
}`;
    const imagePart = {
        inlineData: {
            mimeType: 'image/jpeg',
            data: photoBase64,
        },
    };
    const result = await model.generateContent([prompt, imagePart]);
    const responseText = result.response.text();
    // Clean potential markdown wrapping
    const jsonStr = responseText
        .replace(/^```json\s*/, '')
        .replace(/^```\s*/, '')
        .replace(/\s*```$/, '')
        .trim();
    const analysis = JSON.parse(jsonStr);
    return analysis;
}
async function generateEmbedding(text) {
    const model = getEmbeddingModel();
    const result = await model.embedContent(text);
    return result.embedding.values;
}
async function chatCompletion(systemPrompt, userMessage) {
    const model = getGeminiClient();
    const result = await model.generateContent(`${systemPrompt}\n\n${userMessage}`);
    return result.response.text();
}
//# sourceMappingURL=vision.service.js.map