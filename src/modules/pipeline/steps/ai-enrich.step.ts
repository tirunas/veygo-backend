import { Injectable, Logger } from '@nestjs/common';
import Groq from 'groq-sdk';
import type { ResearchBundle } from './research.step';

export interface AiEnrichment {
  nameLt: string;
  descriptionLt: string;
  wowFacts: string[];
  hook: string;
  category: string;
  ticketInfo: string;
  bestTimeToVisit: string;
  howToGetThere: string;
  bestPhotoSpot: string;
  insiderTip: string;
  hiddenNearby: string;
  avoidIfYou: string;
  travellerTips: string[];
  officialWebsite: string | null;
  bookingUrls: string[];
  uniquenessScore: number;
}

@Injectable()
export class AiEnrichStep {
  private readonly logger = new Logger(AiEnrichStep.name);
  private client: Groq | null = null;

  private getClient(): Groq | null {
    if (this.client) return this.client;
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) return null;
    this.client = new Groq({ apiKey });
    return this.client;
  }

  async enrich(
    bundle: ResearchBundle,
    type: 'attraction' | 'restaurant',
    address: string | null,
  ): Promise<AiEnrichment> {
    const groq = this.getClient();
    const { placeName, destinationName } = bundle;

    if (!groq) {
      this.logger.warn(`GROQ_API_KEY not set — using fallback enrichment for "${placeName}"`);
      return this.fallbackEnrichment(placeName, type);
    }

    const typeContext = type === 'attraction' ? 'turistinę lankytinąją vietą' : 'restoraną ar maisto vietą';

    const categoryOptions = type === 'attraction'
      ? 'muziejus | bažnyčia | pilis | parkas | aikštė | turgus | teatras | galerija | paminklas | paplūdimys | gamtos draustinis | pramogų parkas | apžvalgos aikštelė | kalnas | upė | ežeras | šventykla | rūmai | mečetė | sinagoga | fontanas | tiltas | zoologijos sodas | akvariumas | kitas'
      : 'restoranas | kavinė | baras | gatvės maistas | kepykla | restorano baras | kitas';

    const researchParts: string[] = [];

    if (bundle.wikiDescription) {
      researchParts.push(`Wikipedia: ${bundle.wikiDescription}`);
    }

    for (const src of bundle.sources) {
      if (src.snippets.length === 0) continue;
      const label = ({
        reddit: 'Reddit traveler posts',
        atlasobscura: 'Atlas Obscura',
        wikivoyage: 'Wikivoyage guide',
        youtube: 'YouTube video titles/descriptions',
        blogs: 'Travel blogs',
        flickr: 'Flickr photo titles',
      } as Record<string, string>)[src.source] ?? src.source;
      researchParts.push(`${label} (reliability ${Math.round(src.reliability * 100)}%):\n${src.snippets.join('\n')}`);
    }

    const researchBlock = researchParts.length > 0
      ? `\nResearch gathered from ${researchParts.length} sources:\n\n${researchParts.join('\n\n')}`
      : '\nNo external research available — use your knowledge of this specific place.';

    const knownOfficialWebsite = bundle.officialWebsite ?? null;
    const knownBookingUrls = bundle.bookingUrls ?? [];

    if (address) researchParts.unshift(`Address: ${address}`);

    const prompt = `You are a seasoned traveler who has visited ${placeName} in ${destinationName} multiple times and read everything the internet has to say about it.
${researchBlock}

Based on this REAL traveler research, write content that sounds like advice from a well-traveled friend, NOT a tourist brochure. Be specific — name exact spots, floors, metro stops, times of day. If you don't have a specific answer from the research, say so honestly rather than inventing generic advice.

Place: "${placeName}"
City/Country: ${destinationName}
Type: ${typeContext}

Return ONLY valid JSON (no markdown, no extra text):
{
  "nameLt": "Exact name in Lithuanian (transliterate if needed)",
  "category": "One of: ${categoryOptions}",
  "descriptionLt": "3-4 sentences in Lithuanian, traveler voice: what it is, why it's worth visiting, what makes it unique. Be specific, not brochure-style.",
  "wowFacts": [
    "Specific historical or architectural fact sourced from real traveler accounts",
    "A surprising or little-known fact that amazes visitors",
    "A record, celebrity connection, or significant event at this specific place"
  ],
  "hook": "One punchy Lithuanian sentence that makes you want to go right now",
  "ticketInfo": "Specific entry price (local currency), opening hours, whether advance booking needed, any free days or discounts — SPECIFIC to ${placeName} in ${destinationName}",
  "bestTimeToVisit": "Best month/season in ${destinationName}, optimal time of day, which days to avoid and why — with specific reasoning about local climate and crowd patterns",
  "howToGetThere": "Specific transport from city center: metro line and stop, bus number, or walk time and direction. Be exact.",
  "bestPhotoSpot": "Exact spot for best photos: which floor, which angle, what time of day, any specific vantage point locals know about",
  "insiderTip": "The one thing only regulars or locals know — a specific hidden detail, trick, or shortcut",
  "hiddenNearby": "An under-the-radar spot within 5 minute walk that most tourists miss — be specific with name and what it is",
  "avoidIfYou": "Honest skip-if warning: who should NOT visit and why (e.g. avoid if you dislike crowds on summer weekends or not worth it if you've seen similar in Rome)",
  "travellerTips": [
    "Specific practical tip with actionable details (not generic advice)",
    "Photography or experience tip specific to this exact place",
    "Nearby attraction or combined-visit recommendation with specific name"
  ],
  "officialWebsite": ${knownOfficialWebsite ? `"${knownOfficialWebsite}"` : '"Use ONLY this value: null — do NOT invent a URL"'},
  "bookingUrls": ${knownBookingUrls.length > 0 ? JSON.stringify(knownBookingUrls) : '[] /* leave empty — do NOT invent booking URLs */'},
  "uniquenessScore": 7
}

For uniquenessScore: rate 1-10 how unique/special this place is vs standard tourist attractions. 10 = truly one-of-a-kind, 1 = generic chain restaurant or unremarkable plaza.`;

    const response = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      max_tokens: 2500,
      temperature: 0.35,
      messages: [{ role: 'user', content: prompt }],
    });

    const text = response.choices[0]?.message?.content ?? '';
    // Extract JSON from potential markdown code fences or surrounding prose
    const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/) ?? text.match(/(\{[\s\S]*\})/);
    const jsonText = jsonMatch ? jsonMatch[1].trim() : text.trim();
    const parsed = JSON.parse(jsonText) as AiEnrichment;

    // Always use researched URLs — never trust AI-generated ones
    if (knownOfficialWebsite) parsed.officialWebsite = knownOfficialWebsite;
    if (knownBookingUrls.length > 0) parsed.bookingUrls = knownBookingUrls;

    parsed.wowFacts = Array.isArray(parsed.wowFacts) ? parsed.wowFacts : [];
    parsed.travellerTips = Array.isArray(parsed.travellerTips) ? parsed.travellerTips : [];
    parsed.bookingUrls = Array.isArray(parsed.bookingUrls)
      ? parsed.bookingUrls.filter((u) => typeof u === 'string' && u.startsWith('http'))
      : [];
    if (typeof parsed.officialWebsite !== 'string') parsed.officialWebsite = null;
    if (parsed.officialWebsite && !parsed.officialWebsite.startsWith('http')) {
      parsed.officialWebsite = null;
    }
    parsed.howToGetThere = parsed.howToGetThere ?? '';
    parsed.bestPhotoSpot = parsed.bestPhotoSpot ?? '';
    parsed.insiderTip = parsed.insiderTip ?? '';
    parsed.hiddenNearby = parsed.hiddenNearby ?? '';
    parsed.avoidIfYou = parsed.avoidIfYou ?? '';
    parsed.uniquenessScore = typeof parsed.uniquenessScore === 'number'
      ? Math.max(1, Math.min(10, Math.round(parsed.uniquenessScore)))
      : 5;

    this.logger.log(
      `AI enriched: "${placeName}" [${parsed.category}] score=${parsed.uniquenessScore}/10`,
    );
    return parsed;
  }

  private fallbackEnrichment(name: string, type: 'attraction' | 'restaurant'): AiEnrichment {
    return {
      nameLt: name,
      category: type === 'attraction' ? 'kitas' : 'restoranas',
      descriptionLt: type === 'attraction'
        ? `${name} — lankytina vieta.`
        : `${name} — maisto vieta.`,
      wowFacts: [],
      hook: `Aplankykite ${name}!`,
      ticketInfo: '',
      bestTimeToVisit: '',
      howToGetThere: '',
      bestPhotoSpot: '',
      insiderTip: '',
      hiddenNearby: '',
      avoidIfYou: '',
      travellerTips: [],
      officialWebsite: null,
      bookingUrls: [],
      uniquenessScore: 5,
    };
  }
}
