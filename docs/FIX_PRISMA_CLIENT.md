# 修复 Prisma Client 错误

## 问题

错误信息：
```
Unknown field `subscriptionExpiresAt` for select statement on model `User`
```

这是因为 Prisma schema 已更新，但 Prisma Client 还没有重新生成。

## 解决方案

### 方法1：停止开发服务器后重新生成（推荐）

1. **停止开发服务器**（如果正在运行）
   - 在运行 `pnpm dev` 的终端按 `Ctrl+C`

2. **推送数据库变更**
   ```bash
   pnpm db:push
   ```

3. **重新生成 Prisma Client**
   ```bash
   pnpm db:generate
   ```

4. **重新启动开发服务器**
   ```bash
   pnpm dev
   ```

### 方法2：如果方法1失败（Windows 文件权限问题）

1. **完全关闭所有相关程序**
   - 关闭开发服务器
   - 关闭 VS Code（如果打开了项目）
   - 关闭所有可能占用文件的程序

2. **等待几秒钟**，让文件锁释放

3. **重新运行命令**
   ```bash
   pnpm db:push
   pnpm db:generate
   ```

### 方法3：使用迁移（生产环境推荐）

```bash
# 创建迁移
pnpm db:migrate --name add_subscription

# 这会自动生成 Prisma Client
```

## 验证

运行后，检查是否成功：

```bash
# 应该能看到 ActivationCode 和 User 表的更新
pnpm db:studio
```

或者直接测试创建简历，应该不再报错。

