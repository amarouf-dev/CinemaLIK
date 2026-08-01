import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { BookingGateway } from './booking-gateway/booking-gateway.service';
import { CreateBookingDto } from './dto/create-booking.dto';

@Injectable()
export class BookingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly gateway: BookingGateway,
  ) {}

  async create(userId: number, dto: CreateBookingDto) {
    const { movieId, date, time, seats } = dto;

    // ── 1. Find the screening ──────────────────────────────────────────────
    const startsAt = this.parseScreeningDate(date, time);
    const oneMinuteLater = new Date(startsAt.getTime() + 60000);

    const screening = await this.prisma.screening.findFirst({
      where: { movieId, startsAt: { gte: startsAt, lt: oneMinuteLater } },
    });

    if (!screening) throw new NotFoundException('Screening not found.');

    // ── 2. Verify all seats exist and aren't already confirmed ────────────
    const seatRecords = await this.prisma.seat.findMany({
      where: { id: { in: seats }, screeningId: screening.id },
    });

    if (seatRecords.length !== seats.length)
      throw new BadRequestException('One or more seats were not found.');

    const unavailable = seatRecords.filter((s) => s.status === 'CONFIRMED');
    if (unavailable.length > 0)
      throw new BadRequestException('One or more seats are already booked.');

    // ── 3. Create booking + confirm seats in a transaction ─────────────────
    const booking = await this.prisma.$transaction(async (tx) => {
      const totalPrice = seatRecords.length * screening.price;

      const newBooking = await tx.booking.create({
        data: { userId, screeningId: screening.id, totalPrice },
      });

      await tx.seat.updateMany({
        where: { id: { in: seats } },
        data: {
          status: 'CONFIRMED',
          bookingId: newBooking.id,
          lockedBy: null,
          lockExpiresAt: null,
        },
      });

      return newBooking;
    });

    // ── 4. Broadcast confirmed seats to everyone still in the room ─────────
    for (const seatId of seats) {
      this.gateway.server
        .to(screening.id)
        .emit('seat:updated', { seatId, status: 'CONFIRMED' });
    }

    return { id: booking.id };
  }

  // ── GET /bookings/:id ────────────────────────────────────────────────────
  async findOne(id: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id },
      include: {
        seats: {
          select: { row: true, number: true, label: true },
        },
        screening: {
          include: { movie: true },
        },
      },
    });

    if (!booking) throw new NotFoundException('Booking not found.');

    return {
      id: booking.id,
      totalPrice: booking.totalPrice,
      createdAt: booking.createdAt,
      movie: {
        title: booking.screening.movie.title,
        poster: booking.screening.movie.poster,
      },
      screening: {
        startsAt: booking.screening.startsAt,
        price: booking.screening.price,
      },
      seats: booking.seats.map((s) => s.label ?? `${s.row}${s.number}`),
    };
  }

  // ── Helper ───────────────────────────────────────────────────────────────
  private parseScreeningDate(dateLabel: string, time: string): Date {
    const dayNumber = parseInt(dateLabel.split(' ')[1], 10);
    const [hours, minutes] = time.split(':').map(Number);

    const now = new Date();
    const result = new Date(
      now.getFullYear(),
      now.getMonth(),
      dayNumber,
      hours,
      minutes,
      0,
      0,
    );

    if (result < now) result.setMonth(result.getMonth() + 1);

    return result;
  }
}
