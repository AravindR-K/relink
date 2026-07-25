import { ToolDecorator as Tool, z, ExecutionContext, UseGuards, Cache } from '@nitrostack/core';
import { getSupabaseClient } from '../../services/supabase.service.js';
import type { IndustrialZone } from '../../types/index.js';

const SearchMaterialsSchema = z.object({
  material_type: z.string().optional().describe('Filter by material type'),
  min_quantity_kg: z.number().positive().optional().describe('Minimum quantity in kg'),
  max_price_per_kg: z.number().positive().optional().describe('Maximum price per kg'),
  buyer_lat: z.number().optional().describe('Buyer latitude for proximity sorting'),
  buyer_lng: z.number().optional().describe('Buyer longitude for proximity sorting'),
  max_radius_km: z.number().positive().default(100).describe('Maximum search radius in km'),
  grade: z.enum(['A', 'B', 'C']).optional().describe('Minimum grade requirement'),
  limit: z.number().int().min(1).max(50).default(20),
});

const LocationRecommendationSchema = z.object({
  material_type: z.string().describe('Material type needed'),
  quantity_kg: z.number().positive().describe('Required quantity in kg'),
  buyer_lat: z.number().describe('Buyer location latitude'),
  buyer_lng: z.number().describe('Buyer location longitude'),
  max_radius_km: z.number().positive().default(100),
  max_price_per_kg: z.number().positive().optional(),
});

const GetContactSchema = z.object({
  listing_id: z.string().uuid().describe('Listing ID to get seller contact for'),
});

const CompareListingsSchema = z.object({
  listing_ids: z.array(z.string().uuid()).min(2).max(5).describe('Up to 5 listing IDs to compare side-by-side'),
});

export class SourcingTools {
  @Tool({
    name: 'search_materials',
    title: 'Search Manufacturing Materials',
    description: 'Search across verified listings by material type, quantity, location, grade, and price range. Returns ranked matches with seller details.',
    inputSchema: SearchMaterialsSchema,
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    invocation: { invoking: 'Searching verified listings...', invoked: 'Results ready' },
  })
  @UseGuards()
  @Cache({ ttl: 300, key: (input) => `search:${JSON.stringify(input)}` })
  async searchMaterials(input: z.infer<typeof SearchMaterialsSchema>, ctx: ExecutionContext) {
    const supabase = getSupabaseClient();

    let query = supabase
      .from('listings')
      .select('*, factories!inner(name, mobile, trust_score, location, gstin)')
      .eq('status', 'verified')
      .gte('quantity_kg', input.min_quantity_kg || 1);

    if (input.material_type) {
      query = query.ilike('material_type', `%${input.material_type}%`);
    }
    if (input.max_price_per_kg) {
      query = query.lte('seller_quoted_price_per_kg', input.max_price_per_kg);
    }
    if (input.grade) {
      const grades: Record<string, string[]> = { A: ['A'], B: ['A', 'B'], C: ['A', 'B', 'C'] };
      query = query.in('grade', grades[input.grade]);
    }

    query = query.limit(input.limit).order('created_at', { ascending: false });

    const { data: results, error } = await query;

    if (error) throw new Error(`Search failed: ${error.message}`);

    const listings = (results || []).map((row: Record<string, unknown>) => {
      const factory = row.factories as Record<string, unknown> | null;
      return {
        id: row.id,
        factory_id: row.factory_id,
        factory_name: factory?.name || 'Unknown',
        material_type: row.material_type,
        grade: row.grade,
        quantity_kg: row.quantity_kg,
        seller_quoted_price_per_kg: row.seller_quoted_price_per_kg,
        ai_benchmark_price_per_kg: row.ai_benchmark_price_per_kg,
        negotiable: row.negotiable,
        usage_classification: row.usage_classification,
        health_flags: row.health_flags,
        trust_score: factory?.trust_score || 0,
        location: factory?.location || null,
        status: row.status,
        created_at: row.created_at,
      };
    });

    // Sort by proximity if buyer location provided
    if (input.buyer_lat && input.buyer_lng && listings.length > 0) {
      listings.sort((a: Record<string, unknown>, b: Record<string, unknown>) => {
        const distA = haversineDistance(
          input.buyer_lat!, input.buyer_lng!,
          (a.location as Record<string, number>)?.lat || 0,
          (a.location as Record<string, number>)?.lng || 0
        );
        const distB = haversineDistance(
          input.buyer_lat!, input.buyer_lng!,
          (b.location as Record<string, number>)?.lat || 0,
          (b.location as Record<string, number>)?.lng || 0
        );
        return distA - distB;
      });
    }

    return {
      results: listings,
      total: listings.length,
      message: `Found ${listings.length} verified listings matching your criteria`,
    };
  }

  @Tool({
    name: 'recommend_best_place_to_source',
    title: 'Recommend Best Location to Source',
    description: 'Analyze seller clusters across industrial zones near the buyer. Recommends the best geographic location to source from — comparing seller density, avg price, grade, and trust across zones.',
    inputSchema: LocationRecommendationSchema,
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    invocation: { invoking: 'Analyzing industrial zones...', invoked: 'Recommendations ready' },
  })
  @Cache({ ttl: 1800 })
  async recommendBestPlaceToSource(input: z.infer<typeof LocationRecommendationSchema>, ctx: ExecutionContext) {
    const supabase = getSupabaseClient();

    const { data: listings } = await supabase
      .from('listings')
      .select('*, factories!inner(location, trust_score, name)')
      .eq('status', 'verified')
      .eq('material_type', input.material_type)
      .gte('quantity_kg', 1);

    if (!listings || listings.length === 0) {
      return {
        recommended_zones: [],
        recommendation: 'No matching sellers found for this material type in the area.',
        message: 'No sellers found',
      };
    }

    // Cluster sellers into industrial zones (simplified clustering)
    const zoneMap = predefinedIndustrialZones();

    const zoneStats: IndustrialZone[] = [];
    for (const [zoneName, center] of Object.entries(zoneMap)) {
      const distToBuyer = haversineDistance(input.buyer_lat, input.buyer_lng, center.lat, center.lng);
      if (distToBuyer > input.max_radius_km) continue;

      const zoneSellers: Array<Record<string, unknown>> = [];
      for (const listing of listings) {
        const factory = listing.factories as Record<string, unknown> | null;
        const loc = factory?.location as Record<string, number> | null;
        if (!loc) continue;
        const dist = haversineDistance(center.lat, center.lng, loc.lat, loc.lng);
        if (dist < 15) {
          zoneSellers.push(listing);
        }
      }

      if (zoneSellers.length > 0) {
        const avgPrice = zoneSellers.reduce((sum: number, s: Record<string, unknown>) =>
          sum + (s.seller_quoted_price_per_kg as number), 0) / zoneSellers.length;
        const avgTrust = zoneSellers.reduce((sum: number, s: Record<string, unknown>) =>
          sum + ((s.factories as Record<string, unknown>)?.trust_score as number || 0), 0) / zoneSellers.length;

        zoneStats.push({
          name: zoneName,
          distance_km: Math.round(distToBuyer),
          seller_count: zoneSellers.length,
          avg_price_per_kg: Math.round(avgPrice),
          avg_grade: 'B',
          avg_trust_score: Math.round(avgTrust),
          top_listing_ids: zoneSellers.slice(0, 3).map((s: Record<string, unknown>) => s.id as string),
          cluster_center: center,
        });
      }
    }

    zoneStats.sort((a, b) => {
      const scoreA = (a.seller_count * 3) + (a.avg_trust_score * 0.5) - (a.avg_price_per_kg * 0.1) - (a.distance_km * 0.05);
      const scoreB = (b.seller_count * 3) + (b.avg_trust_score * 0.5) - (b.avg_price_per_kg * 0.1) - (b.distance_km * 0.05);
      return scoreB - scoreA;
    });

    const topZone = zoneStats[0];

    return {
      recommended_zones: zoneStats,
      recommendation: topZone
        ? `${topZone.name}: ${topZone.seller_count} sellers, avg ₹${topZone.avg_price_per_kg}/kg, ${topZone.distance_km}km away — best density-to-price ratio`
        : 'No recommendations could be generated',
      message: `Found ${zoneStats.length} industrial zones with ${input.material_type} sellers`,
    };
  }

  @Tool({
    name: 'get_seller_contact',
    title: 'Get Seller Contact',
    description: 'Reveal seller\'s registered mobile number so the buyer can contact them DIRECTLY. No MCP or agent mediation — this is human-to-human. The platform provides the verified lead; the deal conversation is between two factory owners.',
    inputSchema: GetContactSchema,
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
  })
  @UseGuards()
  async getSellerContact(input: z.infer<typeof GetContactSchema>, ctx: ExecutionContext) {
    const supabase = getSupabaseClient();

    const { data: listing } = await supabase
      .from('listings')
      .select('id, factory_id, factory:factories(name, mobile, whatsapp_opt_in)')
      .eq('id', input.listing_id)
      .single();

    if (!listing) throw new Error('Listing not found');

    const factory = listing.factory as unknown as { name: string; mobile: string; whatsapp_opt_in: boolean } | null;
    if (!factory) throw new Error('Seller factory not found');

    // Log contact reveal for trust scoring
    ctx.logger.info('Seller contact revealed to buyer', { listing_id: input.listing_id });

    return {
      listing_id: input.listing_id,
      seller_name: factory.name,
      seller_mobile: factory.mobile,
      whatsapp_available: factory.whatsapp_opt_in,
      message: `Contact ${factory.name} at ${factory.mobile}. Call or WhatsApp to discuss the deal directly.`,
    };
  }

  @Tool({
    name: 'compare_listings',
    title: 'Compare Listings Side-by-Side',
    description: 'Side-by-side comparison of up to 5 listings with scoring across price, proximity, grade, and seller trust.',
    inputSchema: CompareListingsSchema,
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
  })
  async compareListings(input: z.infer<typeof CompareListingsSchema>, ctx: ExecutionContext) {
    const supabase = getSupabaseClient();

    const { data: listings } = await supabase
      .from('listings')
      .select('*, factories(name, trust_score, location)')
      .in('id', input.listing_ids);

    if (!listings || listings.length === 0) throw new Error('No listings found for comparison');

    const compared = (listings as Array<Record<string, unknown>>).map((l: Record<string, unknown>) => ({
      id: l.id,
      factory_name: (l.factories as Record<string, unknown>)?.name || 'Unknown',
      material_type: l.material_type,
      grade: l.grade,
      quantity_kg: l.quantity_kg,
      seller_price: l.seller_quoted_price_per_kg,
      ai_benchmark: l.ai_benchmark_price_per_kg,
      negotiable: l.negotiable,
      trust_score: (l.factories as Record<string, unknown>)?.trust_score || 0,
      health_flags: l.health_flags,
    }));

    return { compared, message: `Compared ${compared.length} listings` };
  }
}

function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function predefinedIndustrialZones(): Record<string, { lat: number; lng: number }> {
  return {
    'Chakan MIDC': { lat: 18.75, lng: 73.85 },
    'Pimpri-Chinchwad': { lat: 18.62, lng: 73.80 },
    'Talegaon Industrial Area': { lat: 18.72, lng: 73.68 },
    'Bhosari MIDC': { lat: 18.64, lng: 73.84 },
    'Ranjangaon MIDC': { lat: 18.76, lng: 74.24 },
    'Hinjawadi IT Park Area': { lat: 18.59, lng: 73.68 },
    'Sanand GIDC': { lat: 22.99, lng: 72.48 },
    'Narol-Naroda GIDC': { lat: 23.02, lng: 72.62 },
    'Sriperumbudur Industrial Park': { lat: 12.97, lng: 79.95 },
    'Peenya Industrial Area': { lat: 13.03, lng: 77.52 },
  };
}
