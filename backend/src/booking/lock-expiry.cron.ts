import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { BookingGateway } from './booking-gateway/booking-gateway.service';

@Injectable()
export class LockExpiryCron {
  constructor(private readonly gateway: BookingGateway) {}

  // Runs every minute — checks for locks past their expiry time
  @Cron(CronExpression.EVERY_MINUTE)
  async expireLocks() {
    await this.gateway.releaseExpiredLocks();
  }
}
