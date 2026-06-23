import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from 'src/auth/jwt/jwt-auth.guard';
import { AuthRequest } from '../auth/types/auth-request';

@Controller('users')
export class UsersController {
  constructor(private readonly usersservice: UsersService) {}

  @UseGuards(JwtAuthGuard)
  @Get('me')
  getUserData(@Req() req: AuthRequest) {
    return this.usersservice.getUserData(req.user.id);
  }
}
