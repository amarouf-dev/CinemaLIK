import { Type } from 'class-transformer';
import { IsDateString, IsInt } from 'class-validator';

export class FindScreeningDto {
  @Type(() => Number)
  @IsInt()
  movieId: number;

  @IsDateString()
  startsAt: string; // ISO datetime, e.g. "2026-08-02T20:45:00.000Z"
}
