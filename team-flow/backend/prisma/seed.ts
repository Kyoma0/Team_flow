import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding TeamFlow database...');

  // Clean existing data
  await prisma.auditLog.deleteMany();
  await prisma.message.deleteMany();
  await prisma.groupMember.deleteMany();
  await prisma.group.deleteMany();
  await prisma.customFieldValue.deleteMany();
  await prisma.customField.deleteMany();
  await prisma.fileVersion.deleteMany();
  await prisma.file.deleteMany();
  await prisma.timeEntry.deleteMany();
  await prisma.taskDependency.deleteMany();
  await prisma.taskHistory.deleteMany();
  await prisma.taskComment.deleteMany();
  await prisma.task.deleteMany();
  await prisma.taskTemplateItem.deleteMany();
  await prisma.taskTemplate.deleteMany();
  await prisma.deliveryVersion.deleteMany();
  await prisma.delivery.deleteMany();
  await prisma.projectMember.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.project.deleteMany();
  await prisma.folder.deleteMany();
  await prisma.client.deleteMany();
  await prisma.webhook.deleteMany();
  await prisma.apiToken.deleteMany();
  await prisma.planHistory.deleteMany();
  await prisma.plan.deleteMany();
  await prisma.role.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.user.deleteMany();

  const password = await bcrypt.hash('123456', 10);

  // Plans
  const freePlan = await prisma.plan.create({
    data: {
      name: 'Grátis',
      description: 'Para pequenas equipes',
      maxUsers: 3,
      maxStorage: BigInt(104857600),
      maxProjects: 1,
      priceMonthly: 0,
      priceYearly: 0,
      features: JSON.stringify(['tasks', 'chat', 'files']),
    },
  });

  const proPlan = await prisma.plan.create({
    data: {
      name: 'Profissional',
      description: 'Para equipes em crescimento',
      maxUsers: 15,
      maxStorage: BigInt(1073741824),
      maxProjects: 10,
      priceMonthly: 49.9,
      priceYearly: 490,
      features: JSON.stringify(['tasks', 'chat', 'files', 'deliveries', 'time-tracking', 'custom-fields', 'webhooks', 'api-tokens']),
    },
  });

  const studioPlan = await prisma.plan.create({
    data: {
      name: 'Estúdio',
      description: 'Para estúdios profissionais',
      maxUsers: 999,
      maxStorage: BigInt(10737418240),
      maxProjects: 999,
      priceMonthly: 149.9,
      priceYearly: 1490,
      features: JSON.stringify(['tasks', 'chat', 'files', 'deliveries', 'time-tracking', 'custom-fields', 'webhooks', 'api-tokens', 'audit-log', 'export']),
    },
  });

  // Roles
  await prisma.role.createMany({
    data: [
      { name: 'Administrador', description: 'Acesso total ao sistema', permissions: JSON.stringify(['all']) },
      { name: 'Líder', description: 'Pode criar e gerenciar projetos', permissions: JSON.stringify(['create_project', 'manage_members', 'manage_tasks', 'upload_files', 'approve_deliveries']) },
      { name: 'Funcionário', description: 'Participa de projetos e tarefas', permissions: JSON.stringify(['view_project', 'manage_tasks', 'upload_files', 'send_deliveries']) },
    ],
  });

  // Users
  const ana = await prisma.user.create({
    data: { username: 'ana', name: 'Ana Silva', email: 'ana@teamflow.app', password, avatar: '', roleType: 'LEADER', planId: proPlan.id, emailVerified: true },
  });
  const carlos = await prisma.user.create({
    data: { username: 'carlos', name: 'Carlos Oliveira', email: 'carlos@teamflow.app', password, avatar: '', roleType: 'LEADER', planId: proPlan.id, emailVerified: true },
  });
  const julia = await prisma.user.create({
    data: { username: 'julia', name: 'Júlia Costa', email: 'julia@teamflow.app', password, avatar: '', roleType: 'EMPLOYEE', planId: proPlan.id, emailVerified: true },
  });
  const marcos = await prisma.user.create({
    data: { username: 'marcos', name: 'Marcos Santos', email: 'marcos@teamflow.app', password, avatar: '', roleType: 'EMPLOYEE', planId: proPlan.id, emailVerified: true },
  });
  const demo = await prisma.user.create({
    data: { username: 'demo', name: 'Demo User', email: 'demo@teamflow.app', password, avatar: '', roleType: 'EMPLOYEE', planId: freePlan.id, emailVerified: true },
  });
  const admin = await prisma.user.create({
    data: { username: 'admin', name: 'Administrador', email: 'admin@teamflow.app', password, avatar: '', roleType: 'ADMIN', planId: proPlan.id, emailVerified: true },
  });

  const users = [ana, carlos, julia, marcos, demo, admin];

  // Projects
  const project1 = await prisma.project.create({
    data: {
      name: 'Comercial XYZ',
      description: 'Produção de comercial de 30s para a marca XYZ',
      ownerId: ana.id,
      status: 'IN_PROGRESS',
      startDate: new Date('2026-06-01'),
      endDate: new Date('2026-07-10'),
      members: {
        create: [
          { userId: ana.id, role: 'OWNER' },
          { userId: carlos.id, role: 'MANAGER' },
          { userId: julia.id, role: 'MEMBER' },
          { userId: marcos.id, role: 'MEMBER' },
          { userId: demo.id, role: 'MEMBER' },
        ],
      },
    },
  });

  const project2 = await prisma.project.create({
    data: {
      name: 'Curta-metragem Animado',
      description: 'Projeto de curta-metragem em animação 3D para festival',
      ownerId: carlos.id,
      status: 'PLANNING',
      startDate: new Date('2026-07-01'),
      endDate: new Date('2026-09-30'),
      members: {
        create: [
          { userId: carlos.id, role: 'OWNER' },
          { userId: ana.id, role: 'MANAGER' },
          { userId: julia.id, role: 'MEMBER' },
          { userId: demo.id, role: 'MEMBER' },
        ],
      },
    },
  });

  // Tasks for Project 1
  const task1 = await prisma.task.create({
    data: {
      title: 'Briefing criativo',
      description: 'Reunião com cliente para alinhar conceito e direção criativa',
      status: 'DONE',
      priority: 'HIGH',
      projectId: project1.id,
      assignedToId: ana.id,
      createdById: ana.id,
      dueDate: new Date('2026-06-03'),
    },
  });

  const task2 = await prisma.task.create({
    data: {
      title: 'Roteiro e storyboard',
      description: 'Desenvolver roteiro aprovado e storyboard quadro a quadro',
      status: 'IN_PROGRESS',
      priority: 'HIGH',
      projectId: project1.id,
      assignedToId: carlos.id,
      createdById: ana.id,
      dueDate: new Date('2026-06-10'),
    },
  });

  const task3 = await prisma.task.create({
    data: {
      title: 'Modelagem 3D - Personagem principal',
      description: 'Modelar personagem principal no Blender, incluindo texturas base',
      status: 'IN_PROGRESS',
      priority: 'URGENT',
      projectId: project1.id,
      assignedToId: julia.id,
      createdById: ana.id,
      dueDate: new Date('2026-06-15'),
    },
  });

  const task4 = await prisma.task.create({
    data: {
      title: 'Modelagem 3D - Cenário',
      description: 'Modelar ambiente principal do comercial',
      status: 'BACKLOG',
      priority: 'MEDIUM',
      projectId: project1.id,
      assignedToId: marcos.id,
      createdById: ana.id,
      dueDate: new Date('2026-06-20'),
    },
  });

  const task5 = await prisma.task.create({
    data: {
      title: 'Animação de personagens',
      description: 'Animar personagens conforme storyboard aprovado',
      status: 'BACKLOG',
      priority: 'HIGH',
      projectId: project1.id,
      assignedToId: julia.id,
      createdById: carlos.id,
      dueDate: new Date('2026-06-25'),
    },
  });

  const task6 = await prisma.task.create({
    data: {
      title: 'Renderização final',
      description: 'Renderizar cenas finais com iluminação e efeitos',
      status: 'BACKLOG',
      priority: 'MEDIUM',
      projectId: project1.id,
      assignedToId: marcos.id,
      createdById: carlos.id,
      dueDate: new Date('2026-06-30'),
    },
  });

  const task7 = await prisma.task.create({
    data: {
      title: 'Edição e pós-produção',
      description: 'Editar, colorizar e adicionar trilha sonora',
      status: 'BACKLOG',
      priority: 'MEDIUM',
      projectId: project1.id,
      assignedToId: carlos.id,
      createdById: ana.id,
      dueDate: new Date('2026-07-05'),
    },
  });

  const task8 = await prisma.task.create({
    data: {
      title: 'Aprovação do cliente',
      description: 'Apresentar versão final para aprovação do cliente',
      status: 'BACKLOG',
      priority: 'HIGH',
      projectId: project1.id,
      assignedToId: ana.id,
      createdById: ana.id,
      dueDate: new Date('2026-07-08'),
    },
  });

  // Task dependencies
  await prisma.taskDependency.createMany({
    data: [
      { taskId: task2.id, dependsOnId: task1.id },
      { taskId: task3.id, dependsOnId: task2.id },
      { taskId: task4.id, dependsOnId: task2.id },
      { taskId: task5.id, dependsOnId: task3.id },
      { taskId: task6.id, dependsOnId: task5.id },
      { taskId: task7.id, dependsOnId: task6.id },
      { taskId: task8.id, dependsOnId: task7.id },
    ],
  });

  // Time entries
  await prisma.timeEntry.createMany({
    data: [
      { taskId: task1.id, userId: ana.id, duration: 4800, description: 'Reunião de briefing', createdAt: new Date('2026-06-01T10:00:00') },
      { taskId: task2.id, userId: carlos.id, duration: 14400, description: 'Desenvolvimento do storyboard', createdAt: new Date('2026-06-04T09:00:00') },
      { taskId: task3.id, userId: julia.id, duration: 28800, description: 'Modelagem inicial do personagem', createdAt: new Date('2026-06-05T08:00:00') },
    ],
  });

  // Deliveries
  await prisma.delivery.createMany({
    data: [
      { title: 'Storyboard versão 1', description: 'Primeira versão do storyboard para revisão', status: 'APPROVED', projectId: project1.id, createdById: carlos.id, reviewedById: ana.id, reviewedAt: new Date('2026-06-09'), dueDate: new Date('2026-06-08') },
      { title: 'Pré-visualização personagem', description: 'Blocking do personagem principal', status: 'IN_REVIEW', projectId: project1.id, createdById: julia.id, dueDate: new Date('2026-06-12') },
      { title: 'Lookdev - Cenário', description: 'Testes de iluminação e texturas do cenário', status: 'IN_PRODUCTION', projectId: project1.id, createdById: marcos.id, dueDate: new Date('2026-06-18') },
    ],
  });

  // Custom fields
  const cfSoftware = await prisma.customField.create({
    data: { name: 'Software', type: 'select', options: JSON.stringify(['Blender', 'Maya', '3ds Max', 'Cinema 4D', 'Houdini']), projectId: project1.id },
  });
  const cfBudget = await prisma.customField.create({
    data: { name: 'Orçamento', type: 'number', projectId: project1.id },
  });
  const cfClient = await prisma.customField.create({
    data: { name: 'Cliente visível', type: 'boolean', projectId: project1.id },
  });

  await prisma.customFieldValue.createMany({
    data: [
      { customFieldId: cfSoftware.id, taskId: task3.id, value: 'Blender' },
      { customFieldId: cfSoftware.id, taskId: task4.id, value: 'Blender' },
      { customFieldId: cfBudget.id, taskId: task3.id, value: '5000' },
      { customFieldId: cfBudget.id, taskId: task5.id, value: '8000' },
      { customFieldId: cfClient.id, taskId: task8.id, value: 'true' },
    ],
  });

  // Task templates
  const template = await prisma.taskTemplate.create({
    data: {
      name: 'Pipeline de Animação 3D',
      description: 'Template padrão para projetos de animação 3D',
      createdById: ana.id,
      items: {
        create: [
          { title: 'Briefing', description: 'Alinhamento com cliente', priority: 'HIGH', order: 1 },
          { title: 'Roteiro e Storyboard', description: 'Pré-produção', priority: 'HIGH', order: 2 },
          { title: 'Modelagem', description: 'Personagens e cenários', priority: 'URGENT', order: 3 },
          { title: 'Texturização', description: 'UV mapping e texturas', priority: 'HIGH', order: 4 },
          { title: 'Rigging', description: 'Setup de personagens', priority: 'MEDIUM', order: 5 },
          { title: 'Animação', description: 'Animação conforme storyboard', priority: 'HIGH', order: 6 },
          { title: 'Iluminação', description: 'Lighting e render layers', priority: 'MEDIUM', order: 7 },
          { title: 'Render Final', description: 'Renderização e composição', priority: 'HIGH', order: 8 },
          { title: 'Pós-produção', description: 'Edição final e entrega', priority: 'MEDIUM', order: 9 },
        ],
      },
    },
  });

  // Chat groups
  const group1 = await prisma.group.create({
    data: { name: 'Comercial XYZ', projectId: project1.id, createdById: ana.id },
  });
  const group2 = await prisma.group.create({
    data: { name: 'Curta-metragem', projectId: project2.id, createdById: carlos.id },
  });

  for (const u of [ana, carlos, julia, marcos, demo]) {
    await prisma.groupMember.create({ data: { groupId: group1.id, userId: u.id } });
  }
  for (const u of [ana, carlos, julia, demo]) {
    await prisma.groupMember.create({ data: { groupId: group2.id, userId: u.id } });
  }

  // Messages
  await prisma.message.createMany({
    data: [
      { content: 'Bom dia equipe! Vamos iniciar o comercial XYZ hoje.', groupId: group1.id, userId: ana.id, createdAt: new Date('2026-06-01T08:00:00') },
      { content: 'Bom dia! Já estou revisando o briefing.', groupId: group1.id, userId: carlos.id, createdAt: new Date('2026-06-01T08:05:00') },
      { content: 'O storyboard ficou ótimo! @Carlos Oliveira', groupId: group1.id, userId: julia.id, createdAt: new Date('2026-06-04T14:00:00') },
      { content: 'Comecei a modelagem do personagem principal.', groupId: group1.id, userId: julia.id, createdAt: new Date('2026-06-05T09:30:00') },
      { content: 'Vou preparar o cenário assim que o storyboard estiver finalizado.', groupId: group1.id, userId: marcos.id, createdAt: new Date('2026-06-05T10:00:00') },
    ],
  });

  // Files
  const file1 = await prisma.file.create({
    data: {
      name: 'briefing-comercial-xyz.pdf',
      originalName: 'briefing-comercial-xyz.pdf',
      key: 'uploads/demo/briefing.pdf',
      size: 245000,
      mimeType: 'application/pdf',
      projectId: project1.id,
      uploadedById: ana.id,
      version: 1,
    },
  });
  await prisma.fileVersion.create({
    data: { version: 1, name: 'briefing-comercial-xyz.pdf', originalName: 'briefing-comercial-xyz.pdf', key: 'uploads/demo/briefing.pdf', size: 245000, fileId: file1.id, uploadedById: ana.id },
  });

  const file2 = await prisma.file.create({
    data: {
      name: 'storyboard-v1.pdf',
      originalName: 'storyboard-v1.pdf',
      key: 'uploads/demo/storyboard.pdf',
      size: 1200000,
      mimeType: 'application/pdf',
      projectId: project1.id,
      uploadedById: carlos.id,
      version: 1,
    },
  });
  await prisma.fileVersion.create({
    data: { version: 1, name: 'storyboard-v1.pdf', originalName: 'storyboard-v1.pdf', key: 'uploads/demo/storyboard.pdf', size: 1200000, fileId: file2.id, uploadedById: carlos.id },
  });

  // Audit log
  await prisma.auditLog.createMany({
    data: [
      { action: 'PROJECT_CREATED', entity: 'project', entityId: project1.id, metadata: JSON.stringify({ description: 'Criou o projeto Comercial XYZ' }), userId: ana.id, createdAt: new Date('2026-06-01T08:00:00') },
      { action: 'TASK_CREATED', entity: 'task', entityId: task1.id, metadata: JSON.stringify({ description: 'Criou a tarefa Briefing criativo' }), userId: ana.id, createdAt: new Date('2026-06-01T08:30:00') },
      { action: 'TASK_STATUS_CHANGED', entity: 'task', entityId: task1.id, metadata: JSON.stringify({ description: 'Marcou Briefing criativo como concluída' }), userId: ana.id, createdAt: new Date('2026-06-03T17:00:00') },
      { action: 'FILE_UPLOADED', entity: 'file', entityId: file1.id, metadata: JSON.stringify({ description: 'Enviou briefing-comercial-xyz.pdf' }), userId: ana.id, createdAt: new Date('2026-06-01T10:00:00') },
      { action: 'MEMBER_ADDED', entity: 'user', entityId: demo.id, metadata: JSON.stringify({ description: 'Adicionou Demo User ao projeto' }), userId: ana.id, createdAt: new Date('2026-06-01T09:00:00') },
    ],
  });

  console.log('✅ Seed concluído com sucesso!');
  console.log('');
  console.log('📧 Contas de demonstração:');
  console.log('   admin@teamflow.app / 123456 — ADMIN');
  console.log('   ana@teamflow.app / 123456');
  console.log('   carlos@teamflow.app / 123456');
  console.log('   julia@teamflow.app / 123456');
  console.log('   marcos@teamflow.app / 123456');
  console.log('   demo@teamflow.app / 123456');
  console.log('');
  console.log('📦 Projetos:');
  console.log('   - Comercial XYZ (8 tarefas, 3 entregas)');
  console.log('   - Curta-metragem Animado');
  console.log('');
  console.log('📋 Template disponível: Pipeline de Animação 3D (9 etapas)');
}

main()
  .catch((e) => {
    console.error('❌ Erro no seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
