import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { ApiTokenService } from '../../auth/api-token.service';

@Injectable()
export class ApiTokenGuard implements CanActivate {
  constructor(private apiTokenService: ApiTokenService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) return false;

    const token = authHeader.slice(7);
    const tk = await this.apiTokenService.validateToken(token);
    if (!tk) return false;

    request.user = { sub: tk.userId, tokenId: tk.id };
    return true;
  }
}
