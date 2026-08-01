import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { loginDto, registerDto } from './dto/auth.dto';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaClientKnownRequestError } from '../../generated/prisma/internal/prismaNamespace';
import { UsersService } from 'src/users/users.service';
import { Response, Request } from 'express';

interface JwtPayload {
  sub: number;
  username: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly Jwt: JwtService,
    private readonly configService: ConfigService,
    private readonly userservice: UsersService,
  ) {}
  private readonly SALT = 10;

  // send token via cookie
  sendTokenViaCookie(res: Response, refreshToken: string) {
    res.cookie('refresh_token', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/',
    });
  }

  async generateTokens(
    payload: any,
  ): Promise<{ refreshToken: string; accessToken: string }> {
    const accessToken = await this.Jwt.signAsync(payload);
    const refreshToken = await this.Jwt.signAsync(payload, {
      secret: this.configService.get<string>('REFRESH_TOKEN'),
      expiresIn: '7d',
    });
    return { refreshToken: refreshToken, accessToken: accessToken };
  }

  async hashPassword(password: string): Promise<string> {
    const hash = await bcrypt.hash(password, this.SALT);
    return hash;
  }

  // register
  async register(
    dto: registerDto,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    try {
      const hashed = await this.hashPassword(dto.password);
      const user = await this.userservice.createUser(dto, hashed);
      if (!user) throw new UnauthorizedException('invalid credentials');
      const payload = { sub: user.id, username: user.name };
      const token = await this.generateTokens(payload);
      const hashedToken = await bcrypt.hash(token.refreshToken, this.SALT);
      await this.userservice.updateUsertoken(user.id, hashedToken);
      return {
        accessToken: token.accessToken,
        refreshToken: token.refreshToken,
      };
    } catch (error) {
      if (
        error instanceof PrismaClientKnownRequestError &&
        error.code === 'P2002'
      )
        throw new ConflictException('Email is already registered');
      else throw error;
    }
  }

  // login
  async logInlogic(
    dto: loginDto,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const user = await this.userservice.findUserByEmail(dto.email);
    if (!user) throw new UnauthorizedException('Invalid credentials');
    if (!user.password_hash)
      throw new UnauthorizedException('The user has no password');
    const result: boolean = await bcrypt.compare(
      dto.password,
      user.password_hash,
    );
    if (!result) throw new UnauthorizedException('Invalid credentials');
    const payload = { sub: user.id, username: user.name };
    const tokens = await this.generateTokens(payload);
    const hashedToken = await bcrypt.hash(tokens.refreshToken, this.SALT);
    await this.userservice.updateUsertoken(user.id, hashedToken);
    return tokens;
  }

  // Refresh
  async refresh(
    req: Request,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    try {
      const cookie = req.cookies as Record<string, string | undefined>;
      const refreshToken = cookie.refresh_token;
      if (!refreshToken)
        throw new UnauthorizedException('Invalid or expired refresh token');
      const payload: JwtPayload = await this.Jwt.verifyAsync(refreshToken, {
        secret: this.configService.get<string>('REFRESH_TOKEN'),
      });
      const user = await this.userservice.findUserById(payload.sub);
      if (!user || !user.refresh_token)
        throw new UnauthorizedException('Invalid or expired refresh token');
      const result = await bcrypt.compare(refreshToken, user.refresh_token);
      if (!result)
        throw new UnauthorizedException('Invalid or expired refresh token');
      const newTokens = await this.generateTokens({
        sub: payload.sub,
        username: payload.username,
      });
      const hashedToken = await bcrypt.hash(newTokens.refreshToken, this.SALT);
      await this.userservice.updateUsertoken(payload.sub, hashedToken);
      return newTokens;
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }

  async logout(req: Request) {
    try {
      const cookie = req.cookies as Record<string, string | undefined>;
      const refreshToken = cookie.refresh_token;
      if (!refreshToken)
        throw new UnauthorizedException('Invalid or expired refresh token');
      const payload: JwtPayload = await this.Jwt.verifyAsync(refreshToken, {
        secret: this.configService.get<string>('REFRESH_TOKEN'),
      });
      await this.userservice.updateUsertoken(payload.sub, null);
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }
}
