import { PrismaService } from '../../prisma/prisma.service';

/**
 * Base repository for POI (Point of Interest) entities.
 * Handles shared logic for Attractions, Restaurants, and Hotels.
 *
 * Subclasses must:
 * - Implement getTableName() to return the Prisma table name
 * - Implement getJoinTableName() to return the junction table name (e.g., 'destinationAttraction')
 * - Implement getJoinTableIdField() to return the ID field in the junction table
 */
export abstract class PoiRepositoryBase {
  constructor(protected readonly prisma: PrismaService) {}

  /**
   * Get the Prisma table name for the POI entity (e.g., 'attraction', 'restaurant')
   */
  protected abstract getTableName(): 'attraction' | 'restaurant' | 'hotel';

  /**
   * Get the junction table name linking POI to destinations (e.g., 'destinationAttraction')
   */
  protected abstract getJoinTableName(): 'destinationAttraction' | 'destinationRestaurant' | 'destinationHotel';

  /**
   * Get the ID field name in the junction table (e.g., 'attractionId', 'restaurantId')
   */
  protected abstract getJoinTableIdField(): string;

  /**
   * Find all records linked to a destination, ordered by name ascending.
   */
  async findByDestination(destinationId: string) {
    const table = this.prisma[this.getTableName()];
    return table.findMany({
      where: {
        destinations: { some: { destinationId } },
      },
      orderBy: { name: 'asc' },
    });
  }

  /**
   * Find a single record by ID.
   */
  async findById(id: string) {
    const table = this.prisma[this.getTableName()];
    return table.findUnique({ where: { id } });
  }

  /**
   * Find all destination IDs linked to a POI record.
   */
  async findLinkedDestinationIds(poiId: string): Promise<string[]> {
    const joinTable = this.prisma[this.getJoinTableName()];
    const idField = this.getJoinTableIdField();

    const rows = await joinTable.findMany({
      where: { [idField]: poiId },
      select: { destinationId: true },
    });
    return rows.map((r) => r.destinationId);
  }

  /**
   * Delete all junction table entries and the POI record itself.
   */
  async delete(id: string): Promise<void> {
    const joinTable = this.prisma[this.getJoinTableName()];
    const idField = this.getJoinTableIdField();

    await joinTable.deleteMany({ where: { [idField]: id } });
    const table = this.prisma[this.getTableName()];
    await table.delete({ where: { id } });
  }
}
