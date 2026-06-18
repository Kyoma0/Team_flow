import { Module } from '@nestjs/common';
import { PlansController } from './plans.controller';
import { PlansService } from './plans.service';
import { AsaasService } from './asaas.service';

@Module({
  controllers: [PlansController],
  providers: [PlansService, AsaasService],
  exports: [PlansService, AsaasService],
})
export class PlansModule {}
