import {
  WebSocketGateway,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { PrismaService } from '../../prisma/prisma.service';
import { Injectable } from '@nestjs/common';

@Injectable()
@WebSocketGateway({ cors: { origin: 'http://localhost:5173' } })
export class BookingGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  constructor(private readonly prisma: PrismaService) {}

  // ── Connection ─────────────────────────────────────────────────────────────

  handleConnection(@ConnectedSocket() client: Socket) {
    console.log(`Client connected: ${client.id}`);
  }

  async handleDisconnect(@ConnectedSocket() client: Socket) {
    console.log(`Client disconnected: ${client.id}`);

    // Release all seats this socket was holding
    const released = await this.prisma.seat.findMany({
      where: { lockedBy: client.id, status: 'LOCKED' },
    });

    if (released.length === 0) return;

    await this.prisma.seat.updateMany({
      where: { lockedBy: client.id, status: 'LOCKED' },
      data: { status: 'AVAILABLE', lockedBy: null, lockExpiresAt: null },
    });

    // Notify everyone in the affected screening rooms
    for (const seat of released) {
      this.server
        .to(seat.screeningId)
        .emit('seat:updated', { seatId: seat.id, status: 'AVAILABLE' });
    }
  }

  // ── Join room ──────────────────────────────────────────────────────────────
  // Client emits: { screeningId }
  // Server responds with the full seat map for that screening

  @SubscribeMessage('join-room')
  async handleJoinRoom(
    @MessageBody() screeningId: string,
    @ConnectedSocket() client: Socket,
  ) {
    await client.join(screeningId);
    console.log(`Client ${client.id} joined room ${screeningId}`);

    // Send the full seat map to the client that just joined
    const seats = await this.prisma.seat.findMany({
      where: { screeningId },
      orderBy: [{ row: 'asc' }, { number: 'asc' }],
    });

    // Group into rows: [{ row: 'A', seats: [...] }, ...]
    const grouped = this.groupByRow(seats);

    client.emit('seats:init', grouped);
  }

  // ── Lock seat ──────────────────────────────────────────────────────────────
  // Client emits: { seatId, screeningId }

  @SubscribeMessage('seat:lock')
  async handleLock(
    @MessageBody() body: { seatId: string; screeningId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const { seatId, screeningId } = body;

    const seat = await this.prisma.seat.findUnique({ where: { id: seatId } });

    // Reject if already locked or confirmed by someone else
    if (!seat || seat.status !== 'AVAILABLE') {
      client.emit('seat:lock-failed', {
        seatId,
        reason: 'Seat is no longer available.',
      });
      return;
    }

    const lockExpiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    await this.prisma.seat.update({
      where: { id: seatId },
      data: { status: 'LOCKED', lockedBy: client.id, lockExpiresAt },
    });

    // Broadcast to everyone in the room (including the sender)
    this.server
      .to(screeningId)
      .emit('seat:updated', { seatId, status: 'LOCKED' });
  }

  // ── Unlock seat ────────────────────────────────────────────────────────────
  // Client emits: { seatId, screeningId }

  @SubscribeMessage('seat:unlock')
  async handleUnlock(
    @MessageBody() body: { seatId: string; screeningId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const { seatId, screeningId } = body;

    const seat = await this.prisma.seat.findUnique({ where: { id: seatId } });

    // Only the socket that locked it can unlock it
    if (!seat || seat.lockedBy !== client.id) return;

    await this.prisma.seat.update({
      where: { id: seatId },
      data: { status: 'AVAILABLE', lockedBy: null, lockExpiresAt: null },
    });

    this.server
      .to(screeningId)
      .emit('seat:updated', { seatId, status: 'AVAILABLE' });
  }

  // ── Helper ─────────────────────────────────────────────────────────────────

  private groupByRow(seats: any[]): any[][] {
    const map = new Map<string, any[]>();
    for (const seat of seats) {
      if (!map.has(seat.row)) map.set(seat.row, []);
      map.get(seat.row)!.push(seat);
    }
    return Array.from(map.values());
  }

  // Called by the cron service to broadcast expired seats
  async releaseExpiredLocks() {
    const expired = await this.prisma.seat.findMany({
      where: { status: 'LOCKED', lockExpiresAt: { lt: new Date() } },
    });

    if (expired.length === 0) return;

    await this.prisma.seat.updateMany({
      where: { status: 'LOCKED', lockExpiresAt: { lt: new Date() } },
      data: { status: 'AVAILABLE', lockedBy: null, lockExpiresAt: null },
    });

    for (const seat of expired) {
      this.server
        .to(seat.screeningId)
        .emit('seat:updated', { seatId: seat.id, status: 'AVAILABLE' });
    }

    console.log(`Released ${expired.length} expired seat lock(s).`);
  }
}
