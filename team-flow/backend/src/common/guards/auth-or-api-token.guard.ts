import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ApiTokenService } from '../../auth/api-token.service';
import { Request } from 'express';

@Injectable()
export class AuthOrApiTokenGuard implements CanActivate {
  constructor(
    private jwtService: JwtService,
    private apiTokenService: ApiTokenService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const authHeader = request.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) return false;

    const token = authHeader.slice(7);

    // Tenta primeiro como JWT de sessão (fluxo padrão do frontend)
    try {
      const payload = await this.jwtService.verifyAsync(token, {
        secret: process.env.JWT_SECRET,
      });
      (request as any).user = payload;
      return true;
    } catch {
      // não é um JWT válido, tenta como API Token
    }

    // Tenta como API Token (fluxo de integrações externas, ex: add-on do Blender)
    const tk = await this.apiTokenService.validateToken(token);
    if (!tk) return false;

    (request as any).user = { sub: tk.userId, tokenId: tk.id };
    return true;
  }
}
