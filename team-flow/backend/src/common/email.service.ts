import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { PrismaService } from './prisma.service';

@Injectable()
export class EmailService {
  private transporter: nodemailer.Transporter | null = null;

  constructor(private prisma: PrismaService) {
    if (process.env.SMTP_HOST) {
      this.transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_PORT === '465',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });
    }
  }

  async send(to: string, subject: string, html: string) {
    if (!this.transporter) {
      console.log(`[Email] Simulado: Para ${to}, Assunto: ${subject}`);
      return { messageId: 'simulado' };
    }

    return this.transporter.sendMail({
      from: process.env.EMAIL_FROM || 'noreply@teamflow.com',
      to,
      subject,
      html,
    });
  }

  async sendWelcome(email: string, name: string) {
    return this.send(
      email,
      'Bem-vindo ao TeamFlow!',
      `<h1>Bem-vindo, ${name}!</h1><p>Sua conta foi criada com sucesso.</p><p>Faça login em: <a href="${process.env.APP_URL}/login">${process.env.APP_URL}/login</a></p>`,
    );
  }

  async sendPasswordReset(email: string, token: string) {
    const resetUrl = `${process.env.APP_URL}/reset-password?token=${token}`;
    return this.send(
      email,
      'Recuperação de Senha - TeamFlow',
      `<h1>Recuperação de Senha</h1><p>Clique no link para redefinir sua senha:</p><p><a href="${resetUrl}">${resetUrl}</a></p><p>Este link expira em 1 hora.</p>`,
    );
  }

  async sendEmailConfirmation(email: string, token: string) {
    const confirmUrl = `${process.env.APP_URL}/confirm-email?token=${token}`;
    return this.send(
      email,
      'Confirme seu email - TeamFlow',
      `<h1>Confirme seu email</h1><p>Clique no link para confirmar seu email:</p><p><a href="${confirmUrl}">${confirmUrl}</a></p>`,
    );
  }

  async sendTaskNotification(type: 'assigned' | 'status_change', email: string, title: string, projectName: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) return;
    if (type === 'assigned' && !user.notifyTaskAssigned) return;
    if (type === 'status_change' && !user.notifyTaskStatus) return;
    return this.send(
      email,
      type === 'assigned' ? `Nova tarefa: ${title} - TeamFlow` : `Status atualizado: ${title} - TeamFlow`,
      type === 'assigned'
        ? `<h1>Nova Tarefa</h1><p>Você foi designado para a tarefa: <strong>${title}</strong></p><p>Projeto: ${projectName}</p>`
        : `<h1>Status Atualizado</h1><p>A tarefa <strong>${title}</strong> teve seu status alterado.</p><p>Projeto: ${projectName}</p>`,
    );
  }

  async sendEmail(to: string, subject: string, text: string) {
    return this.send(to, subject, text);
  }

  async notifyTaskWatchers(taskId: string, taskTitle: string, message: string, projectName: string) {
    const watchers = await this.prisma.taskWatcher.findMany({
      where: { taskId },
      include: { user: { select: { email: true, notifyTaskStatus: true } } },
    });

    for (const watcher of watchers) {
      if (watcher.user.notifyTaskStatus && watcher.user.email) {
        await this.sendEmail(
          watcher.user.email,
          `[${projectName}] ${taskTitle}`,
          message,
        );
      }
    }
  }

  async sendDeliveryNotification(email: string, deliveryTitle: string, status: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) return;
    if (!user.notifyDeliveryStatus) return;
    return this.send(
      email,
      `Entrega: ${deliveryTitle} - TeamFlow`,
      `<h1>Atualização de Entrega</h1><p>A entrega <strong>${deliveryTitle}</strong> está com status: <strong>${status}</strong></p>`,
    );
  }
}
