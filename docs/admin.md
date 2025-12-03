# 管理员功能使用说明

## 功能概述

管理员界面允许管理员查看所有用户的订阅信息，并可以禁用/启用用户的订阅（相当于拉黑功能）。

## 数据库变更

### 新增字段

在 `User` 表中添加了两个字段：

1. **role** (String, 默认值: "user")
   - 用户角色：`"user"` 或 `"admin"`
   - 用于权限控制

2. **subscriptionStatus** (Int, 默认值: 1)
   - 订阅状态：`0` = 禁用，`1` = 可用
   - 即使订阅未过期，如果状态为 0，用户也无法使用订阅功能

### 数据库迁移

运行以下命令更新数据库：

```bash
# 生成 Prisma Client
pnpm db:generate

# 推送数据库变更（开发环境）
pnpm db:push

# 或使用迁移（生产环境推荐）
pnpm db:migrate --name add_admin_and_subscription_status
```

## 设置管理员用户

### 方法1：通过数据库直接设置

```sql
-- 将指定用户设置为管理员
UPDATE "User" SET role = 'admin' WHERE email = 'admin@example.com';
```

### 方法2：通过 Prisma Studio

1. 运行 `pnpm prisma studio`
2. 打开 User 表
3. 找到目标用户，将 `role` 字段改为 `"admin"`

## 访问管理员界面

1. 使用管理员账号登录
2. 访问 `/admin` 路径
3. 如果当前用户不是管理员，会自动重定向到简历列表页面

## 功能说明

### 用户列表

- **搜索功能**：支持按邮箱或姓名搜索
- **状态筛选**：
  - 全部状态
  - 有效订阅
  - 已过期
  - 已禁用
  - 未激活
- **分页**：支持分页浏览，可调整每页显示数量
- **信息展示**：
  - 邮箱
  - 姓名
  - 角色（管理员/用户）
  - 订阅状态
  - 到期时间
  - 简历数量
  - 注册时间

### 禁用/启用订阅

- 点击操作列的"禁用"或"启用"按钮
- 会弹出确认对话框
- 确认后立即生效
- **限制**：
  - 不能禁用自己的订阅
  - 不能禁用其他管理员的订阅
  - 管理员账号不显示操作按钮

## API 接口

### 获取用户列表

```
GET /api/admin/users?page=1&pageSize=10&search=xxx&status=all
Authorization: Bearer <token>
```

**查询参数**：
- `page`: 页码（默认: 1）
- `pageSize`: 每页数量（默认: 10）
- `search`: 搜索关键词（邮箱或姓名）
- `status`: 状态筛选（all, valid, expired, banned, none）

**返回**：
```json
{
  "success": true,
  "data": [
    {
      "id": "user_id",
      "email": "user@example.com",
      "name": "用户名",
      "role": "user",
      "subscriptionStatus": 1,
      "subscriptionState": "valid",
      "subscriptionExpiresAt": "2025-03-01T00:00:00.000Z",
      "resumeCount": 5,
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "pageSize": 10,
    "total": 100,
    "totalPages": 10
  }
}
```

### 禁用/启用订阅

```
POST /api/admin/users/[id]/ban
Authorization: Bearer <token>
Content-Type: application/json

{
  "status": 0  // 0=禁用, 1=启用
}
```

**返回**：
```json
{
  "success": true,
  "message": "订阅已禁用",
  "data": {
    "id": "user_id",
    "email": "user@example.com",
    "subscriptionStatus": 0,
    "subscriptionExpiresAt": "2025-03-01T00:00:00.000Z"
  }
}
```

## 订阅检查逻辑

更新后的订阅检查逻辑：

1. **优先检查 `subscriptionStatus`**：
   - 如果为 `0`（禁用），直接返回无效，即使订阅未过期
   - 如果为 `1`（可用），继续检查过期时间

2. **检查过期时间**：
   - 如果没有 `subscriptionExpiresAt`，返回无订阅
   - 如果已过期，返回已过期
   - 如果未过期，返回有效

## 注意事项

1. **权限控制**：只有 `role = "admin"` 的用户才能访问管理员界面和 API
2. **安全限制**：
   - 管理员不能禁用自己的订阅
   - 管理员不能禁用其他管理员的订阅
3. **订阅状态优先级**：`subscriptionStatus` 的优先级高于过期时间
4. **数据迁移**：现有用户的 `role` 默认为 `"user"`，`subscriptionStatus` 默认为 `1`

