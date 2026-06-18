import { Controller, Get, Post, Patch, Delete, Param, Body, UseGuards, HttpCode } from '@nestjs/common';
import { PlansService } from './plans.service';
import { CreatePlanDto } from './dto/create-plan.dto';
import { UpdatePlanDto } from './dto/update-plan.dto';
import { AuthGuard } from '../common/guards/auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { SkipThrottle } from '@nestjs/throttler';

@Controller('plans')
@UseGuards(AuthGuard)
export class PlansController {
  constructor(private plansService: PlansService) {}

  @Get('user/me')
  getUserPlan(@CurrentUser('sub') userId: string) {
    return this.plansService.getUserPlan(userId);
  }

  @Get('subscription')
  getUserSubscription(@CurrentUser('sub') userId: string) {
    return this.plansService.getUserSubscription(userId);
  }

  @Post('checkout')
  checkout(
    @CurrentUser('sub') userId: string,
    @Body() body: { planId: string; billingCycle?: 'monthly' | 'yearly' },
  ) {
    return this.plansService.checkout(userId, body.planId, body.billingCycle || 'monthly');
  }

  @Post('assign')
  assignPlan(
    @CurrentUser('sub') userId: string,
    @Body() body: { planId: string },
  ) {
    return this.plansService.assignPlan(userId, body.planId);
  }

  @Post('cancel')
  cancelSubscription(@CurrentUser('sub') userId: string) {
    return this.plansService.cancelSubscription(userId);
  }

  @SkipThrottle()
  @Post('webhook/asaas')
  @HttpCode(200)
  handleWebhook(@Body() body: any) {
    const event = body.event || body.type;
    return this.plansService.handleAsaasWebhook(event, body);
  }

  @Get()
  findAll() {
    return this.plansService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.plansService.findOne(id);
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  create(@Body() data: CreatePlanDto) {
    return this.plansService.create({
      ...data,
      features: data.features ? JSON.stringify(data.features) : undefined,
    });
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  update(@Param('id') id: string, @Body() data: UpdatePlanDto) {
    return this.plansService.update(id, data);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  remove(@Param('id') id: string) {
    return this.plansService.remove(id);
  }
}
