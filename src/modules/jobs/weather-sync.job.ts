import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { DestinationsService } from '../destinations/destinations.service';

const MOCK_WEATHER_VALUES = [
  '18°C Sunny',
  '22°C Cloudy',
  '15°C Rainy',
  '25°C Clear',
  '20°C Partly Cloudy',
];

@Injectable()
export class WeatherSyncJob {
  private readonly logger = new Logger(WeatherSyncJob.name);

  constructor(private readonly destinationsService: DestinationsService) {}

  @Cron(CronExpression.EVERY_30_MINUTES)
  async syncWeather(): Promise<void> {
    this.logger.log('Syncing weather for all destinations');
    const destinations = await this.destinationsService.findAll();

    await Promise.all(
      destinations.map((destination, index) => {
        const weather = MOCK_WEATHER_VALUES[index % MOCK_WEATHER_VALUES.length];
        return this.destinationsService.updateDestination(destination.id, {
          currentWeather: weather,
        });
      }),
    );

    this.logger.log(`Weather synced for ${destinations.length} destinations`);
  }
}
