"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.transcribeVoice = transcribeVoice;
exports.extractListingInfo = extractListingInfo;
async function transcribeVoice(audioBase64, language) {
    // Use Azure Speech or Sarvam AI for multilingual transcription
    // For hackathon MVP, return a simulated transcript
    if (process.env.AZURE_SPEECH_KEY) {
        try {
            const region = process.env.AZURE_SPEECH_REGION || 'southeastasia';
            const response = await fetch(`https://${region}.stt.speech.microsoft.com/speech/recognition/conversation/cognitiveservices/v1?language=${language || 'auto'}`, {
                method: 'POST',
                headers: {
                    'Ocp-Apim-Subscription-Key': process.env.AZURE_SPEECH_KEY,
                    'Content-Type': 'audio/wav',
                },
                body: Buffer.from(audioBase64, 'base64'),
            });
            const result = await response.json();
            return {
                transcript: result.DisplayText || '',
                detected_language: language || 'en-IN',
            };
        }
        catch {
            // Fall through to mock
        }
    }
    return {
        transcript: 'Simulated transcript — configure Azure Speech or Sarvam AI for production',
        detected_language: language || 'en-IN',
    };
}
function extractListingInfo(transcript) {
    const result = {
        material_description: transcript,
    };
    const kgMatch = transcript.match(/(\d+)\s*(?:kg|kilo|kilograms?)/i);
    if (kgMatch)
        result.quantity_kg = parseInt(kgMatch[1]);
    const priceMatch = transcript.match(/(?:Rs|INR|₹)\s*(\d+)\s*(?:per\s*kg|\/kg)/i);
    if (priceMatch)
        result.price_per_kg = parseInt(priceMatch[1]);
    return result;
}
//# sourceMappingURL=voice.service.js.map