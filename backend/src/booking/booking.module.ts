import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { BookingGateway } from './booking-gateway/booking-gateway.service';
import { LockExpiryCron } from './lock-expiry.cron';
import { PrismaService } from '../prisma/prisma.service';
 
@Module({
  imports: [ScheduleModule.forRoot()],
  providers: [BookingGateway, LockExpiryCron, PrismaService],
})
export class BookingModule {}