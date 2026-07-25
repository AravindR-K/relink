import { ToolDecorator as Tool, z, ExecutionContext, UseGuards, Cache, RateLimit } from '@nitrostack/core';
import { JwtGuard } from '../../guards/jwt.guard.js';
import { getSupabaseClient } from '../../services/supabase.service.js';
import { analyzeMaterialPhoto, generateEmbedding } from '../../services/vision.service.js';
import { getMarketBenchmark, validateSellerPrice } from '../../services/pricing.service.js';
import { transcribeVoice, extractListingInfo } from '../../services/voice.service.js';
import { computeAndUpdateTrustScore } from '../../services/trust.service.js';

const PhotoUploadSchema = z.object({
  photo_base64: z.string().describe('Base64-encoded photo of the industrial material'),
  seller_quoted_price_per_kg: z.number().positive().describe('Price per kg that the seller wants (in INR)'),
  quantity_kg: z.number().positive().describe('Available quantity in kg'),
  mobile: z.string().regex(/^\+?[\d]{10,15}$/).describe('Seller mobile number for buyer contact'),
  factory_id: z.string().uuid().describe('Registered factory ID'),
  material_description: z.string().optional().describe('Optional text description of material'),
  negotiable: z.boolean().default(true).describe('Is the seller open to negotiation?'),
});

const RegisterSellerSchema = z.object({
  mobile: z.string().regex(/^\+?[\d]{10,15}$/).describe('Mobile number — primary contact'),
  factory_name: z.string().min(2).max(200).describe('Factory/business name'),
  gstin: z.string().optional().describe('GST number for KYC verification'),
  location: z.object({
    lat: z.number(),
    lng: z.number(),
    address: z.string(),
  }).describe('Geolocation + address'),
  industry_type: z.enum([
    'automotive', 'textile', 'plastic', 'metal_fab',
    'electronics', 'chemical', 'construction', 'packaging', 'other',
  ]).describe('Manufacturing industry type'),
  whatsapp_opt_in: z.boolean().default(false).describe('Receive deal alerts via WhatsApp'),
});

const VoiceIntakeSchema = z.object({
  audio_base64: z.string().describe('Base64-encoded audio recording'),
  mobile: z.string().regex(/^\+?[\d]{10,15}$/).describe('Caller mobile number'),
  language: z.string().optional().default('auto').describe('Spoken language code'),
});

const ERPSyncSchema = z.object({
  factory_id: z.string().uuid().describe('Factory ID to sync'),
  erp_endpoint: z.string().url().describe('ERP system endpoint URL'),
  default_price_per_kg: z.number().positive().optional().describe('Default pricing for auto-listings'),
});

export class IntakeTools {
  @Tool({
    name: 'register_seller',
    title: 'Register Manufacturing Seller',
    description: 'Onboard a new manufacturer: collect mobile (OTP-verified), factory details, GST, location, industry type. Mobile becomes the primary contact for buyer inquiries.',
    inputSchema: RegisterSellerSchema,
    annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: true },
    invocation: { invoking: 'Registering your factory...', invoked: 'Registration complete' },
  })
  async registerSeller(input: z.infer<typeof RegisterSellerSchema>, ctx: ExecutionContext) {
    const supabase = getSupabaseClient();

    const { data: existing } = await supabase
      .from('factories')
      .select('id')
      .eq('mobile', input.mobile)
      .maybeSingle();

    if (existing) {
      return { factory: existing, message: 'Factory already registered with this mobile number' };
    }

    const { data: factory, error } = await supabase
      .from('factories')
      .insert({
        name: input.factory_name,
        mobile: input.mobile,
        whatsapp_opt_in: input.whatsapp_opt_in,
        gstin: input.gstin || null,
        location: `POINT(${input.location.lng} ${input.location.lat})`,
        industry_type: input.industry_type,
      })
      .select()
      .single();

    if (error) throw new Error(`Registration failed: ${error.message}`);

    ctx.logger.info('Factory registered', { factoryId: factory.id, name: input.factory_name });
    return { factory, message: 'Factory registered successfully' };
  }

  @Tool({
    name: 'create_listing_with_price',
    title: 'Create Listing with Seller-Priced Material',
    description: 'Upload photo of industrial material. AI analyzes it, classifies, grades, and provides a benchmark price as a REFERENCE. Seller sets their OWN quoted price which gets listed. Mobile is shared for buyer contact.',
    inputSchema: PhotoUploadSchema,
    annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: true },
    invocation: { invoking: 'Analyzing material and creating listing...', invoked: 'Listing created' },
  })
  @UseGuards(JwtGuard)
  @Cache({ ttl: 3600, key: (input: unknown) => `listing:draft:${(input as Record<string, unknown>).factory_id}:${Date.now()}` })
  async createListingWithPrice(input: z.infer<typeof PhotoUploadSchema>, ctx: ExecutionContext) {
    const supabase = getSupabaseClient();

    // 1. Verify factory exists
    const { data: factory } = await supabase
      .from('factories')
      .select('*')
      .eq('id', input.factory_id)
      .single();

    if (!factory) throw new Error('Factory not found. Register first.');

    // 2. Analyze photo with vision model
    ctx.logger.info('Analyzing material photo');
    const analysis = await analyzeMaterialPhoto(input.photo_base64, input.material_description);

    // 3. Get market benchmark
    const benchmark = getMarketBenchmark(analysis.material_type, analysis.grade);

    // 4. Validate seller's quoted price
    const priceCheck = benchmark
      ? validateSellerPrice(input.seller_quoted_price_per_kg, benchmark)
      : { isReasonable: true, flag: null };

    // 5. Generate embedding for vector similarity search
    const embeddingText = [
      analysis.material_type,
      analysis.grade,
      ...analysis.usage_classification,
      input.material_description || '',
    ].join(' ');
    const embedding = await generateEmbedding(embeddingText);

    // 6. Insert listing into Supabase
    const { data: listing, error } = await supabase
      .from('listings')
      .insert({
        factory_id: input.factory_id,
        material_type: analysis.material_type,
        grade: analysis.grade,
        quantity_kg: input.quantity_kg,
        availability: 'one_time',
        seller_quoted_price_per_kg: input.seller_quoted_price_per_kg,
        ai_benchmark_price_per_kg: benchmark?.market_price_per_kg || null,
        negotiable: input.negotiable,
        usage_classification: analysis.usage_classification,
        health_flags: analysis.health_flags,
        status: 'verified',
        photo_urls: [`listing_photos/${input.factory_id}/${Date.now()}.jpg`],
        embedding,
      })
      .select()
      .single();

    if (error) throw new Error(`Listing creation failed: ${error.message}`);

    // 7. Update trust score
    const trustScore = await computeAndUpdateTrustScore(input.factory_id);

    return {
      listing: {
        ...listing,
        seller_mobile: input.mobile,
        trust_score: trustScore,
      },
      ai_analysis: {
        material_type: analysis.material_type,
        grade: analysis.grade,
        confidence: analysis.confidence,
        health_flags: analysis.health_flags,
        usage_classification: analysis.usage_classification,
        ai_benchmark_price_per_kg: benchmark?.market_price_per_kg,
        ai_benchmark_price_range: benchmark ? { min: benchmark.min_price_per_kg, max: benchmark.max_price_per_kg } : null,
        price_validation: priceCheck,
      },
      message: 'Listing created. Your quoted price has been listed. AI benchmark provided as reference.',
    };
  }

  @Tool({
    name: 'voice_intake_to_listing',
    title: 'Voice Intake',
    description: 'MSMEs without digital access call in, describe material + price in their language. System transcribes, structures, and creates a listing automatically.',
    inputSchema: VoiceIntakeSchema,
    annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: true },
  })
  @RateLimit({ requests: 30, window: '1h' })
  async voiceIntakeToListing(input: z.infer<typeof VoiceIntakeSchema>, ctx: ExecutionContext) {
    const supabase = getSupabaseClient();

    // 1. Transcribe voice
    const { transcript, detected_language } = await transcribeVoice(input.audio_base64, input.language);
    ctx.logger.info('Voice transcribed', { language: detected_language });

    // 2. Extract listing info from transcript
    const extracted = extractListingInfo(transcript);

    // 3. Find or create factory by mobile
    let factoryId: string;
    const { data: existingFactory } = await supabase
      .from('factories')
      .select('id')
      .eq('mobile', input.mobile)
      .maybeSingle();

    if (existingFactory) {
      factoryId = existingFactory.id;
    } else {
      const { data: newFactory } = await supabase
        .from('factories')
        .insert({
          name: `MSME-${input.mobile.slice(-4)}`,
          mobile: input.mobile,
          whatsapp_opt_in: false,
          industry_type: 'other',
        })
        .select('id')
        .single();

      if (!newFactory) throw new Error('Failed to create factory record');
      factoryId = newFactory.id;
    }

    // 4. Create basic listing from voice data
    const { data: listing, error } = await supabase
      .from('listings')
      .insert({
        factory_id: factoryId,
        material_type: 'unverified_voice',
        grade: 'U',
        quantity_kg: extracted.quantity_kg || 100,
        availability: 'one_time',
        seller_quoted_price_per_kg: extracted.price_per_kg || 0,
        negotiable: true,
        usage_classification: [],
        health_flags: ['voice_intake_pending_verification'],
        status: 'pending_verification',
        photo_urls: [],
      })
      .select()
      .single();

    if (error) throw new Error(`Voice listing creation failed: ${error.message}`);

    return {
      listing,
      transcript,
      detected_language,
      message: 'Voice listing created. A verification agent will review it shortly.',
    };
  }

  @Tool({
    name: 'sync_erp_surplus',
    title: 'Sync ERP Surplus',
    description: 'Connect to manufacturer ERP system and auto-detect surplus/disposal queue items. Creates listings automatically using pre-configured pricing rules.',
    inputSchema: ERPSyncSchema,
    annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: true },
  })
  @RateLimit({ requests: 60, window: '1h' })
  async syncErpSurplus(input: z.infer<typeof ERPSyncSchema>, ctx: ExecutionContext) {
    try {
      const response = await fetch(input.erp_endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'get_disposal_queue', factory_id: input.factory_id }),
      });
      const surplusItems = await response.json() as Array<{ material: string; quantity: number }>;

      const listings: unknown[] = [];
      const supabase = getSupabaseClient();

      for (const item of surplusItems) {
        const { data: listing } = await supabase
          .from('listings')
          .insert({
            factory_id: input.factory_id,
            material_type: item.material,
            quantity_kg: item.quantity,
            seller_quoted_price_per_kg: input.default_price_per_kg || 0,
            status: 'pending_verification',
            availability: 'recurring',
            grade: 'U',
            negotiable: true,
            usage_classification: [],
            health_flags: ['erp_auto_sync'],
            photo_urls: [],
          })
          .select()
          .single();
        if (listing) listings.push(listing);
      }

      return {
        listings_created: listings.length,
        listings,
        message: `${listings.length} listings auto-created from ERP surplus data`,
      };
    } catch (error) {
      ctx.logger.error('ERP sync failed', { endpoint: input.erp_endpoint });
      return {
        listings_created: 0,
        listings: [],
        message: 'ERP sync requires valid endpoint. For hackathon, this simulates the connection.',
      };
    }
  }
}
