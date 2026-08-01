import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { BookingsController } from './booking.controller';
import { BookingsService } from './booking.service';
import { BookingGateway } from './booking-gateway/booking-gateway.service';
import { LockExpiryCron } from './lock-expiry.cron';
import { PrismaService } from '../prisma/prisma.service';
import { MoviesModule } from '../movies/movies.module';

@Module({
  imports: [ScheduleModule.forRoot(), MoviesModule],
  controllers: [BookingsController],
  providers: [BookingsService, BookingGateway, LockExpiryCron, PrismaService],
})
export class BookingModule {}
