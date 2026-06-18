import * as crypto from 'crypto';
import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../common/prisma.service';
import { EmailService } from '../common/email.service';
import { v4 as uuid } from 'uuid';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private emailService: EmailService,
  ) {}

  private async generateTokens(user: { id: string; email: string; roleType: string }) {
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

    return { accessToken, refreshToken };
  }

  async register(data: {
    name: string;
    email: string;
    password: string;
    username?: string;
    roleType?: string;
  }) {
    const existing = await this.prisma.user.findUnique({ where: { email: data.email } });
    if (existing) throw new ConflictException('Email já cadastrado');

    const username = data.username || data.email.split('@')[0].toLowerCase().replace(/[^a-z0-9_]/g, '_');

    const existingUsername = await this.prisma.user.findUnique({ where: { username } });
    if (existingUsername) throw new ConflictException('Username já está em uso');

    const hashedPassword = await bcrypt.hash(data.password, 10);

    const freePlan = await this.prisma.plan.findFirst({
      where: { priceMonthly: 0, isActive: true },
      orderBy: { priceMonthly: 'asc' },
    });

    const user = await this.prisma.user.create({
      data: {
        username,
        name: data.name,
        email: data.email,
        password: hashedPassword,
        roleType: (data.roleType as any) || 'EMPLOYEE',
        planId: freePlan?.id || null,
      },
      select: { id: true, username: true, name: true, email: true, roleType: true, avatar: true, createdAt: true, planId: true },
    });

    const verificationToken = crypto.randomBytes(32).toString('hex');
    await this.prisma.user.update({
      where: { id: user.id },
      data: { verificationToken },
    });

    const verifyUrl = `${process.env.CORS_ORIGIN || 'http://localhost:3000'}/verify-email?token=${verificationToken}`;
    await this.emailService.sendWelcome(user.email, user.name);
    await this.emailService.sendEmailConfirmation(user.email, verificationToken);
    await this.emailService.sendEmail(
      user.email,
      'Confirme seu email - TeamFlow',
      `Olá ${user.name}! Confirme seu email clicando no link: ${verifyUrl}`,
    );

    const tokens = await this.generateTokens(user);

    return { user, ...tokens };
  }

  async confirmEmail(token: string) {
    const user = await this.prisma.user.findFirst({ where: { emailToken: token } });
    if (!user) throw new BadRequestException('Token inválido');

    await this.prisma.user.update({
      where: { id: user.id },
      data: { emailVerified: true, emailToken: null },
    });

    return { message: 'Email confirmado com sucesso' };
  }

  async login(email: string, password: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) throw new UnauthorizedException('Email ou senha inválidos');

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) throw new UnauthorizedException('Email ou senha inválidos');
    if (!user.isActive) throw new UnauthorizedException('Conta desativada');

    const tokens = await this.generateTokens(user);

    const { password: _, ...userWithoutPassword } = user;
    return { user: userWithoutPassword, ...tokens };
  }

  async refresh(refreshToken: string) {
    const stored = await this.prisma.refreshToken.findUnique({
      where: { token: refreshToken },
      include: { user: true },
    });

    if (!stored || stored.expiresAt < new Date()) {
      if (stored) {
        await this.prisma.refreshToken.delete({ where: { id: stored.id } });
      }
      throw new UnauthorizedException('Refresh token inválido ou expirado');
    }

    await this.prisma.refreshToken.delete({ where: { id: stored.id } });

    const tokens = await this.generateTokens(stored.user);

    const { password: _, ...userWithoutPassword } = stored.user;
    return { user: userWithoutPassword, ...tokens };
  }

  async logout(userId: string) {
    await this.prisma.refreshToken.deleteMany({ where: { userId } });
    return { message: 'Sessão encerrada' };
  }

  async forgotPassword(email: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) return { message: 'Se o email existir, você receberá instruções' };

    const resetToken = uuid();
    await this.prisma.user.update({
      where: { id: user.id },
      data: { emailToken: resetToken },
    });

    await this.emailService.sendPasswordReset(user.email, resetToken);
    return { message: 'Se o email existir, você receberá instruções' };
  }

  async resetPassword(token: string, newPassword: string) {
    const user = await this.prisma.user.findFirst({ where: { emailToken: token } });
    if (!user) throw new BadRequestException('Token inválido ou expirado');

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await this.prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword, emailToken: null },
    });
    await this.prisma.refreshToken.deleteMany({ where: { userId: user.id } });

    return { message: 'Senha alterada com sucesso' };
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('Usuário não encontrado');

    const valid = await bcrypt.compare(currentPassword, user.password);
    if (!valid) throw new BadRequestException('Senha atual incorreta');

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await this.prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });
    await this.prisma.refreshToken.deleteMany({ where: { userId } });

    return { message: 'Senha alterada com sucesso' };
  }

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true, username: true, name: true, email: true, roleType: true, avatar: true,
        role: true, isActive: true, createdAt: true, updatedAt: true,
      },
    });
    if (!user) throw new NotFoundException('Usuário não encontrado');
    return user;
  }

  async updateProfile(userId: string, data: { name?: string; username?: string; avatar?: string }) {
    if (data.username) {
      const existing = await this.prisma.user.findUnique({ where: { username: data.username } });
      if (existing && existing.id !== userId) throw new ConflictException('Username já está em uso');
    }
    return this.prisma.user.update({
      where: { id: userId },
      data,
      select: { id: true, username: true, name: true, email: true, roleType: true, avatar: true },
    });
  }

  async updateAvatar(userId: string, filename: string) {
    const avatarUrl = `/uploads/avatars/${filename}`;
    return this.prisma.user.update({
      where: { id: userId },
      data: { avatar: avatarUrl },
      select: { id: true, username: true, name: true, email: true, roleType: true, avatar: true },
    });
  }
}
