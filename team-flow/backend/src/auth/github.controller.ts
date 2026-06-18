import { Controller, Get, Req, Res, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { JwtService } from '@nestjs/jwt';
import { Request, Response } from 'express';

@Controller('auth')
export class GithubController {
  constructor(private jwtService: JwtService) {}

  @Get('github')
  @UseGuards(AuthGuard('github'))
  async githubLogin() {
  }

  @Get('github/callback')
  @UseGuards(AuthGuard('github'))
  async githubCallback(@Req() req: Request, @Res() res: Response) {
    const user = req.user as any;
    const token = this.jwtService.sign({
      sub: user.id,
      email: user.email,
      name: user.name,
    });

    res.redirect(`${process.env.CORS_ORIGIN || 'http://localhost:3000'}/login?token=${token}`);
  }
}
