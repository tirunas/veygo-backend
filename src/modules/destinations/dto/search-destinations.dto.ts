import { IsOptional, IsString, IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class SearchDestinationsDto {
  @IsOptional()
  @IsString()
  q?: string;

  @IsOptional()
  @IsString()
  styles?: string; // comma-separated: "culture,food"

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  maxBudget?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  maxFlightH?: number;

  @IsOptional()
  @IsString()
  months?: string; // comma-separated Lithuanian month names: "Sausis,Vasaris"

  @IsOptional()
  @IsString()
  weather?: string; // "warm" | "cool"
}
