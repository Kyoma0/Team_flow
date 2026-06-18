import { Controller, Post, Get, Body, UseGuards } from '@nestjs/common';
import { TwoFactorService } from './two-factor.service';
import { AuthGuard } from '../common/guards/auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('2fa')
@UseGuards(AuthGuard)
export class TwoFactorController {
  constructor(private twoFactorService: TwoFactorService) {}

  @Get('status')
  status(@CurrentUser('sub') userId: string) {
    return this.twoFactorService.status(userId);
  }

  @Post('generate')
  generate(@CurrentUser('sub') userId: string) {
    return this.twoFactorService.generateSecret(userId);
  }

  @Post('verify')
  verify(@CurrentUser('sub') userId: string, @Body() body: { token: string }) {
    return this.twoFactorService.verifyAndEnable(userId, body.token);
  }

  @Post('disable')
  disable(@CurrentUser('sub') userId: string) {
    return this.twoFactorService.disable(userId);
  }
}
