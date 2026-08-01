import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { BookingsService } from './booking.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { JwtAuthGuard } from 'src/auth/jwt/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('bookings')
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  // POST /bookings
  // Body: { movieId, date, time, seats: string[] }
  @Post()
  create(@Body() dto: CreateBookingDto, @Request() req) {
    // TODO: replace hardcoded userId with req.user.id once auth is set up
    const userId = req.user?.id;
    return this.bookingsService.create(userId, dto);
  }

  // GET /bookings/:id — fetch a single booking (used by confirmation page)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.bookingsService.findOne(id);
  }
}
