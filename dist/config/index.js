"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
exports.config = {
    supabase: {
        url: process.env.SUPABASE_URL || '',
        anonKey: process.env.SUPABASE_ANON_KEY || '',
        serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
    },
    gemini: {
        apiKey: process.env.GEMINI_API_KEY || '',
    },
    googleMaps: {
        apiKey: process.env.GOOGLE_MAPS_API_KEY || '',
    },
    jwt: {
        secret: process.env.JWT_SECRET || 'dev-secret-change-in-production',
    },
    voice: {
        azureKey: process.env.AZURE_SPEECH_KEY || '',
        azureRegion: process.env.AZURE_SPEECH_REGION || 'southeastasia',
    },
    twilio: {
        sid: process.env.TWILIO_SID || '',
        authToken: process.env.TWILIO_AUTH_TOKEN || '',
        whatsappNumber: process.env.TWILIO_WHATSAPP_NUMBER || '',
    },
};
//# sourceMappingURL=index.js.map