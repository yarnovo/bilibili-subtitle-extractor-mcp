# Bilibili字幕提取MCP工具

这是一个Model Context Protocol (MCP)工具，用于从Bilibili视频中提取字幕内容。**本工具需要配合浏览器插件使用，无法独立运行。**

## 核心架构

### WebSocket连接架构
- **浏览器插件**: 在后台运行，通过WebSocket连接向MCP服务推送用户认证数据
- **MCP服务器**: 接收插件认证数据，提供字幕提取服务
- **自动重连**: 插件连接断开时自动重连（5秒间隔）
- **数据同步**: 插件每30秒推送一次认证数据保持会话有效

### 工作流程
1. 用户在浏览器中登录B站账号
2. 安装并启用浏览器插件
3. 插件自动连接MCP服务器(WebSocket端口3456)
4. 插件定期推送认证数据到服务器
5. MCP工具使用存储的认证数据提取字幕

## 必要条件

### ⚠️ 重要说明
**本工具不提供传统登录方式，必须安装浏览器插件才能使用。**

### 系统要求
- Node.js >= 18
- 支持Chrome/Edge的浏览器插件
- 有效的Bilibili账号登录状态

### 插件安装
1. 构建浏览器插件：
   ```bash
   cd bilibili-subtitle
   npm install
   npm run build
   ```

2. 在Chrome/Edge中加载插件：
   - 打开扩展程序管理页面
   - 启用"开发者模式"
   - 点击"加载已解压的扩展程序"
   - 选择 `bilibili-subtitle/dist` 目录

3. 确保插件已启用并在B站页面运行

## 安装和使用

### 1. 安装依赖
```bash
npm install
```

### 2. 构建项目
```bash
npm run build
```

### 3. 启动MCP服务器
```bash
node dist/bin/index.js
```

启动后会看到：
```
Bilibili字幕提取MCP服务器已启动 (WebSocket模式)
WebSocket服务器运行在端口: 3456
请确保安装并启用浏览器插件以建立连接
```

### 4. 验证插件连接
在浏览器中访问任意B站视频页面，插件会自动尝试连接MCP服务器。

## 测试模拟器

为了测试WebSocket连接，提供了插件模拟器：

```bash
# 启动模拟器
node simulate-plugin.js

# 查看帮助
node simulate-plugin.js --help

# 发送心跳测试
node simulate-plugin.js --ping

# 立即同步数据
node simulate-plugin.js --sync
```

## 可用工具

### 1. extract_bilibili_subtitles
从Bilibili视频中提取字幕

**参数：**
- `video_url` (必需): Bilibili视频URL
- `format` (可选): 输出格式，可选值：
  - `text`: 纯文本格式 (默认)
  - `srt`: SRT字幕文件格式
  - `vtt`: WebVTT字幕文件格式
  - `json`: JSON格式

**示例使用：**
```json
{
  "video_url": "https://www.bilibili.com/video/BV1example",
  "format": "srt"
}
```

### 2. get_auth_status
获取插件认证状态

**返回信息：**
- `hasAuth`: 是否有有效认证数据
- `isLoggedIn`: 用户是否已登录B站
- `username`: 用户名（如有）
- `lastUpdate`: 最后更新时间
- `wsConnections`: WebSocket连接数
- `message`: 状态说明

## 输出格式示例

### Text格式
```
视频标题
作者: UP主名称
BV号: BV1example

字幕内容第一行
字幕内容第二行
...
```

### SRT格式
```
1
00:00:01,000 --> 00:00:03,000
字幕内容第一行

2
00:00:03,000 --> 00:00:05,000
字幕内容第二行
```

### JSON格式
```json
{
  "title": "视频标题",
  "author": "UP主名称", 
  "bvid": "BV1example",
  "subtitleLanguage": "中文",
  "subtitleCount": 100,
  "format": "json",
  "content": "{\"videoInfo\":{...},\"subtitles\":[...]}"
}
```

## 错误处理

### 常见错误及解决方案

1. **"未检测到插件认证数据"**
   - 确认浏览器插件已安装并启用
   - 检查插件是否在B站页面正常工作
   - 查看浏览器控制台是否有连接错误

2. **"用户未登录B站"**
   - 在浏览器中登录B站账号
   - 刷新B站页面让插件重新检测登录状态

3. **"WebSocket连接失败"**
   - 确认MCP服务器已启动
   - 检查端口3456是否被占用
   - 查看防火墙设置

## 技术架构

### WebSocket通信协议

#### 客户端 → 服务器
```json
{
  "type": "auth_data",
  "data": {
    "cookies": [...],
    "userAgent": "...",
    "userInfo": { "uid": 123, "uname": "用户" },
    "isLoggedIn": true,
    "currentUrl": "...",
    "timestamp": 1234567890
  }
}
```

#### 服务器 → 客户端
```json
{
  "type": "connected",
  "message": "连接成功"
}
```

### 认证数据过期机制
- 认证数据有效期：5分钟
- 插件推送间隔：30秒
- 重连间隔：5秒

## 开发调试

### 启用调试模式
```bash
DEBUG=bilibili-subtitle node dist/bin/index.js
```

### 插件开发
插件源码位于 `bilibili-subtitle/` 目录，主要文件：
- `src/chrome/background.ts`: 插件后台脚本
- `src/chrome/authService.ts`: 认证服务WebSocket客户端

### 测试
```bash
npm test
```

## 贡献指南

1. Fork项目
2. 创建功能分支
3. 提交代码更改
4. 推送到分支
5. 创建Pull Request

## 许可证

MIT License - 详见 [LICENSE](LICENSE) 文件 