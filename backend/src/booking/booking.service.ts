import {
  Injectable,
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { BookingGateway } from './booking-gateway/booking-gateway.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { MoviesService } from '../movies/movies.service';

const ROWS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
const SEATS_PER_ROW = 12;

@Injectable()
export class BookingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly gateway: BookingGateway,
    private readonly movies: MoviesService,
  ) {}

  // ── Resolve a (movie, showtime) pair to a screening ──────────────────────
  // The UI offers any date/time combination, so a screening (and its seat
  // grid) is provisioned on first request rather than seeded up front.
  async findOrCreateScreening(movieId: number, startsAt: Date) {
    const existing = await this.prisma.screening.findFirst({
      where: { movieId, startsAt },
    });

    if (existing)
      return {
        id: existing.id,
        startsAt: existing.startsAt,
        price: existing.price,
      };

    // The Screening -> Movie relation needs the film to exist locally first.
    const details = await this.movies.getMovieById(String(movieId));

    await this.prisma.movie.upsert({
      where: { id: movieId },
      update: {},
      create: {
        id: movieId,
        title: details.title,
        poster: details.poster,
        rating: details.rating ?? 0,
        duration: details.duration ?? 0,
      },
    });

    const screening = await this.prisma.screening.create({
      data: { movieId, startsAt },
    });

    await this.prisma.seat.createMany({
      data: ROWS.flatMap((row) =>
        Array.from({ length: SEATS_PER_ROW }, (_, i) => ({
          screeningId: screening.id,
          row,
          number: i + 1,
          label: i + 1,
        })),
      ),
    });

    return {
      id: screening.id,
      startsAt: screening.startsAt,
      price: screening.price,
    };
  }

  async create(userId: number, dto: CreateBookingDto) {
    const { screeningId, seats, socketId } = dto;

    const screening = await this.prisma.screening.findUnique({
      where: { id: screeningId },
    });

    if (!screening) throw new NotFoundException('Screening not found.');

    // Everything below runs in one transaction: the availability check and the
    // claim have to be atomic, otherwise two concurrent confirms both pass.
    const booking = await this.prisma.$transaction(async (tx) => {
      const seatRecords = await tx.seat.findMany({
        where: { id: { in: seats }, screeningId },
      });

      if (seatRecords.length !== seats.length)
        throw new BadRequestException('One or more seats were not found.');

      // A seat locked by another socket belongs to someone mid-checkout.
      const unavailable = seatRecords.filter(
        (s) =>
          s.status === 'CONFIRMED' ||
          (s.status === 'LOCKED' && s.lockedBy !== socketId),
      );

      if (unavailable.length > 0)
        throw new ConflictException('One or more seats are already taken.');

      const newBooking = await tx.booking.create({
        data: {
          userId,
          screeningId,
          totalPrice: seatRecords.length * screening.price,
        },
      });

      // Re-assert the condition in the write itself. A concurrent transaction
      // that claimed the same seats first will have moved them to CONFIRMED,
      // so the row count comes back short and the whole thing rolls back.
      const claimed = await tx.seat.updateMany({
        where: {
          id: { in: seats },
          screeningId,
          OR: [
            { status: 'AVAILABLE' },
            { status: 'LOCKED', lockedBy: socketId },
          ],
        },
        data: {
          status: 'CONFIRMED',
          bookingId: newBooking.id,
          lockedBy: null,
          lockExpiresAt: null,
        },
      });

      if (claimed.count !== seats.length)
        throw new ConflictException('One or more seats were just taken.');

      return newBooking;
    });

    // ── Broadcast confirmed seats to everyone still in the room ─────────
    for (const seatId of seats) {
      this.gateway.server
        .to(screeningId)
        .emit('seat:updated', { seatId, status: 'CONFIRMED' });
    }

    return { id: booking.id };
  }

  // ── GET /bookings/:id ────────────────────────────────────────────────────
  async findOne(id: string, userId: number) {
    const booking = await this.prisma.booking.findUnique({
      where: { id },
      include: {
        seats: { select: { row: true, number: true } },
        screening: { include: { movie: true } },
      },
    });

    // Scoped to the owner, so knowing a booking id isn't enough to read
    // someone else's reservation.
    if (!booking || booking.userId !== userId)
      throw new NotFoundException('Booking not found.');

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
      seats: booking.seats.map((s) => `${s.row}${s.number}`),
    };
  }
}
