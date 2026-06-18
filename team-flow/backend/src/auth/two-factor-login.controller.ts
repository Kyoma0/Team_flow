import { Controller, Post, Body, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../common/prisma.service';
import { TwoFactorService } from './two-factor.service';
import { v4 as uuid } from 'uuid';

@Controller('2fa')
export class TwoFactorLoginController {
  constructor(
    private prisma: PrismaService,
    private twoFactorService: TwoFactorService,
    private jwtService: JwtService,
  ) {}

  @Post('challenge')
  async challenge(@Body() body: { email: string; token: string }) {
    const user = await this.prisma.user.findUnique({ where: { email: body.email } });
    if (!user || !user.twoFactorEnabled) throw new UnauthorizedException('2FA não está habilitado');

    const valid = await this.twoFactorService.verifyToken(user.id, body.token);
    if (!valid) throw new UnauthorizedException('Código 2FA inválido');

    const accessToken = this.jwtService.sign(
      { sub: user.id, email: user.email, roleType: user.roleType },
      { expiresIn: process.env.JWT_EXPIRATION || '15m' },
    );

    const refreshToken = uuid();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await this.prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt,
      },
    });

    const { password: _, ...userWithoutPassword } = user;
    return { user: userWithoutPassword, accessToken, refreshToken };
  }
}
