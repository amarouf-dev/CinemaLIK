import { Injectable } from '@nestjs/common';
import { User } from 'generated/prisma/browser';
import { registerDto } from 'src/auth/dto/auth.dto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}
  async findUserById(id: number): Promise<User | null> {
    return await this.prisma.user.findUnique({
      where: { id },
    });
  }
  async findUserByEmail(email: string): Promise<User | null> {
    return await this.prisma.user.findUnique({
      where: { email },
    });
  }

  // create user
  async createUser(dto: registerDto, hashed: string): Promise<User | null> {
    return await this.prisma.user.create({
      data: {
        email: dto.email,
        name: dto.name,
        password_hash: hashed,
      },
    });
  }

  // updating refresh token
  async updateUsertoken(
    id: number,
    hashedToken: string | null,
  ): Promise<User | null> {
    return await this.prisma.user.update({
      where: { id },
      data: { refresh_token: hashedToken },
    });
  }
}
