import { Global, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { EmailVerificationController } from './email-verification.controller';
import { TwoFactorService } from './two-factor.service';
import { TwoFactorController } from './two-factor.controller';
import { TwoFactorLoginController } from './two-factor-login.controller';
import { ApiTokenService } from './api-token.service';
import { ApiTokenController } from './api-token.controller';
import { ProfileController } from './profile.controller';
import { AccountController } from './account.controller';
import { GithubStrategy } from './github.strategy';
import { GithubController } from './github.controller';

@Global()
@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      useFactory: () => ({
        secret: process.env.JWT_SECRET,
        signOptions: { expiresIn: process.env.JWT_EXPIRATION || '15m' },
      }),
    }),
  ],
  controllers: [AuthController, EmailVerificationController, TwoFactorController, TwoFactorLoginController, ApiTokenController, ProfileController, AccountController, GithubController],
  providers: [AuthService, TwoFactorService, ApiTokenService, GithubStrategy],
  exports: [AuthService, JwtModule, TwoFactorService, ApiTokenService],
})
export class AuthModule {}
