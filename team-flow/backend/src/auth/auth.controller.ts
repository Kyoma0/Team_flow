import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  UseGuards,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiBody, ApiResponse, ApiCreatedResponse, ApiConsumes } from '@nestjs/swagger';
import { SkipThrottle, Throttle } from '@nestjs/throttler';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { AuthService } from './auth.service';
import { AuthGuard } from '../common/guards/auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AuditService } from '../audit/audit.service';
import * as fs from 'fs';

const avatarDir = join(process.cwd(), 'uploads', 'avatars');
if (!fs.existsSync(avatarDir)) {
  fs.mkdirSync(avatarDir, { recursive: true });
}
import {
  RegisterDto,
  LoginDto,
  ForgotPasswordDto,
  ResetPasswordDto,
  ChangePasswordDto,
  UpdateProfileDto,
  RefreshTokenDto,
} from './dto';

@Controller('auth')
@ApiTags('Autenticação')
export class AuthController {
  constructor(
    private authService: AuthService,
    private auditService: AuditService,
  ) {}

  @Post('register')
  @ApiOperation({ summary: 'Registrar usuário', description: 'Cria uma nova conta de usuário' })
  @ApiBody({ type: RegisterDto })
  @ApiCreatedResponse({ description: 'Usuário registrado com sucesso' })
  async register(@Body() dto: RegisterDto) {
    const result = await this.authService.register(dto);
    await this.auditService.log(result.user.id, 'REGISTER', 'USER', result.user.id, 'Cadastro realizado');
    return result;
  }

  @Throttle({ short: { limit: 5, ttl: 60000 } })
  @Post('login')
  @ApiOperation({ summary: 'Autenticar usuário', description: 'Realiza login e retorna tokens de acesso' })
  @ApiBody({ type: LoginDto })
  @ApiResponse({ status: 200, description: 'Login realizado com sucesso' })
  @ApiResponse({ status: 401, description: 'Credenciais inválidas' })
  async login(@Body() dto: LoginDto) {
    const result = await this.authService.login(dto.email, dto.password);
    if (result.user.twoFactorEnabled) {
      return { requiresTwoFactor: true, email: dto.email };
    }
    await this.auditService.log(result.user.id, 'LOGIN', 'USER', result.user.id, 'Login realizado');
    return result;
  }

  @Post('refresh')
  @ApiOperation({ summary: 'Renovar token', description: 'Gera um novo token de acesso a partir do refresh token' })
  @ApiBody({ type: RefreshTokenDto })
  @ApiResponse({ status: 200, description: 'Token renovado com sucesso' })
  refresh(@Body() dto: RefreshTokenDto) {
    return this.authService.refresh(dto.refreshToken);
  }

  @UseGuards(AuthGuard)
  @Post('logout')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Sair da conta', description: 'Invalida o token de acesso atual' })
  @ApiResponse({ status: 200, description: 'Logout realizado com sucesso' })
  async logout(@CurrentUser('sub') userId: string) {
    const result = await this.authService.logout(userId);
    await this.auditService.log(userId, 'LOGOUT', 'USER', userId, 'Logout realizado');
    return result;
  }

  @Post('confirm-email')
  @ApiOperation({ summary: 'Confirmar e-mail', description: 'Confirma o endereço de e-mail usando token' })
  @ApiBody({ description: 'Token de confirmação', schema: { properties: { token: { type: 'string' } } } })
  @ApiResponse({ status: 200, description: 'E-mail confirmado com sucesso' })
  confirmEmail(@Body() dto: { token: string }) {
    return this.authService.confirmEmail(dto.token);
  }

  @Post('forgot-password')
  @ApiOperation({ summary: 'Esqueci senha', description: 'Envia e-mail com instruções para redefinição de senha' })
  @ApiBody({ type: ForgotPasswordDto })
  @ApiResponse({ status: 200, description: 'E-mail enviado se o usuário existir' })
  forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto.email);
  }

  @Post('reset-password')
  @ApiOperation({ summary: 'Redefinir senha', description: 'Redefine a senha usando token recebido por e-mail' })
  @ApiBody({ type: ResetPasswordDto })
  @ApiResponse({ status: 200, description: 'Senha redefinida com sucesso' })
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto.token, dto.password);
  }

  @UseGuards(AuthGuard)
  @Post('change-password')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Alterar senha', description: 'Altera a senha do usuário autenticado' })
  @ApiBody({ type: ChangePasswordDto })
  @ApiResponse({ status: 200, description: 'Senha alterada com sucesso' })
  changePassword(@CurrentUser('sub') userId: string, @Body() dto: ChangePasswordDto) {
    return this.authService.changePassword(userId, dto.currentPassword, dto.newPassword);
  }

  @SkipThrottle()
  @UseGuards(AuthGuard)
  @Get('profile')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obter perfil', description: 'Retorna os dados do perfil do usuário autenticado' })
  @ApiResponse({ status: 200, description: 'Dados do perfil' })
  getProfile(@CurrentUser('sub') userId: string) {
    return this.authService.getProfile(userId);
  }

  @UseGuards(AuthGuard)
  @Patch('profile')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Atualizar perfil', description: 'Atualiza os dados do perfil do usuário autenticado' })
  @ApiBody({ type: UpdateProfileDto })
  @ApiResponse({ status: 200, description: 'Perfil atualizado com sucesso' })
  updateProfile(@CurrentUser('sub') userId: string, @Body() dto: UpdateProfileDto) {
    return this.authService.updateProfile(userId, dto);
  }

  @UseGuards(AuthGuard)
  @Post('avatar')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Upload de avatar', description: 'Faz upload de uma imagem de avatar para o usuário' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({ description: 'Arquivo de imagem (max 2MB)', schema: { type: 'object', properties: { avatar: { type: 'string', format: 'binary' } } } })
  @ApiResponse({ status: 200, description: 'Avatar atualizado com sucesso' })
  @UseInterceptors(FileInterceptor('avatar', {
    storage: diskStorage({
      destination: avatarDir,
      filename: (_req, file, cb) => {
        const ext = extname(file.originalname);
        cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`);
      },
    }),
    limits: { fileSize: 2 * 1024 * 1024 },
    fileFilter: (_req, file, cb) => {
      if (!file.mimetype.startsWith('image/')) {
        cb(new Error('Apenas imagens são permitidas'), false);
      }
      cb(null, true);
    },
  }))
  async uploadAvatar(@CurrentUser('sub') userId: string, @UploadedFile() file: Express.Multer.File) {
    return this.authService.updateAvatar(userId, file.filename);
  }
}
