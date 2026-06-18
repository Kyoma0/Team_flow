import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import * as speakeasy from 'speakeasy';
import * as crypto from 'crypto';

@Injectable()
export class TwoFactorService {
  constructor(private prisma: PrismaService) {}

  async generateSecret(userId: string) {
    const secret = speakeasy.generateSecret({ name: 'TeamFlow' });
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new Error('Usuário não encontrado');

    await this.prisma.user.update({
      where: { id: userId },
      data: { twoFactorSecret: secret.base32 },
    });

    return {
      secret: secret.base32,
      otpauth_url: secret.otpauth_url,
    };
  }

  async verifyAndEnable(userId: string, token: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.twoFactorSecret) throw new BadRequestException('2FA não configurado');

    const verified = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: 'base32',
      token,
      window: 1,
    });

    if (!verified) throw new BadRequestException('Código inválido');

    const backupCodes = Array.from({ length: 8 }, () => crypto.randomBytes(4).toString('hex'));

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        twoFactorEnabled: true,
        backupCodes: JSON.stringify(backupCodes),
      },
    });

    return { backupCodes };
  }

  async verifyToken(userId: string, token: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.twoFactorSecret) return false;

    const verified = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: 'base32',
      token,
      window: 1,
    });

    if (verified) return true;

    if (user.backupCodes) {
      const codes: string[] = JSON.parse(user.backupCodes);
      const idx = codes.indexOf(token);
      if (idx !== -1) {
        codes.splice(idx, 1);
        await this.prisma.user.update({
          where: { id: userId },
          data: { backupCodes: JSON.stringify(codes) },
        });
        return true;
      }
    }

    return false;
  }

  async disable(userId: string) {
    await this.prisma.user.update({
      where: { id: userId },
      data: { twoFactorSecret: null, twoFactorEnabled: false, backupCodes: null },
    });
    return { message: '2FA desabilitado' };
  }

  async status(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    return { enabled: user?.twoFactorEnabled ?? false };
  }
}
