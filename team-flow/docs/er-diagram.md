# Diagrama Entidade-Relacionamento (ERD)

```mermaid
erDiagram
    User {
        String id PK
        String username UK
        String name
        String email UK
        String password
        String avatar
        String roleType
        String roleId FK
        Boolean isActive
        Boolean emailVerified
        String emailToken
        String planId FK
        BigInt storageUsed
        DateTime createdAt
        DateTime updatedAt
    }

    RefreshToken {
        String id PK
        String token UK
        String userId FK
        DateTime expiresAt
        DateTime createdAt
    }

    Plan {
        String id PK
        String name UK
        String description
        Int maxUsers
        BigInt maxStorage
        Int maxProjects
        Float priceMonthly
        Float priceYearly
        String features
        Boolean isActive
        DateTime createdAt
        DateTime updatedAt
    }

    PlanHistory {
        String id PK
        String planId FK
        String userId FK
        String action
        String data
        DateTime createdAt
    }

    Role {
        String id PK
        String name UK
        String description
        String permissions
        DateTime createdAt
        DateTime updatedAt
    }

    Client {
        String id PK
        String name
        String company
        String email
        String phone
        String avatar
        String notes
        String createdById FK
        DateTime createdAt
        DateTime updatedAt
    }

    Project {
        String id PK
        String name
        String description
        String clientId FK
        DateTime startDate
        DateTime endDate
        String status
        String ownerId FK
        DateTime createdAt
        DateTime updatedAt
    }

    ProjectMember {
        String id PK
        String projectId FK
        String userId FK
        String role
        DateTime createdAt
    }

    Folder {
        String id PK
        String name
        String projectId FK
        String parentId FK
        String createdById FK
        DateTime createdAt
        DateTime updatedAt
    }

    Task {
        String id PK
        String title
        String description
        String status
        String priority
        DateTime dueDate
        Float position
        String projectId FK
        String assignedToId FK
        String createdById FK
        DateTime createdAt
        DateTime updatedAt
    }

    TaskComment {
        String id PK
        String content
        String mentions
        String taskId FK
        String userId FK
        DateTime createdAt
    }

    CommentReply {
        String id PK
        String content
        String mentions
        String commentId FK
        String userId FK
        DateTime createdAt
    }

    TaskHistory {
        String id PK
        String taskId FK
        String userId FK
        String field
        String oldValue
        String newValue
        DateTime createdAt
    }

    Delivery {
        String id PK
        String title
        String description
        String status
        String projectId FK
        String createdById FK
        String reviewedById FK
        String reviewNote
        DateTime reviewedAt
        DateTime dueDate
        DateTime createdAt
        DateTime updatedAt
    }

    DeliveryVersion {
        String id PK
        Int version
        String note
        String deliveryId FK
        String uploadedById FK
        String files
        DateTime createdAt
    }

    File {
        String id PK
        String name
        String originalName
        String mimeType
        Int size
        String key
        Int version
        String folderId FK
        String projectId FK
        String taskId FK
        String groupId FK
        String deliveryId FK
        String uploadedById FK
        DateTime createdAt
    }

    FileVersion {
        String id PK
        Int version
        String name
        String originalName
        Int size
        String key
        String note
        String fileId FK
        String uploadedById FK
        DateTime createdAt
    }

    Group {
        String id PK
        String name
        String projectId FK
        String createdById FK
        DateTime createdAt
        DateTime updatedAt
    }

    GroupMember {
        String id PK
        String groupId FK
        String userId FK
        DateTime createdAt
    }

    Message {
        String id PK
        String content
        String groupId FK
        String userId FK
        String fileId FK
        DateTime createdAt
    }

    Notification {
        String id PK
        String type
        String content
        String recipientId FK
        String senderId FK
        String projectId FK
        String taskId
        String deliveryId
        Boolean read
        DateTime createdAt
    }

    AuditLog {
        String id PK
        String userId FK
        String action
        String entity
        String entityId
        String metadata
        String ipAddress
        DateTime createdAt
    }

    %% Relacionamentos

    User ||--o{ RefreshToken : "possui"
    User ||--o{ Project : "é dono (ProjectOwner)"
    User ||--o{ Task : "criou (TaskCreator)"
    User ||--o{ Task : "é responsável (TaskAssignee)"
    User ||--o{ ProjectMember : "é membro"
    User ||--o{ TaskComment : "comentou"
    User ||--o{ CommentReply : "respondeu"
    User ||--o{ TaskHistory : "registrou"
    User ||--o{ File : "fez upload"
    User ||--o{ FileVersion : "versionou"
    User ||--o{ Delivery : "criou (DeliveryCreator)"
    User ||--o{ Delivery : "revisou (DeliveryReviewer)"
    User ||--o{ GroupMember : "participa"
    User ||--o{ Message : "enviou"
    User ||--o{ Notification : "recebeu (NotificationRecipient)"
    User ||--o{ Notification : "enviou (NotificationSender)"
    User ||--o{ Group : "criou (GroupCreator)"
    User ||--o{ AuditLog : "gerou"
    User ||--o{ Folder : "criou"
    User ||--o{ Client : "cadastrou"
    User ||--o{ DeliveryVersion : "versionou"
    User ||--o{ PlanHistory : "tem histórico"

    Plan ||--o{ User : "contém"
    Plan ||--o{ PlanHistory : "registra"

    Role ||--o{ User : "define"

    Client ||--o{ Project : "referencia"

    Project ||--o{ ProjectMember : "contém"
    Project ||--o{ Task : "contém"
    Project ||--o{ File : "contém"
    Project ||--o{ Folder : "contém"
    Project ||--o{ Group : "contém"
    Project ||--o{ Delivery : "contém"
    Project ||--o{ Notification : "contém"

    Folder ||--o{ Folder : "subpastas (FolderTree)"
    Folder ||--o{ File : "contém"

    Task ||--o{ TaskComment : "possui"
    Task ||--o{ TaskHistory : "registra"
    Task ||--o{ File : "anexada"

    TaskComment ||--o{ CommentReply : "possui"

    Delivery ||--o{ DeliveryVersion : "versiona"
    Delivery ||--o{ File : "anexada"

    File ||--o{ FileVersion : "versiona"
    File ||--o{ Message : "anexada"

    Group ||--o{ GroupMember : "contém"
    Group ||--o{ Message : "contém"
    Group ||--o{ File : "compartilhado"
```

## Legenda

| Símbolo | Significado |
|---------|-------------|
| `||--o{` | Um para muitos (ex: um User possui muitos Projects) |
| `||--||` | Um para um |
| `PK` | Chave primária |
| `FK` | Chave estrangeira |
| `UK` | Chave única |

## Modelos (23 no total)

| # | Modelo | Descrição |
|---|--------|-----------|
| 1 | **User** | Usuários do sistema (admin, líder, funcionário) |
| 2 | **RefreshToken** | Tokens de renovação JWT |
| 3 | **Plan** | Planos de assinatura (Gratuito, Equipe, Empresa, Corporativo) |
| 4 | **PlanHistory** | Histórico de mudanças de plano |
| 5 | **Role** | Cargos com permissões customizáveis |
| 6 | **Client** | Clientes vinculados a projetos |
| 7 | **Project** | Projetos |
| 8 | **ProjectMember** | Membros de um projeto (N:N User-Project) |
| 9 | **Folder** | Pastas organizacionais dentro de projetos |
| 10 | **Task** | Tarefas do Kanban |
| 11 | **TaskComment** | Comentários em tarefas |
| 12 | **CommentReply** | Respostas a comentários |
| 13 | **TaskHistory** | Histórico de alterações de tarefas |
| 14 | **Delivery** | Entregas associadas a projetos |
| 15 | **DeliveryVersion** | Versões de uma entrega |
| 16 | **File** | Arquivos enviados |
| 17 | **FileVersion** | Versões de arquivos |
| 18 | **Group** | Grupos de chat |
| 19 | **GroupMember** | Membros de grupos de chat |
| 20 | **Message** | Mensagens de chat |
| 21 | **Notification** | Notificações do sistema |
| 22 | **AuditLog** | Trilha de auditoria |
