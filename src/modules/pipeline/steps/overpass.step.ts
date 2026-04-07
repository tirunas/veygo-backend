import { Injectable, Logger } from '@nestjs/common';

export interface OverpassPlace {
  sourceId: string;
  name: string;
  address: string | null;
  lat: number;
  lng: number;
  osmCategory: string | null;
}

const OVERPASS_MIRRORS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
  'https://maps.mail.ru/osm/tools/overpass/api/interpreter',
];
const USER_AGENT = 'VeygoBot/1.0 (travel planning app)';

// OSM tourism tags → human-readable category
const TOURISM_CATEGORY: Record<string, string> = {
  museum: 'muziejus',
  attraction: 'lankytina vieta',
  artwork: 'menas',
  gallery: 'galerija',
  viewpoint: 'apžvalgos aikštelė',
  historic: 'istorinis objektas',
  monument: 'paminklas',
  castle: 'pilis',
  ruins: 'griuvėsiai',
  zoo: 'zoologijos sodas',
  aquarium: 'akvariumas',
  theme_park: 'pramogų parkas',
  park: 'parkas',
  national_park: 'nacionalinis parkas',
  garden: 'sodas',
  beach: 'paplūdimys',
  lighthouse: 'švyturys',
  memorial: 'memoralas',
  church: 'bažnyčia',
  cathedral: 'katedra',
  mosque: 'mečetė',
  temple: 'šventykla',
  synagogue: 'sinagoga',
  monastery: 'vienuolynas',
  palace: 'rūmai',
  bridge: 'tiltas',
  stadium: 'stadionas',
  theatre: 'teatras',
  cinema: 'kinas',
  library: 'biblioteka',
  market: 'turgus',
};

const RESTAURANT_AMENITIES = new Set([
  'restaurant', 'cafe', 'bar', 'pub', 'fast_food', 'food_court',
  'biergarten', 'ice_cream', 'bakery', 'confectionery',
]);

@Injectable()
export class OverpassStep {
  private readonly logger = new Logger(OverpassStep.name);

  async discover(
    lat: number,
    lng: number,
    radiusKm: number,
    type: 'attraction' | 'restaurant',
  ): Promise<OverpassPlace[]> {
    const radiusM = radiusKm * 1000;

    const query = type === 'attraction'
      ? this.buildAttractionQuery(lat, lng, radiusM)
      : this.buildRestaurantQuery(lat, lng, radiusM);

    const body = new URLSearchParams({ data: query });

    let data: OverpassResponse | null = null;
    for (const mirror of OVERPASS_MIRRORS) {
      try {
        const response = await fetch(mirror, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'User-Agent': USER_AGENT,
          },
          body: body.toString(),
          signal: AbortSignal.timeout(90_000),
        });

        if (!response.ok) {
          this.logger.warn(`Overpass mirror ${mirror} error: ${response.status}, trying next`);
          continue;
        }

        data = await response.json() as OverpassResponse;
        break;
      } catch (error) {
        this.logger.warn(`Overpass mirror ${mirror} failed: ${String(error)}, trying next`);
      }
    }

    if (!data) {
      this.logger.warn('All Overpass mirrors failed');
      return [];
    }

    const places = this.parseElements(data.elements ?? [], type);
    this.logger.log(`Overpass: ${places.length} ${type}s within ${radiusKm}km`);
    return places;
  }

  private buildAttractionQuery(lat: number, lng: number, radiusM: number): string {
    // Use nwr (node/way/relation) so major landmarks like Sagrada Família (ways) are included.
    // Whitelist specific tourism values to exclude hotels/hostels/apartments.
    // NOTE: Do NOT use [maxsize:...] — it silently returns 0 elements when exceeded.
    const tourismValues = 'museum|attraction|artwork|gallery|viewpoint|monument|castle|ruins|zoo|aquarium|theme_park|garden|beach|lighthouse|memorial';
    const historicValues = 'castle|monument|memorial|ruins|monastery|church|cathedral|archaeological_site|fort|palace|city_gate';
    return `[out:json][timeout:90];(nwr["tourism"~"${tourismValues}"](around:${radiusM},${lat},${lng});nwr["historic"~"${historicValues}"](around:${radiusM},${lat},${lng});nwr["leisure"~"park|garden|beach|nature_reserve"](around:${radiusM},${lat},${lng});nwr["amenity"~"place_of_worship|theatre|cinema"](around:${radiusM},${lat},${lng}););out center 100;`;
  }

  private buildRestaurantQuery(lat: number, lng: number, radiusM: number): string {
    return `[out:json][timeout:90];(nwr["amenity"~"restaurant|cafe|bar|pub"](around:${radiusM},${lat},${lng}););out center 100;`;
  }

  private static readonly ACCOMMODATION_PATTERN = /\b(hotel|hostel|motel|pension|pensión|hostal|aparthotel|inn|lodge|resort|suites?|b&b|bed and breakfast|guesthouse|guest house|apartaments?|airbnb)\b/i;

  private parseElements(elements: OverpassElement[], type: 'attraction' | 'restaurant'): OverpassPlace[] {
    const seen = new Set<string>();
    const places: OverpassPlace[] = [];

    for (const el of elements) {
      const name = el.tags?.name || el.tags?.['name:en'];
      if (!name || name.length < 3) continue;

      // For attractions, skip accommodation entries that slipped through
      if (type === 'attraction') {
        const tourism = el.tags?.tourism ?? '';
        if (['hotel', 'hostel', 'motel', 'guest_house', 'apartment', 'camp_site', 'caravan_site', 'chalet', 'holiday_cottage', 'villa'].includes(tourism)) continue;
        if (OverpassStep.ACCOMMODATION_PATTERN.test(name)) continue;
      }

      // Skip nameless or generic entries
      const key = name.toLowerCase().trim();
      if (seen.has(key)) continue;
      seen.add(key);

      const lat = (el.type === 'way' || el.type === 'relation') ? el.center?.lat : el.lat;
      const lng = (el.type === 'way' || el.type === 'relation') ? el.center?.lon : el.lon;
      if (!lat || !lng) continue;

      const osmCategory = this.extractCategory(el.tags, type);
      const address = this.extractAddress(el.tags);

      places.push({
        sourceId: `osm-${el.type}-${el.id}`,
        name,
        address,
        lat,
        lng,
        osmCategory,
      });
    }

    // Sort by rating/importance signals (named places with addr first)
    return places.sort((a, b) => {
      const aScore = (a.address ? 1 : 0) + (a.osmCategory ? 1 : 0);
      const bScore = (b.address ? 1 : 0) + (b.osmCategory ? 1 : 0);
      return bScore - aScore;
    });
  }

  private extractCategory(tags: Record<string, string> | undefined, type: 'attraction' | 'restaurant'): string | null {
    if (!tags) return null;

    if (type === 'restaurant') {
      const amenity = tags.amenity;
      if (amenity === 'restaurant') return 'restoranas';
      if (amenity === 'cafe') return 'kavinė';
      if (amenity === 'bar' || amenity === 'pub') return 'baras';
      if (amenity === 'fast_food') return 'greitas maistas';
      if (amenity === 'bakery') return 'kepykla';
      return 'restoranas';
    }

    // For attractions, check multiple tag keys
    const tourism = tags.tourism;
    if (tourism && TOURISM_CATEGORY[tourism]) return TOURISM_CATEGORY[tourism];

    const historic = tags.historic;
    if (historic === 'castle') return 'pilis';
    if (historic === 'monument' || historic === 'memorial') return 'paminklas';
    if (historic === 'ruins') return 'griuvėsiai';
    if (historic === 'monastery') return 'vienuolynas';

    const amenity = tags.amenity;
    if (amenity === 'place_of_worship') {
      const religion = tags.religion;
      if (religion === 'christian') {
        const worship = tags.place_of_worship || tags.building;
        if (worship === 'cathedral') return 'katedra';
        return 'bažnyčia';
      }
      if (religion === 'muslim') return 'mečetė';
      if (religion === 'jewish') return 'sinagoga';
      if (religion === 'buddhist') return 'šventykla';
      return 'bažnyčia';
    }
    if (amenity === 'theatre') return 'teatras';
    if (amenity === 'cinema') return 'kinas';
    if (amenity === 'library') return 'biblioteka';
    if (amenity === 'marketplace') return 'turgus';

    const leisure = tags.leisure;
    if (leisure === 'park' || leisure === 'garden') return 'parkas';
    if (leisure === 'beach') return 'paplūdimys';
    if (leisure === 'stadium') return 'stadionas';
    if (leisure === 'nature_reserve') return 'gamtos rezervatas';

    const building = tags.building;
    if (building === 'cathedral') return 'katedra';
    if (building === 'church') return 'bažnyčia';
    if (building === 'mosque') return 'mečetė';
    if (building === 'palace') return 'rūmai';

    return 'lankytina vieta';
  }

  private extractAddress(tags: Record<string, string> | undefined): string | null {
    if (!tags) return null;
    const parts = [
      tags['addr:street'],
      tags['addr:housenumber'],
      tags['addr:city'],
    ].filter(Boolean);
    return parts.length > 0 ? parts.join(', ') : null;
  }
}

interface OverpassResponse {
  elements?: OverpassElement[];
}

interface OverpassElement {
  type: 'node' | 'way' | 'relation';
  // relations also use center for coordinates
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
}
