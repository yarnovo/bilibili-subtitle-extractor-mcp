# Bilibili Subtitle Extractor MCP Tool

> English | [中文](README.md)

## 📖 Project Background

With the growing popularity of AI assistants, users frequently need to extract subtitle content from Bilibili videos for analysis, summarization, or learning. This tool, based on the Model Context Protocol (MCP) standard, provides a simple yet powerful solution that enables AI assistants to directly retrieve subtitle data from Bilibili videos.

## ✨ Features

- 🎯 **Precise Extraction**: Extract complete subtitle content from any Bilibili video
- ⚡ **Real-time Communication**: WebSocket-based browser extension communication architecture
- 🔗 **Timestamp Links**: Support for generating video jump links with timestamps
- 🐋 **Docker Deployment**: Multiple deployment options with one-click service startup
- 🔌 **MCP Standard**: Fully compatible with Model Context Protocol specifications
- 🌐 **Cross-platform**: Chrome/Edge browser extension support
- 📊 **Status Monitoring**: Real-time service status and plugin connection monitoring

## 🚀 Installation and Usage

### Prerequisites
⚠️ **Important Notice**: This tool requires a browser extension and cannot run independently.

**System Requirements:**
- Node.js >= 20.0.0
- Docker & Docker Compose (recommended)
- Chrome/Edge browser
- Valid Bilibili account

**Browser Extension Installation:**

The extension provides two installation methods:

1. **Recommended Method**: Download pre-built version
   - Visit extension release page: [GitHub Releases](https://github.com/yarnovo/bilibili-subtitle/releases)
   - Download the latest version archive
   - Extract and load in Chrome

2. **Local Build Method**:
   ```bash
   # Clone extension project
   git clone https://github.com/yarnovo/bilibili-subtitle.git
   cd bilibili-subtitle
   
   # Install dependencies and build
   npm install
   npm run build
   ```

3. **Load Extension in Browser**:
   - Open extension management page (chrome://extensions/)
   - Enable "Developer mode"
   - Click "Load unpacked extension"
   - Select extracted folder or built `dist` directory

### Option 1: Docker Image Deployment (Recommended)

#### 1. Direct Official Image Run
```bash
# Pull and run official image
docker run -d \
  --name bilibili-subtitle-extractor \
  -p 3456:3456 \
  -p 8080:8080 \
  --restart unless-stopped \
  yarnovo/bilibili-subtitle-extractor-mcp:latest
```

#### 2. Using Docker Compose
Create `docker-compose.yml` file:
```yaml
version: '3.8'
services:
  bilibili-subtitle-extractor:
    image: yarnovo/bilibili-subtitle-extractor-mcp:latest
    container_name: bilibili-subtitle-extractor-mcp
    ports:
      - "3456:3456"  # HTTP MCP interface port
      - "8080:8080"  # WebSocket port
    restart: unless-stopped
```

Start service:
```bash
docker-compose up -d
```

### Option 2: Local Docker Build Deployment

```bash
# Clone project
git clone https://github.com/yarnovo/bilibili-subtitle-extractor-mcp.git
cd bilibili-subtitle-extractor-mcp

# Build and start using Docker Compose
docker-compose up -d --build
```

### Option 3: Local Development Deployment

#### 1. Install Dependencies
```bash
npm install
```

#### 2. Build Project
```bash
npm run build
```

#### 3. Start Service
```bash
npm start
# or run directly
node dist/main/index.js
```

### 🔍 Verify Installation

After service startup, you'll see:
```
🚀 启动Bilibili字幕提取MCP服务器...
🔌 WebSocket服务器: ws://localhost:8080
✅ 服务器启动完成！
📡 HTTP服务器: http://localhost:3456
📋 MCP接口: http://localhost:3456/mcp
📊 状态页面: http://localhost:3456/
```

**Verify Connection:**
1. Visit any Bilibili video page, extension will automatically connect to WebSocket server
2. Open browser developer tools, check Console for connection success messages
3. Visit `http://localhost:3456/` to check service status

### 📋 Service Management

```bash
# Check service status
docker-compose ps

# View logs
docker-compose logs -f

# Stop service
docker-compose down

# Restart service
docker-compose restart
```

## 🛠 Available Tools

### 1. extract_bilibili_subtitles
Extract subtitles from Bilibili videos. **Requires browser extension.**

**Parameters:**
- `video_url` (required): Bilibili video URL (complete link with BV ID)
- `timeout` (optional): Timeout in milliseconds, default 30 seconds

**Example Usage:**
```json
{
  "video_url": "https://www.bilibili.com/video/BV1234567890",
  "timeout": 30000
}
```

**Return Data Format:**
```json
{
  "success": true,
  "data": {
    "title": "Video Title",
    "author": "Uploader Name",
    "url": "Video URL",
    "ctime": timestamp,
    "subtitles": [
      {
        "from": start_time_seconds,
        "to": end_time_seconds,
        "content": "Subtitle content"
      }
    ]
  },
  "renderingNote": "Subtitle rendering suggestions..."
}
```

### 2. get_connection_status
Get connection status with browser extension

**Return Information:**
- `pluginConnected`: Whether plugin is connected
- `pendingRequests`: Number of pending requests
- `message`: Connection status description
- `timestamp`: Status check timestamp

## 📝 Subtitle Rendering Suggestions

The returned subtitle data contains timestamp information. It's recommended to display subtitles with timestamp jump links:

```
[00:15](https://www.bilibili.com/video/BV1234567890?t=15) Hello everyone, welcome to my programming tutorial
[00:18](https://www.bilibili.com/video/BV1234567890?t=18) Today we will learn how to get started with programming
[01:07](https://www.bilibili.com/video/BV1234567890?t=67) Python is a very beginner-friendly language
```

**Format Description:**
- `[MM:SS]`: Formatted timestamp (converted from from field)
- Seconds in link come from from field value (rounded down)
- Users can click timestamp to jump directly to corresponding video time

## ❗ Error Handling

### Common Errors and Solutions

1. **"Browser extension not connected"**
   - Confirm browser extension is installed and enabled
   - Check if extension is working properly on Bilibili pages
   - Visit `http://localhost:3456/` to check connection status
   - Review browser console for connection errors

2. **"Subtitle extraction timeout"**
   - Check network connection
   - Confirm video URL format is correct (contains BV ID)
   - Try increasing timeout parameter value
   - Ensure extension is running properly on Bilibili pages

3. **"Docker service startup failed"**
   - Confirm Docker and Docker Compose are installed
   - Check if ports 3456 and 8080 are occupied
   - View Docker logs: `docker-compose logs -f`

## 🏗 Core Architecture

### Service Architecture
- **HTTP MCP Server**: Provides standard MCP protocol interface (port 3456)
- **WebSocket Server**: Communicates with browser extension (port 8080)
- **Browser Extension**: Executes subtitle extraction on Bilibili pages, pushes results via WebSocket

### WebSocket Communication Protocol

#### Extension → Server (Subtitle Extraction Results)
```json
{
  "type": "SUBTITLE_RESULT",
  "requestId": "uuid",
  "data": {
    "title": "Video Title",
    "author": "Uploader Name",
    "url": "Video URL",
    "ctime": timestamp,
    "subtitles": [...]
  }
}
```

#### Server → Extension (Subtitle Extraction Request)
```json
{
  "type": "GET_SUBTITLE",
  "videoUrl": "https://...",
  "requestId": "uuid"
}
```

### Docker Deployment Architecture
- **Multi-stage Build**: Build stage compiles TypeScript, runtime stage contains only necessary files
- **Port Mapping**: 3456 (HTTP), 8080 (WebSocket)
- **Health Check**: Regular HTTP service availability checks
- **Log Management**: Limits log file size and count

## 🔧 Development and Debugging

### Local Development
```bash
# Install dependencies
npm install

# Build project
npm run build

# Start development mode
npm start

# Run tests
npm test
```

### Docker Development
```bash
# Build image
docker-compose build

# Start service (development mode)
docker-compose up

# View logs
docker-compose logs -f bilibili-subtitle-extractor
```

### Extension Development
Extension source code is in a separate repository:
- Extension repository: https://github.com/yarnovo/bilibili-subtitle
- Build extension: `npm run build`
- Load into browser for testing

### Status Monitoring
- Visit `http://localhost:3456/` to check service status
- Use `get_connection_status` tool to check plugin connection

## 🤝 Contributing

1. Fork the project
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## 📄 License

MIT License - See [LICENSE](LICENSE) file for details 