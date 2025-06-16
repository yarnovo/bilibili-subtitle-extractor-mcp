# Bilibili字幕提取MCP工具

## 📖 项目背景

随着AI助手的普及，用户经常需要从Bilibili视频中提取字幕内容进行分析、总结或学习。本工具基于Model Context Protocol (MCP)标准，提供了一个简单而强大的解决方案，让AI助手能够直接获取B站视频的字幕数据。

## ✨ 功能特性

- 🎯 **精准提取**: 从任意Bilibili视频中提取完整字幕内容
- ⚡ **实时通信**: 基于WebSocket的浏览器插件通信架构
- 🔗 **时间戳链接**: 支持生成带时间戳的视频跳转链接
- 🐋 **Docker部署**: 支持多种部署方式，一键启动服务
- 🔌 **MCP标准**: 完全兼容Model Context Protocol规范
- 🌐 **跨平台**: 支持Chrome/Edge浏览器扩展
- 📊 **状态监控**: 实时查看服务状态和插件连接情况

## 🚀 安装和使用

### 必要条件
⚠️ **重要说明**: 本工具需要配合浏览器插件使用，无法独立运行。

**系统要求:**
- Node.js >= 20.0.0
- Docker & Docker Compose (推荐)
- Chrome/Edge浏览器
- 有效的Bilibili账号

**浏览器插件安装:**

插件提供两种安装方式：

1. **推荐方式**: 直接下载已构建版本
   - 访问插件发布页面: [GitHub Releases](https://github.com/yarnovo/bilibili-subtitle-extractor-extension/releases)
   - 下载最新版本的压缩包
   - 解压后在Chrome中加载扩展程序

2. **本地构建方式**:
   ```bash
   # 克隆插件项目
   git clone https://github.com/yarnovo/bilibili-subtitle-extractor-extension.git
   cd bilibili-subtitle-extractor-extension
   
   # 安装依赖并构建
   npm install
   npm run build
   ```

3. **在浏览器中加载插件**:
   - 打开扩展程序管理页面 (chrome://extensions/)
   - 启用"开发者模式"
   - 点击"加载已解压的扩展程序"
   - 选择解压后的文件夹或构建后的`dist`目录

### 方式一：Docker镜像部署（推荐）

#### 1. 直接运行官方镜像
```bash
# 拉取并运行官方镜像
docker run -d \
  --name bilibili-subtitle-extractor \
  -p 3456:3456 \
  -p 8080:8080 \
  --restart unless-stopped \
  yarnovo/bilibili-subtitle-extractor-mcp:latest
```

#### 2. 使用Docker Compose
创建 `docker-compose.yml` 文件：
```yaml
version: '3.8'
services:
  bilibili-subtitle-extractor:
    image: yarnovo/bilibili-subtitle-extractor-mcp:latest
    container_name: bilibili-subtitle-extractor-mcp
    ports:
      - "3456:3456"  # HTTP MCP接口端口
      - "8080:8080"  # WebSocket端口
    restart: unless-stopped
```

启动服务：
```bash
docker-compose up -d
```

### 方式二：本地Docker构建部署

```bash
# 克隆项目
git clone https://github.com/yarnovo/bilibili-subtitle-extractor-mcp.git
cd bilibili-subtitle-extractor-mcp

# 使用Docker Compose构建并启动
docker-compose up -d --build
```

### 方式三：本地开发部署

#### 1. 安装依赖
```bash
npm install
```

#### 2. 构建项目
```bash
npm run build
```

#### 3. 启动服务
```bash
npm start
# 或直接运行
node dist/main/index.js
```

### 🔍 验证安装

服务启动后，你将看到：
```
🚀 启动Bilibili字幕提取MCP服务器...
🔌 WebSocket服务器: ws://localhost:8080
✅ 服务器启动完成！
📡 HTTP服务器: http://localhost:3456
📋 MCP接口: http://localhost:3456/mcp
📊 状态页面: http://localhost:3456/
```

**验证连接:**
1. 访问任意B站视频页面，插件会自动连接到WebSocket服务器
2. 打开浏览器开发者工具，查看Console是否有连接成功的消息
3. 访问 `http://localhost:3456/` 查看服务状态

### 📋 服务管理

```bash
# 查看服务状态
docker-compose ps

# 查看日志
docker-compose logs -f

# 停止服务
docker-compose down

# 重启服务
docker-compose restart
```

## 🛠 可用工具

### 1. extract_bilibili_subtitles
从Bilibili视频中提取字幕。**需要浏览器插件配合使用。**

**参数：**
- `video_url` (必需): Bilibili视频URL（完整链接，包含BV号）
- `timeout` (可选): 超时时间（毫秒），默认30秒

**示例使用：**
```json
{
  "video_url": "https://www.bilibili.com/video/BV1234567890",
  "timeout": 30000
}
```

**返回数据格式：**
```json
{
  "success": true,
  "data": {
    "title": "视频标题",
    "author": "UP主名称",
    "url": "视频URL",
    "ctime": 创建时间戳,
    "subtitles": [
      {
        "from": 开始时间(秒),
        "to": 结束时间(秒),
        "content": "字幕内容"
      }
    ]
  },
  "renderingNote": "字幕渲染建议..."
}
```

### 2. get_connection_status
获取与浏览器插件的连接状态

**返回信息：**
- `pluginConnected`: 插件是否已连接
- `pendingRequests`: 待处理请求数量
- `message`: 连接状态说明
- `timestamp`: 状态检查时间

## 📝 字幕渲染建议

工具返回的字幕数据包含时间戳信息，建议为用户展示带时间戳跳转链接的格式：

```
[00:15](https://www.bilibili.com/video/BV1234567890?t=15) 大家好，欢迎来到我的编程教程
[00:18](https://www.bilibili.com/video/BV1234567890?t=18) 今天我们要学习如何入门编程
[01:07](https://www.bilibili.com/video/BV1234567890?t=67) Python是一个非常适合初学者的语言
```

**格式说明：**
- `[MM:SS]`: 格式化的时间戳（根据from字段转换）
- 链接中的秒数来自from字段的值（向下取整）
- 用户点击时间戳可直接跳转到视频对应时间点

## ❗ 错误处理

### 常见错误及解决方案

1. **"浏览器插件未连接"**
   - 确认浏览器插件已安装并启用
   - 检查插件是否在B站页面正常工作
   - 访问 `http://localhost:3456/` 查看连接状态
   - 查看浏览器控制台是否有连接错误

2. **"字幕提取超时"**
   - 检查网络连接是否正常
   - 确认视频URL格式正确（包含BV号）
   - 尝试增加timeout参数值
   - 确认插件在B站页面正常运行

3. **"Docker服务启动失败"**
   - 确认Docker和Docker Compose已安装
   - 检查端口3456和8080是否被占用
   - 查看Docker日志：`docker-compose logs -f`

## 🏗 核心架构

### 服务架构
- **HTTP MCP服务器**: 提供标准MCP协议接口 (端口3456)
- **WebSocket服务器**: 与浏览器插件通信 (端口8080)
- **浏览器插件**: 在B站页面执行字幕提取，通过WebSocket推送结果

### WebSocket通信协议

#### 插件 → 服务器 (字幕提取结果)
```json
{
  "type": "SUBTITLE_RESULT",
  "requestId": "uuid",
  "data": {
    "title": "视频标题",
    "author": "UP主名称",
    "url": "视频URL",
    "ctime": 时间戳,
    "subtitles": [...]
  }
}
```

#### 服务器 → 插件 (字幕提取请求)
```json
{
  "type": "GET_SUBTITLE",
  "videoUrl": "https://...",
  "requestId": "uuid"
}
```

### Docker部署架构
- **多阶段构建**: 构建阶段编译TypeScript，运行阶段仅包含必要文件
- **端口映射**: 3456 (HTTP)、8080 (WebSocket)
- **健康检查**: 定期检查HTTP服务可用性
- **日志管理**: 限制日志文件大小和数量

## 🔧 开发调试

### 本地开发
```bash
# 安装依赖
npm install

# 构建项目
npm run build

# 启动开发模式
npm start

# 运行测试
npm test
```

### Docker开发
```bash
# 构建镜像
docker-compose build

# 启动服务（开发模式）
docker-compose up

# 查看日志
docker-compose logs -f bilibili-subtitle-extractor
```

### 插件开发
插件源码位于独立仓库：
- 插件仓库：https://github.com/yarnovo/bilibili-subtitle-extractor-extension
- 构建插件：`npm run build`
- 加载到浏览器进行测试

### 状态监控
- 访问 `http://localhost:3456/` 查看服务状态
- 使用 `get_connection_status` 工具检查插件连接

## 🤝 贡献指南

1. Fork项目
2. 创建功能分支
3. 提交代码更改
4. 推送到分支
5. 创建Pull Request

## 📄 许可证

MIT License - 详见 [LICENSE](LICENSE) 文件 