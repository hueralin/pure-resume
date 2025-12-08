# 订阅系统迁移指南

## 概述

本次更新重构了订阅系统的数据库设计，引入了 Subscription 表来记录订阅历史，并移除了激活码的过期时间限制。

## 数据库变更

### 新增表

**Subscription 表**：记录每次激活事件
- `id`: 主键
- `userId`: 用户ID
- `activationCodeId`: 激活码ID（唯一约束）
- `startAt`: 订阅开始时间（激活时间）
- `expiresAt`: 订阅过期时间（激活时+3个月）
- `status`: 订阅状态（active, expired）
- `createdAt`: 创建时间

### 修改的表

**User 表**：
- 移除 `activationCode` 关系（通过 Subscription 表关联）
- 保留 `subscriptionExpiresAt` 和 `subscriptionStatus`（冗余字段，方便快速查询）
- 新增 `subscriptions` 关系（一对多）

**ActivationCode 表**：
- 移除 `userId` 字段（通过 Subscription 表关联）
- 移除 `activatedAt` 字段（在 Subscription 表的 `startAt` 中）
- 移除 `expiresAt` 字段（激活码不会过期）
- 新增 `subscription` 关系（一对一）

## 迁移步骤

### 快速迁移（推荐）

如果你有数据库备份（如 `resume_db_20251204150748cvsc8.sql`），可以使用自动迁移脚本：

#### Windows (PowerShell)

```powershell
# 在项目根目录下运行
powershell -ExecutionPolicy Bypass -File scripts/migrate-from-backup.ps1
```

#### Linux/Mac/Git Bash

```bash
# 在项目根目录下运行
bash scripts/migrate-from-backup.sh
```

**注意**：脚本会自动：
1. 恢复数据库备份
2. 备份现有激活记录
3. 运行 Prisma 迁移
4. 迁移数据到 Subscription 表
5. 清理临时表

如果脚本无法运行，请参考下面的手动迁移步骤。

### 手动迁移

#### 1. 备份数据库

**重要：在迁移前请务必备份数据库！**

```bash
# PostgreSQL 备份示例
pg_dump -U your_user -d your_database > backup_$(date +%Y%m%d_%H%M%S).sql
```

#### 2. 运行数据库迁移

```bash
# 生成 Prisma Client
pnpm db:generate

# 推送数据库变更（开发环境）
pnpm db:push

# 或使用迁移（生产环境推荐）
pnpm db:migrate dev --name add_subscription_table
```

### 3. 从备份恢复并迁移（如果有备份）

如果你有数据库备份（如 `resume_db_20251204150748cvsc8.sql`），请参考：
- **自动脚本**：`scripts/migrate-from-backup.sh` (Linux/Mac) 或 `scripts/migrate-from-backup.ps1` (Windows)
- **手动步骤**：`scripts/migrate-from-backup-manual.md`

### 4. 检查迁移状态（如果没有备份）

如果你没有备份，需要先检查当前数据库状态：

```bash
# 使用 psql 连接到数据库并运行检查脚本
psql -U your_user -d your_database -f scripts/check-migration-status.sql
```

或者直接在数据库中运行：

```sql
-- 检查 ActivationCode 表是否还有 userId 字段
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'ActivationCode' AND column_name = 'userId';
```

**如果查询返回结果**：说明还没有运行迁移，可以按照方案 A 进行迁移。

**如果查询没有返回结果**：说明已经运行了迁移，`userId` 字段已被移除，需要按照方案 B 处理。

### 4. 数据迁移（重要）

**重要提示**：如果你有现有的激活记录，必须在运行 `db:push` 或 `db:migrate` **之前**完成数据迁移，否则旧的激活记录将无法恢复。

#### 方案 A：迁移前备份并迁移（推荐）

**使用迁移脚本（推荐）**：

```bash
# 步骤 1: 运行迁移脚本（会创建备份表）
psql -U your_user -d your_database -f scripts/migrate-activations.sql

# 步骤 2: 运行数据库迁移
pnpm db:push
# 或
pnpm db:migrate dev --name add_subscription_table

# 步骤 3: 在 migrate-activations.sql 文件中取消注释步骤 4 的 SQL，然后运行
# 或者直接运行以下 SQL：
```

**手动步骤**：

**步骤 1：备份现有激活记录**

```sql
-- 备份激活记录到临时表
CREATE TABLE "ActivationCode_backup" AS
SELECT 
  "id",
  "code",
  "userId",
  "activatedAt",
  "createdAt"
FROM "ActivationCode"
WHERE "userId" IS NOT NULL AND "activatedAt" IS NOT NULL;
```

**步骤 2：运行数据库迁移**

```bash
pnpm db:push
# 或
pnpm db:migrate dev --name add_subscription_table
```

**步骤 3：迁移数据到 Subscription 表**

```sql
-- 将备份的激活记录迁移到 Subscription 表
INSERT INTO "Subscription" ("id", "userId", "activationCodeId", "startAt", "expiresAt", "status", "createdAt")
SELECT 
  gen_random_uuid()::text as id,
  "userId",
  "id" as "activationCodeId",
  "activatedAt" as "startAt",
  -- 假设订阅时长为3个月，根据实际情况调整
  ("activatedAt" + INTERVAL '3 months') as "expiresAt",
  CASE 
    WHEN ("activatedAt" + INTERVAL '3 months') > NOW() THEN 'active'
    ELSE 'expired'
  END as status,
  "activatedAt" as "createdAt"
FROM "ActivationCode_backup"
ON CONFLICT ("activationCodeId") DO NOTHING;  -- 如果已存在则跳过

-- 更新 User 表的 subscriptionExpiresAt（从最新的订阅记录）
UPDATE "User" u
SET "subscriptionExpiresAt" = (
  SELECT s."expiresAt"
  FROM "Subscription" s
  WHERE s."userId" = u."id"
  ORDER BY s."expiresAt" DESC
  LIMIT 1
)
WHERE EXISTS (
  SELECT 1 FROM "Subscription" s WHERE s."userId" = u."id"
);
```

**步骤 4：清理临时表**

```sql
-- 删除临时备份表
DROP TABLE IF EXISTS "ActivationCode_backup";
```

#### 方案 B：如果已经运行了迁移

如果你已经运行了 `db:push` 或 `db:migrate`，`ActivationCode` 表的 `userId` 字段已经被移除，旧的激活记录可能无法恢复。

**选项 1：从数据库备份恢复**

如果你有数据库备份，可以：
1. 恢复备份
2. 按照方案 A 的步骤重新迁移

**选项 2：接受数据丢失**

如果无法恢复，旧的激活记录将丢失。用户可以重新激活激活码（如果激活码还在的话）。

**选项 3：手动创建订阅记录**

如果你知道哪些用户激活了哪些激活码，可以手动创建 Subscription 记录：

```sql
-- 手动创建订阅记录（需要替换实际的 ID 和时间）
INSERT INTO "Subscription" ("id", "userId", "activationCodeId", "startAt", "expiresAt", "status", "createdAt")
VALUES (
  gen_random_uuid()::text,
  'user_id_here',           -- 替换为实际的用户 ID
  'activation_code_id_here', -- 替换为实际的激活码 ID
  '2024-01-01 00:00:00',    -- 替换为实际的激活时间
  '2024-04-01 00:00:00',    -- 替换为实际的过期时间（激活时间 + 3个月）
  'expired',                -- 或 'active' 如果还在有效期内
  '2024-01-01 00:00:00'     -- 替换为实际的创建时间
);
```

### 4. 验证迁移

1. 检查 Subscription 表是否创建成功
2. 检查现有激活记录是否已迁移
3. 测试激活功能是否正常
4. 测试订阅状态检查是否正常

## 代码变更

### 已更新的文件

1. **`prisma/schema.prisma`**
   - 添加 Subscription 模型
   - 修改 User 和 ActivationCode 模型

2. **`app/api/activation/activate/route.ts`**
   - 更新激活逻辑，创建 Subscription 记录
   - 移除激活码过期检查

3. **`app/api/admin/activation-codes/route.ts`**
   - 更新生成激活码逻辑，移除 expiresAt
   - 更新获取激活码列表，返回订阅信息

4. **`app/admin/admin-client.tsx`**
   - 更新激活码列表显示，显示订阅过期时间
   - 移除激活码过期状态显示

5. **`scripts/generate-codes.js`**
   - 更新生成激活码脚本，移除 expiresAt 参数

### 无需修改的文件

以下文件使用 User 表的冗余字段，无需修改：
- `lib/subscription.ts` - 订阅状态检查逻辑
- `app/api/admin/users/route.ts` - 用户列表 API

## 回滚方案

如果迁移出现问题，可以回滚：

1. 恢复数据库备份
2. 回滚代码到之前的版本

## 注意事项

1. **数据一致性**：确保 User 表的 `subscriptionExpiresAt` 与最新的 Subscription 记录保持一致
2. **激活码唯一性**：通过 `activationCodeId` 的唯一约束确保一个激活码只能使用一次
3. **级联删除**：删除用户时，订阅记录会级联删除
4. **订阅状态**：`status` 字段可以根据 `expiresAt` 自动计算，也可以手动更新

## 常见问题

### Q: 迁移后现有的激活码还能用吗？

A: 可以。激活码不会过期，可以随时使用。

### Q: 现有的激活记录会丢失吗？

A: 如果运行了数据迁移 SQL，现有记录会被迁移到 Subscription 表。如果没有运行，需要手动迁移或重新激活。

### Q: 订阅过期时间如何计算？

A: 从用户激活时开始计算，固定为 3 个月。如果用户有未过期的订阅，续费时会从当前过期时间延长 3 个月。

### Q: 如何查看用户的订阅历史？

A: 通过 `User.subscriptions` 关系可以查询用户的所有订阅记录。

## 后续优化

1. 添加订阅过期邮件提醒
2. 添加订阅使用统计和报表
3. 支持不同时长的订阅（1个月、3个月、6个月、1年）
4. 添加订阅历史查询 API
5. 支持批量导入激活码（从 CSV 文件）

