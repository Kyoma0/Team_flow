import { Module } from '@nestjs/common';
import { InviteController } from './invite.controller';
import { InviteService } from '../common/invite.service';

@Module({
  controllers: [InviteController],
  providers: [InviteService],
})
export class InviteModule {}
