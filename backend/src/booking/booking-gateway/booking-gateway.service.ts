import {
  WebSocketGateway,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
} from '@nestjs/websockets';
import { MessageBody, SubscribeMessage } from '@nestjs/websockets';
import { Socket } from 'socket.io';

@WebSocketGateway({
  cors: {
    origin: 'http://localhost:5173', // FrontEnd url
  },
})
export class BookingGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  handleConnection() {
    console.log('Client connected');
  }

  handleDisconnect() {
    console.log('Client disconnected');
  }

  @SubscribeMessage('join-room')
  async handleHello(
    @MessageBody() room: string,
    @ConnectedSocket() client: Socket,
  ) {
    await client.join(room);

    console.log(`client <${client.id}> joined room ${room}`);

    return {
      event: 'helloback',
      data: 'hello react !',
    };
  }
}
