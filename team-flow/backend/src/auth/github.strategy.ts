import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-github2';
import { PrismaService } from '../common/prisma.service';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';

@Injectable()
export class GithubStrategy extends PassportStrategy(Strategy, 'github') {
  constructor(private prisma: PrismaService) {
    super({
      clientID: process.env.GITHUB_CLIENT_ID || '',
      clientSecret: process.env.GITHUB_CLIENT_SECRET || '',
      callbackURL: process.env.GITHUB_CALLBACK_URL || 'http://localhost:3001/api/auth/github/callback',
      scope: ['user:email'],
    });
  }

  async validate(accessToken: string, refreshToken: string, profile: any, done: any) {
    const email = profile.emails?.[0]?.value || `${profile.username}@github.local`;
    let user = await this.prisma.user.findUnique({ where: { email } });

    if (!user) {
      const password = await bcrypt.hash(crypto.randomBytes(16).toString('hex'), 10);
      const baseUsername = (profile.username || email.split('@')[0]).replace(/[^a-zA-Z0-9_]/g, '_');
      let username = baseUsername;
      let suffix = 1;
      while (await this.prisma.user.findUnique({ where: { username } })) {
        username = `${baseUsername}_${suffix++}`;
      }

      user = await this.prisma.user.create({
        data: {
          username,
          name: profile.displayName || profile.username,
          email,
          password,
          avatar: profile.photos?.[0]?.value || '',
        },
      });
    }

    done(null, user);
  }
}
