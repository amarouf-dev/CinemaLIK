import { Test, TestingModule } from '@nestjs/testing';
import { BookingGateway } from './booking-gateway.service';

describe('BookingGateway', () => {
  let service: BookingGateway;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [BookingGateway],
    }).compile();

    service = module.get<BookingGateway>(BookingGateway);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
