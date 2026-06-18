import { Controller, Get, Patch, Post, Body, UseGuards, UnauthorizedException, UseInterceptors, UploadedFile, BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { v4 as uuidv4 } from 'uuid';
import { ApiConsumes, ApiBody } from '@nestjs/swagger';
import { AuthGuard } from '../common/guards/auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { PrismaService } from '../common/prisma.service';
import * as bcrypt from 'bcryptjs';

@Controller('profile')
@UseGuards(AuthGuard)
export class ProfileController {
  constructor(private prisma: PrismaService) {}

  @Get()
  async getProfile(@CurrentUser('sub') userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true, avatar: true, createdAt: true },
    });
    if (!user) throw new UnauthorizedException();
    return user;
  }

  @Patch()
  async updateProfile(
    @CurrentUser('sub') userId: string,
    @Body() body: { name?: string; avatar?: string },
  ) {
    const data: any = {};
    if (body.name !== undefined) data.name = body.name;
    if (body.avatar !== undefined) data.avatar = body.avatar;

    const user = await this.prisma.user.update({
      where: { id: userId },
      data,
      select: { id: true, name: true, email: true, avatar: true },
    });
    return user;
  }

  @Post('change-password')
  async changePassword(
    @CurrentUser('sub') userId: string,
    @Body() body: { currentPassword: string; newPassword: string },
  ) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new UnauthorizedException();

    const valid = await bcrypt.compare(body.currentPassword, user.password);
    if (!valid) throw new UnauthorizedException('Senha atual incorreta');

    const hashed = await bcrypt.hash(body.newPassword, 10);
    await this.prisma.user.update({
      where: { id: userId },
      data: { password: hashed },
    });

    return { message: 'Senha alterada com sucesso' };
  }

  @Post('avatar')
  @UseInterceptors(FileInterceptor('avatar', {
    storage: diskStorage({
      destination: join(__dirname, '..', '..', 'uploads', 'avatars'),
      filename: (req: any, file: any, cb: any) => {
        const name = uuidv4() + extname(file.originalname);
        cb(null, name);
      },
    }),
    limits: { fileSize: 2 * 1024 * 1024 },
    fileFilter: (req: any, file: any, cb: any) => {
      if (!file.mimetype.match(/^image\/(jpeg|png|gif|webp)$/)) {
        cb(new BadRequestException('Apenas imagens (JPEG, PNG, GIF, WebP) são permitidas'), false);
        return;
      }
      cb(null, true);
    },
  }))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        avatar: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  async uploadAvatar(
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser('sub') userId: string,
  ) {
    if (!file) throw new BadRequestException('Arquivo não enviado');

    const avatarUrl = `/uploads/avatars/${file.filename}`;
    await this.prisma.user.update({
      where: { id: userId },
      data: { avatar: avatarUrl },
    });
    return { avatar: avatarUrl };
  }
}
