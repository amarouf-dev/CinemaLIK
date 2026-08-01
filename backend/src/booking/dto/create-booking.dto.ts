import { IsString, IsArray, IsDateString } from 'class-validator';

export class CreateBookingDto {
  @IsString()
  movieId: number;

  @IsDateString()
  date: string; // "Wed 25" — parse to full date in service

  @IsString()
  time: string; // "20:45"

  @IsArray()
  @IsString({ each: true })
  seats: string[]; // seat ids: ["seat-uuid-1", "seat-uuid-2"]
}
