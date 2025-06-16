# Bilibili Subtitle Extractor MCP Tool

This is a Model Context Protocol (MCP) tool for extracting subtitle content from Bilibili videos. **This tool requires a browser extension to function and cannot run independently.**

## Core Architecture

### WebSocket Connection Architecture
- **Browser Extension**: Runs in background, pushes user authentication data to MCP service via WebSocket
- **MCP Server**: Receives plugin authentication data and provides subtitle extraction service
- **Auto-Reconnect**: Plugin automatically reconnects when connection drops (5-second intervals)
- **Data Sync**: Plugin pushes authentication data every 30 seconds to keep session valid

### Workflow
1. User logs into Bilibili account in browser
2. Install and enable browser extension
3. Extension automatically connects to MCP server (WebSocket port 3456)
4. Extension periodically pushes authentication data to server
5. MCP tool uses stored authentication data to extract subtitles

## Prerequisites

### ⚠️ Important Notice
**This tool does not provide traditional login methods. You must install the browser extension.**

### System Requirements
- Node.js >= 18
- Chrome/Edge browser extension support
- Valid Bilibili account login status

### Extension Installation
1. Build browser extension:
   ```bash
   cd bilibili-subtitle
   npm install
   npm run build
   ```

2. Load extension in Chrome/Edge:
   - Open extension management page
   - Enable "Developer mode"
   - Click "Load unpacked extension"
   - Select `bilibili-subtitle/dist` directory

3. Ensure extension is enabled and running on Bilibili pages

## Installation and Usage

### 1. Install Dependencies
```bash
npm install
```

### 2. Build Project
```bash
npm run build
```

### 3. Start MCP Server
```bash
node dist/bin/index.js
```

After startup, you'll see:
```
Bilibili字幕提取MCP服务器已启动 (WebSocket模式)
WebSocket服务器运行在端口: 3456
请确保安装并启用浏览器插件以建立连接 (Bilibili Subtitle Extractor MCP Server started (WebSocket mode)
WebSocket server running on port: 3456
Please ensure browser extension is installed and enabled)
```

### 4. Verify Extension Connection
Visit any Bilibili video page in your browser, and the extension will automatically attempt to connect to the MCP server.

## Test Simulator

A plugin simulator is provided for testing WebSocket connections:

```bash
# Start simulator
node simulate-plugin.js

# View help
node simulate-plugin.js --help

# Send heartbeat test
node simulate-plugin.js --ping

# Immediate data sync
node simulate-plugin.js --sync
```

## Available Tools

### 1. extract_bilibili_subtitles
Extract subtitles from Bilibili videos

**Parameters:**
- `video_url` (required): Bilibili video URL
- `format` (optional): Output format options:
  - `text`: Plain text format (default)
  - `srt`: SRT subtitle file format
  - `vtt`: WebVTT subtitle file format
  - `json`: JSON format

**Example Usage:**
```json
{
  "video_url": "https://www.bilibili.com/video/BV1example",
  "format": "srt"
}
```

### 2. get_auth_status
Get plugin authentication status

**Return Information:**
- `hasAuth`: Whether valid authentication data exists
- `isLoggedIn`: Whether user is logged into Bilibili
- `username`: Username (if available)
- `lastUpdate`: Last update time
- `wsConnections`: WebSocket connection count
- `message`: Status description

## Output Format Examples

### Text Format
```
Video Title
Author: Uploader Name
BV ID: BV1example

Subtitle content line 1
Subtitle content line 2
...
```

### SRT Format
```
1
00:00:01,000 --> 00:00:03,000
Subtitle content line 1

2
00:00:03,000 --> 00:00:05,000
Subtitle content line 2
```

### JSON Format
```json
{
  "title": "Video Title",
  "author": "Uploader Name", 
  "bvid": "BV1example",
  "subtitleLanguage": "Chinese",
  "subtitleCount": 100,
  "format": "json",
  "content": "{\"videoInfo\":{...},\"subtitles\":[...]}"
}
```

## Error Handling

### Common Errors and Solutions

1. **"Plugin authentication data not detected"**
   - Confirm browser extension is installed and enabled
   - Check if extension is working properly on Bilibili pages
   - Review browser console for connection errors

2. **"User not logged into Bilibili"**
   - Log into Bilibili account in browser
   - Refresh Bilibili page to let extension re-detect login status

3. **"WebSocket connection failed"**
   - Confirm MCP server is running
   - Check if port 3456 is occupied
   - Review firewall settings

## Technical Architecture

### WebSocket Communication Protocol

#### Client → Server
```json
{
  "type": "auth_data",
  "data": {
    "cookies": [...],
    "userAgent": "...",
    "userInfo": { "uid": 123, "uname": "User" },
    "isLoggedIn": true,
    "currentUrl": "...",
    "timestamp": 1234567890
  }
}
```

#### Server → Client
```json
{
  "type": "connected",
  "message": "Connection successful"
}
```

### Authentication Data Expiration Mechanism
- Authentication data validity: 5 minutes
- Plugin push interval: 30 seconds
- Reconnection interval: 5 seconds

## Development and Debugging

### Enable Debug Mode
```bash
DEBUG=bilibili-subtitle node dist/bin/index.js
```

### Extension Development
Extension source code is located in the `bilibili-subtitle/` directory, main files:
- `src/chrome/background.ts`: Extension background script
- `src/chrome/authService.ts`: Authentication service WebSocket client

### Testing
```bash
npm test
```

## Contributing

1. Fork the project
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

MIT License - See [LICENSE](LICENSE) file for details 