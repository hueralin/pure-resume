# 使用 Node.js 20 轻量版 (slim) 作为基础镜像，体积小且包含基本的 Node 环境
FROM node:20-slim AS base

# -----------------------------------------------------------------------------
# 1. 系统依赖安装 (Puppeteer/Chrome 专用)
# -----------------------------------------------------------------------------
# 环境变量配置：
# PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true: 禁止 Puppeteer 自动下载 Chromium (体积大且缺依赖)
# PUPPETEER_EXECUTABLE_PATH: 告诉 Puppeteer 使用我们手动安装的 Chrome
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/google-chrome-stable

# 安装 Chrome 及其运行所需的系统库、中文字体
# fonts-wqy-zenhei 等字体包至关重要，否则生成的 PDF 中文会乱码
RUN apt-get update && apt-get install -y \
    wget \
    gnupg \
    && wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | apt-key add - \
    && sh -c 'echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google.list' \
    && apt-get update \
    && apt-get install -y google-chrome-stable fonts-ipafont-gothic fonts-wqy-zenhei fonts-thai-tlwg fonts-kacst fonts-freefont-ttf libxss1 \
      --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

# 设置容器内工作目录
WORKDIR /app

# -----------------------------------------------------------------------------
# 2. 项目依赖安装
# -----------------------------------------------------------------------------
# 先只复制依赖描述文件，利用 Docker 缓存机制加速构建
COPY package.json pnpm-lock.yaml* ./

# 安装 pnpm 并安装项目依赖 (frozen-lockfile 保证依赖版本与 lock 文件严格一致)
RUN npm install -g pnpm && pnpm i --frozen-lockfile

# -----------------------------------------------------------------------------
# 3. 代码构建
# -----------------------------------------------------------------------------
# 复制项目所有源代码
COPY . .

# 生成 Prisma Client (数据库客户端代码)
RUN pnpm dlx prisma generate

# 构建 Next.js 生产版本 (.next 目录)
RUN pnpm build

# -----------------------------------------------------------------------------
# 4. 启动配置
# -----------------------------------------------------------------------------
# 设置默认端口变量 (Next.js 会自动读取名为 PORT 的环境变量)
ENV PORT=3000

# 声明容器打算开放的端口 (仅用于文档说明，实际映射由 docker-compose 控制)
EXPOSE $PORT

# 默认启动命令 (会被 docker-compose.yml 中的 command 覆盖，但在单用 Docker 时生效)
CMD ["pnpm", "start"]
