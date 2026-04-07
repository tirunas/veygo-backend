import { Module } from '@nestjs/common';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { ConfigModule } from './config/config.module';
import { PrismaModule } from './prisma/prisma.module';
import { CommonModule } from './common/common.module';
import { HealthModule } from './health/health.module';
import { AuthModule } from './modules/auth/auth.module';
import { DestinationsModule } from './modules/destinations/destinations.module';
import { GeoMatchingModule } from './modules/geo-matching/geo-matching.module';
import { PricingModule } from './modules/pricing/pricing.module';
import { SearchModule } from './modules/search/search.module';
import { JobsModule } from './modules/jobs/jobs.module';
import { PlansModule } from './modules/plans/plans.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { AttractionsModule } from './modules/attractions/attractions.module';
import { RestaurantsModule } from './modules/restaurants/restaurants.module';
import { HotelsModule } from './modules/hotels/hotels.module';
import { ItinerariesModule } from './modules/itineraries/itineraries.module';
import { ReadyPlansModule } from './modules/ready-plans/ready-plans.module';
import { ExperiencesModule } from './modules/experiences/experiences.module';
import { TestimonialsModule } from './modules/testimonials/testimonials.module';
import { PipelineModule } from './modules/pipeline/pipeline.module';
import { ConfigService } from '@nestjs/config';
import { WinstonModule } from 'nest-winston';
import * as winston from 'winston';

@Module({
  imports: [
    ConfigModule,
    WinstonModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const isProduction = config.get<string>('NODE_ENV') === 'production';
        return {
          transports: [
            new winston.transports.Console({
              format: isProduction
                ? winston.format.combine(
                    winston.format.timestamp(),
                    winston.format.errors({ stack: true }),
                    winston.format.json(),
                  )
                : winston.format.combine(
                    winston.format.timestamp(),
                    winston.format.errors({ stack: true }),
                    winston.format.colorize(),
                    winston.format.simple(),
                  ),
            }),
          ],
          levels: winston.config.npm.levels,
        };
      },
    }),
    PrismaModule,
    CommonModule,
    HealthModule,
    AuthModule,
    DestinationsModule,
    GeoMatchingModule,
    PricingModule,
    SearchModule,
    JobsModule,
    PlansModule,
    PaymentsModule,
    AttractionsModule,
    RestaurantsModule,
    HotelsModule,
    ItinerariesModule,
    ReadyPlansModule,
    ExperiencesModule,
    TestimonialsModule,
    PipelineModule,
    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        throttlers: [
          {
            ttl: config.get<number>('THROTTLE_TTL') ?? 60000,
            limit: config.get<number>('THROTTLE_LIMIT') ?? 200,
          },
        ],
      }),
    }),
  ],
  providers: [
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}
