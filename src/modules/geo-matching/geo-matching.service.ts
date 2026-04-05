import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { haversineDistanceKm } from './haversine';

@Injectable()
export class GeoMatchingService {
  private readonly logger = new Logger(GeoMatchingService.name);

  constructor(private readonly prisma: PrismaService) {}

  async recomputeForDestination(destinationId: string): Promise<void> {
    const destinations = await this.prisma.destination.findMany({
      where: { id: destinationId },
      select: { id: true, lat: true, lng: true, radiusKm: true },
    });

    const dest = destinations[0];
    if (!dest || dest.lat == null || dest.lng == null) {
      this.logger.warn(`Skipping geo-match for ${destinationId}: no coordinates`);
      return;
    }

    const [attractions, restaurants, hotels] = await Promise.all([
      this.prisma.attraction.findMany({ select: { id: true, lat: true, lng: true } }),
      this.prisma.restaurant.findMany({ select: { id: true, lat: true, lng: true } }),
      this.prisma.hotel.findMany({ select: { id: true, lat: true, lng: true } }),
    ]);

    const matchingAttractions = attractions.filter(
      (a) => haversineDistanceKm(dest.lat!, dest.lng!, a.lat, a.lng) <= dest.radiusKm,
    );
    const matchingRestaurants = restaurants.filter(
      (r) => haversineDistanceKm(dest.lat!, dest.lng!, r.lat, r.lng) <= dest.radiusKm,
    );
    const matchingHotels = hotels.filter(
      (h) => haversineDistanceKm(dest.lat!, dest.lng!, h.lat, h.lng) <= dest.radiusKm,
    );

    await Promise.all([
      this.prisma.destinationAttraction.deleteMany({ where: { destinationId } }),
      this.prisma.destinationRestaurant.deleteMany({ where: { destinationId } }),
      this.prisma.destinationHotel.deleteMany({ where: { destinationId } }),
    ]);

    await Promise.all([
      this.prisma.destinationAttraction.createMany({
        data: matchingAttractions.map((a) => ({ destinationId, attractionId: a.id })),
        skipDuplicates: true,
      }),
      this.prisma.destinationRestaurant.createMany({
        data: matchingRestaurants.map((r) => ({ destinationId, restaurantId: r.id })),
        skipDuplicates: true,
      }),
      this.prisma.destinationHotel.createMany({
        data: matchingHotels.map((h) => ({ destinationId, hotelId: h.id })),
        skipDuplicates: true,
      }),
    ]);

    this.logger.log(
      `Recomputed ${destinationId}: ${matchingAttractions.length} attractions, ` +
      `${matchingRestaurants.length} restaurants, ${matchingHotels.length} hotels`,
    );
  }

  async recomputeForAttraction(attractionId: string): Promise<void> {
    const attraction = await this.prisma.attraction.findMany({
      where: { id: attractionId },
      select: { id: true, lat: true, lng: true },
    });
    if (!attraction[0]) return;

    const destinations = await this.prisma.destination.findMany({
      select: { id: true, lat: true, lng: true, radiusKm: true },
    });

    await this.prisma.destinationAttraction.deleteMany({ where: { attractionId } });

    const matches = destinations.filter(
      (d) =>
        d.lat != null &&
        d.lng != null &&
        haversineDistanceKm(d.lat, d.lng, attraction[0].lat, attraction[0].lng) <= d.radiusKm,
    );

    await this.prisma.destinationAttraction.createMany({
      data: matches.map((d) => ({ destinationId: d.id, attractionId })),
      skipDuplicates: true,
    });
  }

  async recomputeForRestaurant(restaurantId: string): Promise<void> {
    const restaurant = await this.prisma.restaurant.findMany({
      where: { id: restaurantId },
      select: { id: true, lat: true, lng: true },
    });
    if (!restaurant[0]) return;

    const destinations = await this.prisma.destination.findMany({
      select: { id: true, lat: true, lng: true, radiusKm: true },
    });

    await this.prisma.destinationRestaurant.deleteMany({ where: { restaurantId } });

    const matches = destinations.filter(
      (d) =>
        d.lat != null &&
        d.lng != null &&
        haversineDistanceKm(d.lat, d.lng, restaurant[0].lat, restaurant[0].lng) <= d.radiusKm,
    );

    await this.prisma.destinationRestaurant.createMany({
      data: matches.map((d) => ({ destinationId: d.id, restaurantId })),
      skipDuplicates: true,
    });
  }

  async recomputeForHotel(hotelId: string): Promise<void> {
    const hotel = await this.prisma.hotel.findMany({
      where: { id: hotelId },
      select: { id: true, lat: true, lng: true },
    });
    if (!hotel[0]) return;

    const destinations = await this.prisma.destination.findMany({
      select: { id: true, lat: true, lng: true, radiusKm: true },
    });

    await this.prisma.destinationHotel.deleteMany({ where: { hotelId } });

    const matches = destinations.filter(
      (d) =>
        d.lat != null &&
        d.lng != null &&
        haversineDistanceKm(d.lat, d.lng, hotel[0].lat, hotel[0].lng) <= d.radiusKm,
    );

    await this.prisma.destinationHotel.createMany({
      data: matches.map((d) => ({ destinationId: d.id, hotelId })),
      skipDuplicates: true,
    });
  }

  async recomputeAll(): Promise<void> {
    const destinations = await this.prisma.destination.findMany({
      select: { id: true, lat: true, lng: true, radiusKm: true },
    });

    for (const dest of destinations) {
      await this.recomputeForDestination(dest.id);
    }

    this.logger.log(`recomputeAll complete — processed ${destinations.length} destinations`);
  }
}
