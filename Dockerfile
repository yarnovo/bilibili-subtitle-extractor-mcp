# 第一阶段：构建
FROM node:20-alpine AS builder

WORKDIR /app

# 复制package文件
COPY package*.json ./

# 安装依赖
RUN npm ci

# 复制源代码
COPY . .

# 构建项目
RUN npm run build

# 第二阶段：运行
FROM node:20-alpine AS runner

WORKDIR /app

# 复制package文件
COPY package*.json ./

# 只安装生产依赖
RUN npm ci --only=production && npm cache clean --force

# 从构建阶段复制构建结果
COPY --from=builder /app/dist ./dist

# 创建非root用户
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001

# 更改文件所有权
RUN chown -R nodejs:nodejs /app
USER nodejs

# 暴露端口
EXPOSE 3456 8080

# 设置环境变量
ENV NODE_ENV=production

# 启动应用
CMD ["node", "dist/main/index.js"] 