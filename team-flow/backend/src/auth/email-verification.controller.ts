import * as crypto from 'crypto';
import { Controller, Post, Get, Param, Query, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { EmailService } from '../common/email.service';

@Controller('auth')
export class EmailVerificationController {
  constructor(
    private prisma: PrismaService,
    private emailService: EmailService,
  ) {}

  @Get('verify-email')
  async verify(@Query('token') token: string) {
    if (!token) throw new BadRequestException('Token não fornecido');

    const user = await this.prisma.user.findFirst({ where: { verificationToken: token } });
    if (!user) throw new NotFoundException('Token inválido ou expirado');

    await this.prisma.user.update({
      where: { id: user.id },
      data: { emailVerified: true, verificationToken: null },
    });

    return { message: 'Email verificado com sucesso!' };
  }

  @Post('resend-verification')
  async resend(@Query('email') email: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) throw new NotFoundException('Usuário não encontrado');
    if (user.emailVerified) throw new BadRequestException('Email já verificado');

    const verificationToken = crypto.randomBytes(32).toString('hex');
    await this.prisma.user.update({
      where: { id: user.id },
      data: { verificationToken },
    });

    const verifyUrl = `${process.env.CORS_ORIGIN || 'http://localhost:3000'}/verify-email?token=${verificationToken}`;
    await this.emailService.sendEmail(
      email,
      'Confirme seu email - TeamFlow',
      `Clique no link para verificar seu email: ${verifyUrl}`,
    );

    return { message: 'Email de verificação reenviado' };
  }
}
