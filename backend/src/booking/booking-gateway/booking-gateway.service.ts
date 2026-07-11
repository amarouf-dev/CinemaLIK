import {
  WebSocketGateway,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { MessageBody, SubscribeMessage } from '@nestjs/websockets';

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

  @SubscribeMessage('hello')
  handleHello(@MessageBody() body: string) {
    console.log('here');
    console.log(body);
  }
}
