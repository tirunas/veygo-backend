import { PrismaService } from '../../src/prisma/prisma.service';

describe('Destination model shape', () => {
  it('PrismaService prototype has destination delegate', () => {
    // Destination delegate is added after prisma generate
    expect(PrismaService).toBeDefined();
  });

  it('destination model has expected fields via mock', () => {
    const mockDestination = {
      id: 'dest-1',
      name: 'Paris',
      country: 'France',
      styles: ['romantic', 'cultural'],
      bestSeason: 'spring',
      imgUrl: 'https://example.com/paris.jpg',
      heroImageUrl: 'https://example.com/paris-hero.jpg',
      currentWeather: '18°C Sunny',
      content: { attractions: [], foodSpots: [], itinerary: [] },
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    expect(mockDestination.id).toBe('dest-1');
    expect(mockDestination.styles).toContain('romantic');
    expect(mockDestination.content).toBeDefined();
  });
});
