# 订阅系统设计文档

## 概述

本文档描述了订阅系统的数据库设计、表关系、业务流程和关键逻辑。

## 数据库设计

### 表结构

#### 1. User 表（用户表）

存储用户基本信息和当前订阅状态。

```prisma
model User {
  id                   String           @id @default(cuid())
  email                String           @unique
  password             String
  name                 String?
  role                 String           @default("user")  // 用户角色：user, admin
  resumes              Resume[]
  subscriptions        Subscription[]   // 用户的订阅历史（一对多）
  subscriptionExpiresAt DateTime?        // 当前订阅过期时间（冗余字段，方便快速查询）
  subscriptionStatus   Int              @default(1)      // 当前订阅状态：0=禁用 1=可用
  createdAt            DateTime         @default(now())
  updatedAt            DateTime         @updatedAt
}
```

**字段说明：**
- `subscriptionExpiresAt`：当前订阅的过期时间（冗余字段，从最新的 Subscription 记录同步）
- `subscriptionStatus`：当前订阅状态（0=禁用，1=可用），用于管理员禁用功能
- `subscriptions`：关联到 Subscription 表，记录用户的订阅历史

#### 2. ActivationCode 表（激活码表）

存储激活码信息。

```prisma
model ActivationCode {
  id          String        @id @default(cuid())
  code        String        @unique  // 激活码，格式：XXXXX-XXXXX-XXXXX-XXXXX-XXXXX
  subscription Subscription? // 通过订阅表关联用户（一对一）
  createdAt   DateTime      @default(now())
  
  @@index([code])
}
```

**字段说明：**
- `code`：激活码（唯一）
- `subscription`：关联到 Subscription 表，如果激活码已被使用，会有对应的订阅记录
- **移除的字段**：
  - `userId`：不再直接关联用户，通过 Subscription 表关联
  - `activatedAt`：激活时间在 Subscription 表的 `startAt` 中
  - `expiresAt`：激活码不会过期，移除此字段

**重要特性：**
- 激活码未使用时不会过期
- 激活码只能使用一次
- 激活码使用后，通过 Subscription 表关联到用户

#### 3. Subscription 表（订阅表，新增）

作为 User 和 ActivationCode 的关系表，记录每次激活事件。

```prisma
model Subscription {
  id              String          @id @default(cuid())
  userId          String
  activationCodeId String         @unique  // 一个激活码只能使用一次
  startAt         DateTime        // 订阅开始时间（激活时间）
  expiresAt       DateTime        // 订阅过期时间（激活时+3个月）
  status          String          @default("active")  // active, expired
  createdAt       DateTime        @default(now())
  
  user            User            @relation(fields: [userId], references: [id], onDelete: Cascade)
  activationCode  ActivationCode  @relation(fields: [activationCodeId], references: [id])
  
  @@index([userId])
  @@index([activationCodeId])
}
```

**字段说明：**
- `userId`：关联到用户
- `activationCodeId`：关联到激活码（唯一约束，确保一个激活码只能使用一次）
- `startAt`：订阅开始时间（用户激活激活码的时间）
- `expiresAt`：订阅过期时间（从 `startAt` 开始计算，固定为 3 个月）
- `status`：订阅状态（`active`=激活中，`expired`=已过期）

**重要特性：**
- 每次激活都会创建一条新的订阅记录
- 保留完整的订阅历史
- 支持用户多次激活（续费）

## 表关系

### 关系图

```
User 1 ──< N Subscription
                │
                │ 1
                │
ActivationCode 1 ── 1 Subscription
```

### 关系说明

1. **User ↔ Subscription**：一对多
   - 一个用户可以有多次订阅记录（续费）
   - 通过 `userId` 关联
   - 删除用户时，订阅记录级联删除

2. **ActivationCode ↔ Subscription**：一对一
   - 一个激活码只能使用一次，对应一条订阅记录
   - 通过 `activationCodeId` 关联（唯一约束）
   - 删除激活码时，订阅记录设置为 null

## 业务流程

### 1. 生成激活码

**流程：**
1. 管理员在管理后台创建激活码
2. 设置激活码数量（1-100）
3. 系统生成激活码并存储到 `ActivationCode` 表
4. 激活码状态：未使用（`subscription` 为 null）

**特点：**
- 激活码不会过期
- 激活码可以随时被使用

### 2. 用户激活

**流程：**
1. 用户输入激活码
2. 系统验证激活码：
   - 检查激活码是否存在
   - 检查激活码是否已被使用（`subscription` 不为 null）
   - ~~检查激活码是否过期~~（已移除，激活码不会过期）
3. 计算订阅过期时间：
   - 如果用户没有订阅或已过期：从激活时开始计算 3 个月
   - 如果用户有未过期的订阅：从当前过期时间延长 3 个月
4. 创建订阅记录：
   - 在 `Subscription` 表中创建新记录
   - `startAt` = 当前时间
   - `expiresAt` = `startAt` + 3 个月
   - `status` = "active"
5. 关联激活码：
   - 将激活码的 `subscription` 关联到新创建的订阅记录
6. 更新用户状态：
   - 更新 `User.subscriptionExpiresAt`（冗余字段，方便查询）
   - 保持 `User.subscriptionStatus = 1`（可用）

**关键逻辑：**
- 用户激活时才开始计算订阅过期时间
- 续费时，从当前过期时间延长，而不是重新计算

### 3. 订阅状态检查

**检查逻辑：**
1. 优先检查 `User.subscriptionStatus`：
   - 如果为 0（禁用），直接返回无效
2. 检查 `User.subscriptionExpiresAt`：
   - 如果为 null，返回无订阅
   - 如果已过期，返回已过期
   - 如果未过期，返回有效

**状态定义：**
- `none`：无订阅（`subscriptionExpiresAt` 为 null）
- `expired`：已过期（`subscriptionExpiresAt < 当前时间`）或被禁用（`subscriptionStatus = 0`）
- `valid`：有效（`subscriptionExpiresAt > 当前时间` 且 `subscriptionStatus = 1`）

### 4. 管理员禁用订阅

**流程：**
1. 管理员在用户管理页面选择用户
2. 点击"禁用"按钮
3. 系统更新 `User.subscriptionStatus = 0`
4. 订阅记录不变，但用户无法使用订阅功能

**特点：**
- 禁用是用户级别的操作，不影响订阅历史记录
- 可以重新启用（`subscriptionStatus = 1`）

### 5. 订阅过期

**流程：**
1. 系统定期检查或实时检查订阅状态
2. 如果 `expiresAt < 当前时间`，订阅状态为 `expired`
3. 用户无法创建或编辑简历，只能查看、导出、删除

**特点：**
- 订阅记录保留，状态更新为 `expired`
- 用户可以使用新激活码续费

## 数据同步

### User 表的冗余字段

`User.subscriptionExpiresAt` 和 `User.subscriptionStatus` 是冗余字段，用于快速查询当前订阅状态。

**同步时机：**
- 用户激活时：更新 `subscriptionExpiresAt`
- 管理员禁用/启用时：更新 `subscriptionStatus`
- 订阅过期时：可以通过定时任务更新状态（可选）

**数据一致性：**
- 当前订阅过期时间 = 最新的 Subscription 记录的 `expiresAt`
- 当前订阅状态 = 最新的 Subscription 记录的 `status`（结合 `subscriptionStatus`）

## API 设计

### 1. 激活激活码

```
POST /api/activation/activate
Authorization: Bearer <token>
Body: { "code": "XXXXX-XXXXX-XXXXX-XXXXX-XXXXX" }
```

**返回：**
```json
{
  "success": true,
  "expiresAt": "2025-03-01T00:00:00.000Z",
  "message": "激活成功！您的订阅将在3个月后过期"
}
```

### 2. 查询订阅状态

```
GET /api/subscription/status
Authorization: Bearer <token>
```

**返回：**
```json
{
  "valid": true,
  "state": "valid",
  "expiresAt": "2025-03-01T00:00:00.000Z",
  "daysLeft": 45
}
```

### 3. 管理员 - 获取用户列表

```
GET /api/admin/users?page=1&pageSize=10&search=xxx&status=all
Authorization: Bearer <token>
```

### 4. 管理员 - 禁用/启用订阅

```
POST /api/admin/users/[id]/ban
Authorization: Bearer <token>
Body: { "status": 0 | 1 }
```

### 5. 管理员 - 获取激活码列表

```
GET /api/admin/activation-codes
Authorization: Bearer <token>
```

**返回：**
```json
{
  "success": true,
  "count": 10,
  "codes": [
    {
      "code": "XXXXX-XXXXX-XXXXX-XXXXX-XXXXX",
      "used": true,
      "user": {
        "email": "user@example.com",
        "name": "用户名",
        "subscriptionExpiresAt": "2025-03-01T00:00:00.000Z"
      },
      "activatedAt": "2024-12-01T00:00:00.000Z",
      "createdAt": "2024-11-01T00:00:00.000Z"
    }
  ]
}
```

### 6. 管理员 - 创建激活码

```
POST /api/admin/activation-codes
Authorization: Bearer <token>
Body: {
  "count": 10,
  "days": 90  // 此参数保留但不使用（激活码不会过期）
}
```

## 关键设计决策

### 1. 为什么激活码不会过期？

- 简化管理：管理员不需要担心激活码过期
- 灵活性：激活码可以随时分发和使用
- 符合常见做法：类似微软的产品密钥

### 2. 为什么需要 Subscription 表？

- **历史记录**：保留每次激活的完整记录
- **关系清晰**：User 和 ActivationCode 通过 Subscription 关联
- **扩展性**：可以添加更多订阅相关字段（如订阅类型、价格等）
- **审计**：可以追踪用户的订阅历史

### 3. 为什么 User 表保留冗余字段？

- **性能**：快速查询当前订阅状态，无需 JOIN Subscription 表
- **简化逻辑**：订阅检查逻辑更简单
- **兼容性**：保持现有代码的兼容性

### 4. 续费逻辑

- 如果用户有未过期的订阅：从当前过期时间延长 3 个月
- 如果用户没有订阅或已过期：从激活时开始计算 3 个月

这样设计的好处：
- 用户不会因为续费而损失已购买的订阅时间
- 续费是延长，而不是重新开始

## 迁移计划

### 步骤 1：创建 Subscription 表

1. 在 `prisma/schema.prisma` 中添加 Subscription 模型
2. 修改 User 和 ActivationCode 模型，建立关系
3. 运行数据库迁移

### 步骤 2：数据迁移

1. 将现有的激活记录迁移到 Subscription 表
2. 更新 User 表的冗余字段

### 步骤 3：更新代码

1. 更新激活逻辑，创建 Subscription 记录
2. 更新订阅状态检查逻辑
3. 更新管理后台，显示订阅历史
4. 更新 API，返回订阅相关信息

## 注意事项

1. **数据一致性**：确保 User 表的冗余字段与最新的 Subscription 记录保持一致
2. **激活码唯一性**：通过 `activationCodeId` 的唯一约束确保一个激活码只能使用一次
3. **级联删除**：删除用户时，订阅记录会级联删除
4. **订阅状态**：`status` 字段可以根据 `expiresAt` 自动计算，也可以手动更新

## 后续优化

1. 添加订阅过期邮件提醒
2. 添加订阅使用统计和报表
3. 支持不同时长的订阅（1个月、3个月、6个月、1年）
4. 添加订阅历史查询 API
5. 支持批量导入激活码（从 CSV 文件）

