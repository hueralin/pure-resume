#!/bin/bash

# 订阅系统迁移脚本
# 从备份恢复并迁移数据到新的 Subscription 表结构
# 
# 使用方法：
# bash scripts/migrate-from-backup.sh
# 或
# chmod +x scripts/migrate-from-backup.sh && ./scripts/migrate-from-backup.sh

set -e  # 遇到错误立即退出

# 配置
DB_NAME="resume_db"
BACKUP_FILE="resume_db_20251204150748cvsc8.sql"
BACKUP_FILE_GZ="${BACKUP_FILE}.gz"
PG_USER="${PGUSER:-resume}"  # 默认使用 postgres 用户，可以通过环境变量覆盖
PG_HOST="${PGHOST:-47.94.254.12}"
PG_PORT="${PGPORT:-5432}"

echo "=========================================="
echo "订阅系统迁移脚本"
echo "=========================================="
echo "数据库: $DB_NAME"
echo "备份文件: $BACKUP_FILE"
echo "PostgreSQL 用户: $PG_USER"
echo "=========================================="
echo ""

# 读取密码（如果环境变量中没有）
if [ -z "$PGPASSWORD" ]; then
    echo -n "请输入 PostgreSQL 密码: "
    read -s PGPASSWORD
    echo ""
    export PGPASSWORD
fi

# 检查备份文件是否存在
if [ -f "$BACKUP_FILE_GZ" ]; then
    echo "✓ 找到压缩备份文件: $BACKUP_FILE_GZ"
    echo "正在解压..."
    # 如果已存在解压文件，先删除再解压
    if [ -f "$BACKUP_FILE" ]; then
        echo "  删除已存在的解压文件..."
        rm -f "$BACKUP_FILE"
    fi
    gunzip -k "$BACKUP_FILE_GZ" || {
        echo "✗ 解压失败，尝试使用已解压的文件..."
    }
elif [ ! -f "$BACKUP_FILE" ]; then
    echo "✗ 错误: 找不到备份文件 $BACKUP_FILE 或 $BACKUP_FILE_GZ"
    exit 1
fi

echo "✓ 备份文件准备就绪: $BACKUP_FILE"
echo ""

# 步骤 1: 恢复备份
echo "步骤 1/5: 恢复数据库备份..."
echo "  正在断开所有数据库连接..."

# 先终止所有连接到目标数据库的会话
PGPASSWORD="$PGPASSWORD" psql -h "$PG_HOST" -p "$PG_PORT" -U "$PG_USER" -d postgres <<EOF 2>/dev/null || true
SELECT pg_terminate_backend(pid)
FROM pg_stat_activity
WHERE datname = '${DB_NAME}' AND pid <> pg_backend_pid();
EOF

# 等待一下确保连接已断开
sleep 1

echo "  正在删除旧数据库..."
# 删除数据库（忽略错误）
PGPASSWORD="$PGPASSWORD" psql -h "$PG_HOST" -p "$PG_PORT" -U "$PG_USER" -d postgres -c "DROP DATABASE IF EXISTS ${DB_NAME};" 2>/dev/null || true

echo "  正在创建新数据库..."
PGPASSWORD="$PGPASSWORD" psql -h "$PG_HOST" -p "$PG_PORT" -U "$PG_USER" -d postgres -c "CREATE DATABASE ${DB_NAME};"

echo "  正在恢复备份数据..."
# 检测备份文件格式并选择相应的恢复方式
# PostgreSQL 自定义格式通常可以用 pg_restore 恢复
# 如果是纯 SQL 格式，则使用 psql -f
set +e  # 临时禁用错误退出，以便尝试两种恢复方式
PGPASSWORD="$PGPASSWORD" pg_restore -h "$PG_HOST" -p "$PG_PORT" -U "$PG_USER" -d "$DB_NAME" "$BACKUP_FILE" 2>/dev/null
RESTORE_RESULT=$?
set -e  # 重新启用错误退出

if [ $RESTORE_RESULT -eq 0 ]; then
    echo "  使用 pg_restore 恢复（自定义格式）"
else
    echo "  尝试使用 psql 恢复（SQL 格式）..."
    PGPASSWORD="$PGPASSWORD" psql -h "$PG_HOST" -p "$PG_PORT" -U "$PG_USER" -d "$DB_NAME" -f "$BACKUP_FILE"
fi

echo "✓ 数据库备份已恢复"
echo ""

# 步骤 2: 备份激活记录
echo "步骤 2/5: 备份现有激活记录..."
PGPASSWORD="$PGPASSWORD" psql -h "$PG_HOST" -p "$PG_PORT" -U "$PG_USER" -d "$DB_NAME" <<EOF
-- 备份激活记录到临时表
DROP TABLE IF EXISTS "ActivationCode_backup";
CREATE TABLE "ActivationCode_backup" AS
SELECT 
  "id",
  "code",
  "userId",
  "activatedAt",
  "createdAt"
FROM "ActivationCode"
WHERE "userId" IS NOT NULL AND "activatedAt" IS NOT NULL;

-- 显示备份的记录数量
SELECT COUNT(*) as backup_count FROM "ActivationCode_backup";
EOF
echo "✓ 激活记录已备份"
echo ""

# 步骤 3: 运行 Prisma 迁移
echo "步骤 3/5: 运行 Prisma 数据库迁移..."
echo "正在生成 Prisma Client..."

# 尝试生成 Prisma Client，如果失败（通常是文件被占用），给出提示
set +e  # 临时禁用错误退出
pnpm db:generate 2>&1
GENERATE_RESULT=$?
set -e  # 重新启用错误退出

if [ $GENERATE_RESULT -ne 0 ]; then
    echo ""
    echo "⚠ 警告: Prisma Client 生成失败"
    echo ""
    echo "   常见原因："
    echo "   1. 文件被其他进程占用（如开发服务器、IDE）"
    echo "   2. 防病毒软件阻止了文件操作"
    echo ""
    echo "   解决方案："
    echo "   1. 关闭所有可能占用文件的进程（开发服务器、IDE 等）"
    echo "   2. 手动运行: pnpm db:generate"
    echo "   3. 如果 Prisma Client 已存在，可以跳过此步骤"
    echo ""
    read -p "是否继续执行数据库迁移？(y/n) " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "迁移已取消"
        exit 1
    fi
else
    echo "  ✓ Prisma Client 生成成功"
fi

echo "正在推送数据库变更..."
if ! pnpm db:push; then
    echo "✗ 错误: 数据库迁移失败"
    exit 1
fi

echo "✓ 数据库结构已更新"
echo ""

# 步骤 4: 迁移数据到 Subscription 表
echo "步骤 4/5: 迁移数据到 Subscription 表..."
PGPASSWORD="$PGPASSWORD" psql -h "$PG_HOST" -p "$PG_PORT" -U "$PG_USER" -d "$DB_NAME" <<EOF
-- 将备份的激活记录迁移到 Subscription 表
INSERT INTO "Subscription" ("id", "userId", "activationCodeId", "startAt", "expiresAt", "status", "createdAt")
SELECT 
  gen_random_uuid()::text as id,
  "userId",
  "id" as "activationCodeId",
  "activatedAt" as "startAt",
  ("activatedAt" + INTERVAL '3 months') as "expiresAt",
  CASE 
    WHEN ("activatedAt" + INTERVAL '3 months') > NOW() THEN 'active'
    ELSE 'expired'
  END as status,
  "activatedAt" as "createdAt"
FROM "ActivationCode_backup"
ON CONFLICT ("activationCodeId") DO NOTHING;

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

-- 显示迁移结果
SELECT COUNT(*) as subscription_count FROM "Subscription";
EOF
echo "✓ 数据已迁移到 Subscription 表"
echo ""

# 步骤 5: 清理临时表
echo "步骤 5/5: 清理临时表..."
PGPASSWORD="$PGPASSWORD" psql -h "$PG_HOST" -p "$PG_PORT" -U "$PG_USER" -d "$DB_NAME" -c 'DROP TABLE IF EXISTS "ActivationCode_backup";'
echo "✓ 临时表已清理"
echo ""

echo "✓ Subscription 表迁移完成"
echo ""

# 步骤 6: 字段迁移 subscriptionStatus -> banned
echo "步骤 6/6: 字段迁移（subscriptionStatus -> banned）..."
echo "  检查字段状态..."

SUBSCRIPTION_STATUS_EXISTS=$(PGPASSWORD="$PGPASSWORD" psql -h "$PG_HOST" -p "$PG_PORT" -U "$PG_USER" -d "$DB_NAME" -t -c "
SELECT COUNT(*) 
FROM information_schema.columns 
WHERE table_name = 'User' AND column_name = 'subscriptionStatus';
" | tr -d ' ')

BANNED_EXISTS=$(PGPASSWORD="$PGPASSWORD" psql -h "$PG_HOST" -p "$PG_PORT" -U "$PG_USER" -d "$DB_NAME" -t -c "
SELECT COUNT(*) 
FROM information_schema.columns 
WHERE table_name = 'User' AND column_name = 'banned';
" | tr -d ' ')

if [ "$SUBSCRIPTION_STATUS_EXISTS" = "1" ]; then
    echo "  发现 subscriptionStatus 字段，开始迁移..."
    
    # 添加 banned 字段（如果不存在）
    if [ "$BANNED_EXISTS" = "0" ]; then
        PGPASSWORD="$PGPASSWORD" psql -h "$PG_HOST" -p "$PG_PORT" -U "$PG_USER" -d "$DB_NAME" <<EOF
ALTER TABLE "User" ADD COLUMN "banned" BOOLEAN NOT NULL DEFAULT false;
EOF
        echo "  ✓ banned 字段已添加"
    fi
    
    # 迁移数据并删除旧字段
    PGPASSWORD="$PGPASSWORD" psql -h "$PG_HOST" -p "$PG_PORT" -U "$PG_USER" -d "$DB_NAME" <<EOF
-- 将 subscriptionStatus = 0 转换为 banned = true
-- 将 subscriptionStatus = 1 转换为 banned = false
UPDATE "User" 
SET "banned" = CASE WHEN "subscriptionStatus" = 0 THEN true ELSE false END
WHERE "subscriptionStatus" IS NOT NULL;

-- 删除旧的 subscriptionStatus 字段
ALTER TABLE "User" DROP COLUMN "subscriptionStatus";
EOF
    echo "  ✓ 数据已迁移，subscriptionStatus 字段已删除"
elif [ "$BANNED_EXISTS" = "1" ]; then
    echo "  ✓ banned 字段已存在，跳过迁移"
else
    echo "  ⚠ 警告: 既没有 subscriptionStatus 也没有 banned 字段"
fi

echo ""
echo "=========================================="
echo "✓ 所有迁移完成！"
echo "=========================================="
echo ""
echo "验证迁移结果："
PGPASSWORD="$PGPASSWORD" psql -h "$PG_HOST" -p "$PG_PORT" -U "$PG_USER" -d "$DB_NAME" <<EOF
SELECT 
  (SELECT COUNT(*) FROM "Subscription") as subscription_count,
  (SELECT COUNT(*) FROM "User" WHERE "subscriptionExpiresAt" IS NOT NULL) as users_with_subscription,
  (SELECT COUNT(*) FROM "User" WHERE "banned" = true) as banned_users,
  (SELECT COUNT(*) FROM "User" WHERE "banned" = false) as active_users;
EOF

echo ""
echo "下一步：运行 'npx prisma generate' 重新生成 Prisma Client"
echo ""


