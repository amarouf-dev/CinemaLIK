import { Module } from '@nestjs/common';
import { BookingController } from './booking.controller';
import { BookingService } from './booking.service';
import { BookingGateway } from './booking-gateway/booking-gateway.service';

@Module({
  controllers: [BookingController],
  providers: [BookingService, BookingGateway],
})
export class BookingModule {}
