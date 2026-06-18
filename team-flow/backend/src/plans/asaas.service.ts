import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class AsaasService {
  private readonly logger = new Logger(AsaasService.name);
  private readonly apiKey: string;
  private readonly baseUrl: string;
  readonly mockMode: boolean;

  constructor() {
    this.apiKey = process.env.ASAAS_API_KEY || '';
    this.baseUrl = process.env.ASAAS_ENV === 'production'
      ? 'https://api.asaas.com/v3'
      : 'https://sandbox.asaas.com/api/v3';
    this.mockMode = !this.apiKey || process.env.ASAAS_MOCK === 'true';
    if (this.mockMode) {
      this.logger.warn('ASAAS em modo MOCK — nenhuma cobrança real será gerada');
    }
  }

  private get headers() {
    return {
      'access_token': this.apiKey,
      'Content-Type': 'application/json',
    };
  }

  async createCustomer(user: { id: string; name: string; email: string; cpfCnpj?: string }): Promise<string> {
    if (this.mockMode) {
      const mockId = `cus_mock_${user.id.slice(0, 8)}`;
      this.logger.log(`[MOCK] ASAAS createCustomer: ${mockId}`);
      return mockId;
    }

    try {
      const { data } = await axios.post(`${this.baseUrl}/customers`, {
        name: user.name,
        email: user.email,
        cpfCnpj: user.cpfCnpj || '00000000000',
        notificationDisabled: false,
      }, { headers: this.headers });
      return data.id;
    } catch (err: any) {
      this.logger.error('Falha ao criar cliente ASAAS', err?.response?.data || err.message);
      throw err;
    }
  }

  async createSubscription(customerId: string, plan: { priceMonthly: number; name: string }, billingCycle: 'monthly' | 'yearly'): Promise<{ id: string; paymentUrl: string }> {
    if (this.mockMode) {
      const mockId = `sub_mock_${plan.name.toLowerCase().replace(/\s/g, '_')}`;
      const value = billingCycle === 'monthly' ? plan.priceMonthly : plan.priceMonthly * 10;
      this.logger.log(`[MOCK] ASAAS createSubscription: ${mockId}, R$ ${value}`);
      return {
        id: mockId,
        paymentUrl: `${process.env.CORS_ORIGIN || 'http://localhost:3000'}/plans/success?subscription=${mockId}`,
      };
    }

    try {
      const { data } = await axios.post(`${this.baseUrl}/subscriptions`, {
        customer: customerId,
        billingType: 'PIX',
        value: billingCycle === 'monthly' ? plan.priceMonthly : plan.priceMonthly * 10,
        nextDueDay: 1,
        cycle: billingCycle === 'monthly' ? 'MONTHLY' : 'YEARLY',
        description: `TeamFlow - ${plan.name}`,
        maxPayments: null,
        externalReference: plan.name,
      }, { headers: this.headers });
      return {
        id: data.id,
        paymentUrl: data.invoiceUrl || `${process.env.CORS_ORIGIN || 'http://localhost:3000'}/plans/success`,
      };
    } catch (err: any) {
      this.logger.error('Falha ao criar assinatura ASAAS', err?.response?.data || err.message);
      throw err;
    }
  }

  async cancelSubscription(subscriptionId: string): Promise<void> {
    if (this.mockMode) {
      this.logger.log(`[MOCK] ASAAS cancelSubscription: ${subscriptionId}`);
      return;
    }

    try {
      await axios.delete(`${this.baseUrl}/subscriptions/${subscriptionId}`, { headers: this.headers });
    } catch (err: any) {
      this.logger.error('Falha ao cancelar assinatura ASAAS', err?.response?.data || err.message);
      throw err;
    }
  }

  async getSubscription(id: string): Promise<any> {
    if (this.mockMode) {
      return {
        id,
        status: 'ACTIVE',
        value: 49.9,
        nextDueDate: new Date(Date.now() + 30 * 86400000).toISOString(),
      };
    }

    try {
      const { data } = await axios.get(`${this.baseUrl}/subscriptions/${id}`, { headers: this.headers });
      return data;
    } catch (err: any) {
      this.logger.error('Falha ao buscar assinatura ASAAS', err?.response?.data || err.message);
      throw err;
    }
  }

  mapAsaasStatus(asaasStatus: string): string {
    const map: Record<string, string> = {
      PENDING: 'PENDING',
      RECEIVED: 'ACTIVE',
      CONFIRMED: 'ACTIVE',
      OVERDUE: 'OVERDUE',
      REFUNDED: 'CANCELLED',
      RECEIVED_IN_CASH: 'ACTIVE',
      PARTIAL_RECEIVE: 'ACTIVE',
      NOT_RECEIVED: 'PENDING',
    };
    return map[asaasStatus] || 'PENDING';
  }
}
