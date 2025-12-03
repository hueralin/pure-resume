# 激活码订阅功能使用说明

## 功能概述

本系统使用激活码机制实现付费订阅功能。用户通过激活码激活后，可以获得3个月的订阅有效期。过期后用户只能导出PDF或删除简历，无法创建或编辑简历。

## 数据库迁移

首次使用前，需要运行数据库迁移：

```bash
# 生成 Prisma Client
pnpm db:generate

# 推送数据库变更（开发环境）
pnpm db:push

# 或使用迁移（生产环境推荐）
pnpm db:migrate
```

## 生成激活码

### 方法1：使用脚本（推荐）

```bash
# 生成1个激活码，有效期90天（默认，约3个月）
pnpm generate-codes

# 生成10个激活码，有效期90天（约3个月）
pnpm generate-codes 10 90

# 生成5个激活码，有效期30天
pnpm generate-codes 5 30

# 生成3个激活码，有效期180天（约6个月）
pnpm generate-codes 3 180
```

### 方法2：使用 API

需要先设置环境变量 `ADMIN_SECRET`：

```bash
# .env
ADMIN_SECRET=your-secret-key-change-me
```

然后调用 API：

```bash
# 生成激活码
curl -X POST http://localhost:3000/api/admin/activation-codes \
  -H "Content-Type: application/json" \
  -d '{
    "count": 10,
    "days": 90,
    "adminSecret": "your-secret-key-change-me"
  }'

# 查询所有激活码
curl "http://localhost:3000/api/admin/activation-codes?adminSecret=your-secret-key-change-me"
```

## 用户激活流程

1. 用户登录后，访问订阅状态页面
2. 输入激活码（格式：`XXXXX-XXXXX-XXXXX-XXXXX-XXXXX`，25位字符）
3. 点击"激活"按钮
4. 激活成功后，订阅有效期从激活时开始计算，3个月后过期

激活码格式说明：
- 25位字符（数字和大写字母）
- 5组，每组5个字符
- 用连字符（-）分隔
- 示例：`ABCDE-FGHIJ-KLMNO-PQRST-UVWXY`

## API 接口

### 激活激活码

```
POST /api/activation/activate
Authorization: Bearer <token>
Body: { "code": "ABCDE-FGHIJ-KLMNO-PQRST-UVWXY" }
```

### 查询订阅状态

```
GET /api/subscription/status
Authorization: Bearer <token>
```

返回：
```json
{
  "valid": true,
  "expiresAt": "2025-03-01T00:00:00.000Z",
  "daysLeft": 45
}
```

### 生成激活码（管理员）

```
POST /api/admin/activation-codes
Body: {
  "count": 10,
  "months": 3,
  "adminSecret": "your-secret-key"
}
```

## 订阅限制

- **未激活或已过期**：只能查看、导出PDF、删除简历
- **已激活且有效**：可以创建、编辑、保存简历

## 前端组件

### 订阅状态组件

```tsx
import { SubscriptionStatus } from '@/components/subscription/subscription-status'

<SubscriptionStatus />
```

### 激活码输入组件

```tsx
import { ActivationForm } from '@/components/subscription/activation-form'

<ActivationForm onSuccess={() => console.log('激活成功')} />
```

## 注意事项

1. **激活码只能使用一次**：每个激活码只能被一个用户使用
2. **激活码有效期**：激活码本身有过期时间（生成时设置），过期后无法激活
3. **订阅有效期**：从激活时开始计算，固定为3个月
4. **续费**：用户可以使用新的激活码延长订阅有效期
5. **管理员密钥**：请妥善保管 `ADMIN_SECRET`，不要泄露

## 数据库结构

### ActivationCode 表

- `id`: 主键
- `code`: 激活码（唯一）
- `userId`: 已激活的用户ID（null表示未使用）
- `expiresAt`: 激活码过期时间
- `activatedAt`: 激活时间
- `createdAt`: 创建时间

### User 表新增字段

- `subscriptionExpiresAt`: 订阅过期时间

