"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendWhatsAppNotification = sendWhatsAppNotification;
exports.notifyBuyersAboutForecast = notifyBuyersAboutForecast;
const supabase_service_js_1 = require("./supabase.service.js");
async function sendWhatsAppNotification(mobile, message) {
    if (!process.env.TWILIO_SID || !process.env.TWILIO_AUTH_TOKEN) {
        console.log(`[Notification] WhatsApp fallback (Twilio not configured) → ${mobile}: ${message}`);
        return;
    }
    try {
        const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${process.env.TWILIO_SID}/Messages.json`, {
            method: 'POST',
            headers: {
                Authorization: `Basic ${Buffer.from(`${process.env.TWILIO_SID}:${process.env.TWILIO_AUTH_TOKEN}`).toString('base64')}`,
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
                To: `whatsapp:${mobile}`,
                From: process.env.TWILIO_WHATSAPP_NUMBER || 'whatsapp:+14155238886',
                Body: message,
            }),
        });
        if (!response.ok) {
            console.warn(`[Notification] Twilio send failed for ${mobile}: ${response.status}`);
        }
    }
    catch (error) {
        console.warn(`[Notification] Twilio unavailable, logged instead: ${mobile} — ${message}`);
    }
}
async function notifyBuyersAboutForecast(buyerIds, materialType, quantityKg, date) {
    try {
        const supabase = (0, supabase_service_js_1.getSupabaseClient)();
        const { data: factories } = await supabase
            .from('factories')
            .select('mobile, whatsapp_opt_in')
            .in('id', buyerIds)
            .eq('whatsapp_opt_in', true);
        if (!factories || factories.length === 0) {
            console.log('[Notification] No WhatsApp-opted-in buyers found for forecast');
            return;
        }
        const message = `CircuLink: ${quantityKg}kg of ${materialType.replace(/_/g, ' ')} expected by ${date}. Pre-matched for your needs.`;
        for (const factory of factories) {
            await sendWhatsAppNotification(factory.mobile, message);
        }
    }
    catch (error) {
        console.warn('[Notification] Forecast notification skipped (Supabase/Twilio unavailable):', error.message);
    }
}
//# sourceMappingURL=notification.service.js.map