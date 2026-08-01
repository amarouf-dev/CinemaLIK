
import {
  ArrayNotEmpty,
  IsArray,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';

export class CreateBookingDto {
  @IsUUID()
  screeningId: string;

  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  seats: string[]; // seat ids: ["seat-uuid-1", "seat-uuid-2"]

  // Socket that holds the locks on these seats, so the confirm can tell the
  // caller's own locks apart from someone else's.
  @IsOptional()
  @IsString()
  socketId?: string;
}
