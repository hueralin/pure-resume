# 简历制作工具

一个基于 Next.js 的简历制作工具，支持拖拽式表单编辑、实时预览、模板切换和 PDF 导出。

## 技术栈

- Next.js 16+ (App Router)
- TypeScript
- Tailwind CSS
- shadcn/ui
- Prisma + PostgreSQL
- JWT 认证
- Puppeteer (PDF 导出)
- Zustand (状态管理)
- react-hook-form + zod (表单处理)
- @dnd-kit (拖拽功能)

## 开始使用

### 1. 安装依赖

```bash
pnpm install
```

### 2. 设置环境变量

复制 `.env.example` 为 `.env` 并填写配置：

```bash
cp .env.example .env
```

编辑 `.env` 文件，设置数据库连接和 JWT 密钥：

```env
DATABASE_URL="postgresql://user:password@localhost:5432/resume_db"
JWT_SECRET="your-secret-key-change-in-production"
```

### 3. 初始化数据库

```bash
# 生成 Prisma Client
pnpm db:generate

# 推送数据库 schema（开发环境）
pnpm db:push

# 或使用迁移（生产环境推荐）
pnpm db:migrate
```

### 4. 启动开发服务器

```bash
pnpm dev
```

打开 [http://localhost:8000](http://localhost:8000) 查看应用。

## 功能特性

- ✅ 用户注册/登录（邮箱 + JWT）
- ✅ 拖拽式模块编辑
- ✅ 实时预览（防抖）
- ✅ 动态表单生成（基于模块配置）
- ✅ 简历数据持久化
- ✅ PDF 导出
- ✅ 模块化设计，易于扩展

## 项目结构

```
resume/
├── app/                    # Next.js App Router
│   ├── (auth)/            # 认证相关页面
│   ├── (dashboard)/       # 仪表板（简历列表和编辑）
│   ├── api/               # API 路由
│   └── layout.tsx
├── components/             # React 组件
│   ├── resume/            # 简历相关组件
│   ├── forms/             # 表单组件
│   └── ui/                # shadcn 组件
├── config/
│   └── modules/           # 模块配置文件
├── templates/             # 简历模板
│   └── default/
├── lib/                   # 工具函数
│   ├── auth.ts            # JWT 认证
│   ├── db.ts              # Prisma 客户端
│   ├── modules.ts          # 模块管理
│   └── store.ts            # Zustand 状态管理
├── prisma/                # 数据库 schema
└── types/                 # TypeScript 类型定义
```

## 开发指南

### 添加新模块

1. 在 `config/modules/` 目录创建新的 JSON 配置文件
2. 在 `lib/modules.ts` 中导入并注册新模块
3. 模块会自动出现在编辑器中

### 添加新模板

1. 在 `templates/` 目录创建新模板目录
2. 实现模板组件（接收 `ResumeData` 作为 props）
3. 更新模板配置系统

## 许可证

MIT
