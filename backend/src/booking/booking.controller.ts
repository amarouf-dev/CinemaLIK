import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { BookingsService } from './booking.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { FindScreeningDto } from './dto/find-screening.dto';
import { JwtAuthGuard } from 'src/auth/jwt/jwt-auth.guard';
import { AuthRequest } from '../auth/types/auth-request';

@UseGuards(JwtAuthGuard)
@Controller('bookings')
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  // GET /bookings/screening?movieId=550&startsAt=2026-08-02T20:45:00.000Z
  // Resolves (movie, showtime) to a screening id — the room key the seat map
  // socket joins. Declared before ':id' so it isn't swallowed by that route.
  @Get('screening')
  findScreening(@Query() query: FindScreeningDto) {
    return this.bookingsService.findOrCreateScreening(
      query.movieId,
      new Date(query.startsAt),
    );
  }

  // POST /bookings
  // Body: { screeningId, seats: string[] }
  @Post()
  create(@Body() dto: CreateBookingDto, @Req() req: AuthRequest) {
    return this.bookingsService.create(req.user.id, dto);
  }

  // GET /bookings/:id — fetch a single booking (used by confirmation page)
  @Get(':id')
  findOne(@Param('id') id: string, @Req() req: AuthRequest) {
    return this.bookingsService.findOne(id, req.user.id);
  }
}
