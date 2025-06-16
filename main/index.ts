#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { z } from "zod";
import express, { Request, Response } from 'express';
import { WebSocketServer, WebSocket } from 'ws';
import mitt, { Emitter } from 'mitt';
import { v4 as uuidv4 } from 'uuid';

// 类型定义
interface SubtitleRequest {
  type: 'GET_SUBTITLE'
  videoUrl: string
  requestId: string
}

interface SubtitleResponse {
  type: 'SUBTITLE_RESULT'
  requestId: string
  data?: {
    title: string
    author: string
    url: string
    ctime: number
    subtitles: TranscriptItem[]
  }
  error?: string
}

interface TranscriptItem {
  from: number
  to: number
  content: string
}

interface EventMap extends Record<string | symbol, unknown> {
  'subtitle-request': { requestId: string; videoUrl: string }
  'subtitle-response': SubtitleResponse
  'plugin-connected': void
  'plugin-disconnected': void
}

// 全局事件中心
const eventBus: Emitter<EventMap> = mitt<EventMap>();

// WebSocket服务器管理
class WebSocketManager {
  private wss: WebSocketServer | null = null;
  private pluginSocket: WebSocket | null = null;
  private port: number;

  constructor(port: number = 8080) {
    this.port = port;
  }

  start(): void {
    this.wss = new WebSocketServer({ port: this.port });
    
    console.log(`🚀 WebSocket服务器启动成功，监听端口: ${this.port}`);
    console.log('📋 等待Chrome扩展连接...');

    this.wss.on('connection', (ws, req) => {
      console.log(`🔌 新的插件连接尝试: ${req.socket.remoteAddress}`);
      
      // 检查是否已经有活跃的连接
      if (this.pluginSocket && this.pluginSocket.readyState === WebSocket.OPEN) {
        console.log('⚠️ 已有活跃连接，拒绝新连接');
        ws.close(1008, '服务器已有活跃连接，请稍后重试');
        return;
      }

      // 如果有旧的连接但已经断开，清理它
      if (this.pluginSocket && this.pluginSocket.readyState !== WebSocket.OPEN) {
        console.log('🧹 清理旧的无效连接');
        this.pluginSocket = null;
      }

      console.log(`✅ 插件连接建立: ${req.socket.remoteAddress}`);
      this.pluginSocket = ws;
      eventBus.emit('plugin-connected');

      // 发送欢迎消息
      this.sendMessage({
        type: 'WELCOME' as any,
        message: '🎉 MCP服务器连接成功！'
      });

      ws.on('message', (data) => {
        this.handleMessage(data.toString());
      });

      ws.on('close', () => {
        console.log('📤 插件连接已关闭');
        this.pluginSocket = null;
        eventBus.emit('plugin-disconnected');
      });

      ws.on('error', (error) => {
        console.error('❌ WebSocket错误:', error.message);
        this.pluginSocket = null;
        eventBus.emit('plugin-disconnected');
      });
    });

    // 监听字幕请求事件
    eventBus.on('subtitle-request', ({ requestId, videoUrl }) => {
      this.requestSubtitle(requestId, videoUrl);
    });
  }

  private handleMessage(data: string): void {
    try {
      const message: SubtitleResponse = JSON.parse(data);
      console.log('📨 收到插件消息:', message.type);
    
      if (message.type === 'SUBTITLE_RESULT') {
        eventBus.emit('subtitle-response', message);
      }
    } catch (error) {
      console.error('❌ 消息解析失败:', error);
        }
  }

  private requestSubtitle(requestId: string, videoUrl: string): void {
    if (!this.pluginSocket || this.pluginSocket.readyState !== WebSocket.OPEN) {
      console.error('❌ 插件未连接，无法发送字幕请求');
      eventBus.emit('subtitle-response', {
        type: 'SUBTITLE_RESULT',
        requestId,
        error: '浏览器插件未连接，请确保插件已安装并启用'
      });
      return;
    }

    const request: SubtitleRequest = {
      type: 'GET_SUBTITLE',
      videoUrl,
      requestId
    };

    console.log('🧪 发送字幕请求到插件:', { videoUrl, requestId });
    this.sendMessage(request);
  }

  private sendMessage(message: any): void {
    if (this.pluginSocket && this.pluginSocket.readyState === WebSocket.OPEN) {
      this.pluginSocket.send(JSON.stringify(message));
    }
  }

  isConnected(): boolean {
    return this.pluginSocket !== null && this.pluginSocket.readyState === WebSocket.OPEN;
  }

  stop(): void {
    if (this.wss) {
      this.wss.close();
      this.wss = null;
    }
    this.pluginSocket = null;
  }
}

// 字幕提取服务
class SubtitleService {
  private pendingRequests = new Map<string, { resolve: (value: any) => void; reject: (error: any) => void; timeout: NodeJS.Timeout }>();

  constructor() {
    // 监听字幕响应事件
    eventBus.on('subtitle-response', (response) => {
      this.handleResponse(response);
    });
  }

  async extractSubtitles(videoUrl: string, timeout: number = 30000): Promise<any> {
    const requestId = uuidv4();
    
    return new Promise((resolve, reject) => {
      // 设置超时
      const timeoutId = setTimeout(() => {
        this.pendingRequests.delete(requestId);
        reject(new Error('字幕提取超时，请检查插件是否正常运行'));
      }, timeout);

      // 存储请求
      this.pendingRequests.set(requestId, { resolve, reject, timeout: timeoutId });

      // 发送请求事件
      eventBus.emit('subtitle-request', { requestId, videoUrl });
    });
  }

  private handleResponse(response: SubtitleResponse): void {
    const request = this.pendingRequests.get(response.requestId);
    if (!request) {
      console.warn('⚠️ 收到未知请求ID的响应:', response.requestId);
      return;
    }

    // 清理请求
    clearTimeout(request.timeout);
    this.pendingRequests.delete(response.requestId);

    if (response.error) {
      console.error('❌ 字幕提取失败:', response.error);
      request.reject(new Error(response.error));
    } else if (response.data) {
      console.log('✅ 字幕提取成功:', response.data.title);
      request.resolve({
        success: true,
        data: response.data
      });
    } else {
      request.reject(new Error('未知的响应格式'));
  }
}

  getPendingCount(): number {
    return this.pendingRequests.size;
  }
}

// 创建全局实例
const wsManager = new WebSocketManager(8080);
const subtitleService = new SubtitleService();

// 解析Bilibili URL中的BV号
function extractBVID(url: string): string {
  const bvMatch = url.match(/\/video\/(BV\w+)/);
  if (!bvMatch) {
    throw new Error('无法从URL中提取BV号，请确保URL格式正确');
  }
  return bvMatch[1];
}

// 创建MCP服务器
function createMCPServer(): McpServer {
  const server = new McpServer({
    name: "bilibili-subtitle-extractor",
    version: "2.0.0"
  });

  // 字幕提取工具
  server.tool(
    "extract_bilibili_subtitles",
    "从Bilibili视频中提取字幕。需要安装并启用浏览器插件。",
    {
      video_url: z.string().describe("Bilibili视频URL（完整链接，包含BV号）"),
      timeout: z.number().optional().default(30000).describe("超时时间（毫秒），默认30秒")
    },
    async ({ video_url, timeout }) => {
      // 验证URL格式
      if (!video_url.includes('bilibili.com')) {
        throw new Error('请提供有效的Bilibili视频URL');
      }

      try {
        extractBVID(video_url); // 验证BV号是否可提取
      } catch (error) {
        throw new Error('URL格式不正确，请提供包含BV号的完整Bilibili视频链接');
      }

      // 检查插件连接状态
      if (!wsManager.isConnected()) {
        throw new Error('浏览器插件未连接。请确保：\n1. 已安装Chrome浏览器插件\n2. 插件已启用\n3. 插件正在运行\n\n插件地址: chrome://extensions/');
      }

      const result = await subtitleService.extractSubtitles(video_url, timeout);
      
      // 添加渲染提示，为需要展示字幕的场景提供建议
      if (result.success && result.data) {
        result.renderingNote = `可选渲染建议：如果需要为用户展示字幕列表，强烈建议为每个字幕条目生成带时间戳的跳转链接。

格式模板：[MM:SS](视频URL?t=秒数) 字幕内容

具体示例：
[00:15](https://www.bilibili.com/video/BV1234567890?t=15) 大家好，欢迎来到我的编程教程
[00:18](https://www.bilibili.com/video/BV1234567890?t=18) 今天我们要学习如何入门编程
[01:07](https://www.bilibili.com/video/BV1234567890?t=67) Python是一个非常适合初学者的语言

说明：
- MM:SS 是格式化的时间戳（根据from字段转换）
- 秒数来自from字段的值（向下取整）
- 用户点击时间戳可直接跳转到视频对应时间点
- 如果只需要分析字幕内容，可以忽略此建议`;
      }
      
      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    }
  );

  // 连接状态检查工具
  server.tool(
    "get_connection_status",
    "获取与浏览器插件的连接状态。",
    {},
    async () => {
      const status = {
        pluginConnected: wsManager.isConnected(),
        pendingRequests: subtitleService.getPendingCount(),
        message: wsManager.isConnected() 
          ? '✅ 插件连接正常，可以提取字幕' 
          : '❌ 插件未连接，请确保插件已安装并启用',
        timestamp: new Date().toISOString()
      };

      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(status, null, 2),
          },
        ],
      };
    }
  );

  return server;
}

// Express应用设置
const app = express();

app.use((req: Request, res: Response, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  next();
});

app.use(express.json());

// CORS预检请求处理
app.options('/mcp', (req: Request, res: Response) => {
  res.status(200).end();
});

// MCP HTTP接口
app.post('/mcp', async (req: Request, res: Response) => {
  console.log('📥 收到MCP请求');
  
  try {
    const server = createMCPServer();
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: undefined,
    });
    
    res.on('close', () => {
      console.log('🔚 MCP请求连接关闭');
      transport.close();
      server.close();
    });
    
    await server.connect(transport);
    await transport.handleRequest(req, res, req.body);
  } catch (error) {
    console.error('❌ MCP请求处理错误:', error);
    if (!res.headersSent) {
      res.status(500).json({
        jsonrpc: '2.0',
        error: {
          code: -32603,
          message: 'Internal server error',
        },
        id: req.body?.id || null,
      });
    }
  }
});

app.get('/mcp', async (req: Request, res: Response) => {
  console.log('📥 收到GET MCP请求 (SSE)');
  
  try {
    const server = createMCPServer();
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: undefined,
    });
    
    res.on('close', () => {
      console.log('🔚 SSE连接关闭');
      transport.close();
      server.close();
    });
    
    await server.connect(transport);
    await transport.handleRequest(req, res);
  } catch (error) {
    console.error('❌ GET MCP请求处理错误:', error);
    if (!res.headersSent) {
      res.status(500).json({
        jsonrpc: "2.0",
        error: {
          code: -32603,
          message: "Internal server error"
        },
        id: null
      });
    }
  }
});

app.delete('/mcp', async (req: Request, res: Response) => {
  console.log('📥 收到DELETE MCP请求');
  
  try {
    const server = createMCPServer();
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: undefined,
    });
    
    res.on('close', () => {
      console.log('🔚 DELETE连接关闭');
      transport.close();
      server.close();
    });
    
    await server.connect(transport);
    await transport.handleRequest(req, res);
  } catch (error) {
    console.error('❌ DELETE MCP请求处理错误:', error);
    if (!res.headersSent) {
      res.status(500).json({
        jsonrpc: "2.0",
        error: {
          code: -32603,
          message: "Internal server error"
        },
        id: null
      });
    }
  }
});

// 状态页面
app.get('/', (req: Request, res: Response) => {
  const status = {
    service: 'Bilibili字幕提取MCP服务器',
    version: '2.0.0',
    pluginConnected: wsManager.isConnected(),
    pendingRequests: subtitleService.getPendingCount(),
    websocketPort: 8080,
    httpPort: 3456,
    timestamp: new Date().toISOString()
  };

  res.json(status);
});

// 启动服务器
const HTTP_PORT = 3456;
const SHUTDOWN_TIMEOUT = 5000; // 5秒超时
let httpServer: any = null;

async function gracefulShutdown(signal: string) {
  console.log(`\n🛑 收到 ${signal} 信号，正在优雅关闭...`);
  
  wsManager.stop();
  
  if (httpServer) {
    const timeout = setTimeout(() => {
      console.log('⚠️ 强制关闭服务器 - 超时');
      process.exit(1);
    }, SHUTDOWN_TIMEOUT);
    
    httpServer.close((err: any) => {
      clearTimeout(timeout);
      
      if (err) {
        console.error('❌ 服务器关闭时发生错误:', err);
        process.exit(1);
      }
      
      console.log('✅ HTTP服务器已关闭');
      process.exit(0);
    });
  } else {
    process.exit(0);
  }
}

// 注册进程退出事件处理
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGHUP', () => gracefulShutdown('SIGHUP'));
process.on('SIGBREAK', () => gracefulShutdown('SIGBREAK'));

process.on('uncaughtException', async (error) => {
  console.error('💥 未捕获的异常:', error);
  await gracefulShutdown('uncaughtException');
});

process.on('unhandledRejection', async (reason, promise) => {
  console.error('💥 未处理的Promise拒绝:', reason);
  await gracefulShutdown('unhandledRejection');
});

// 启动所有服务
console.log('🚀 启动Bilibili字幕提取MCP服务器...');

// 启动WebSocket服务器
wsManager.start();

// 启动HTTP服务器
httpServer = app.listen(HTTP_PORT, '0.0.0.0', () => {
  console.log('✅ 服务器启动完成！');
  console.log(`📡 HTTP服务器: http://localhost:${HTTP_PORT}`);
  console.log(`🔌 WebSocket服务器: ws://localhost:8080`);
  console.log(`📋 MCP接口: http://localhost:${HTTP_PORT}/mcp`);
  console.log(`📊 状态页面: http://localhost:${HTTP_PORT}/`);
  console.log('');
  console.log('🔧 请确保Chrome插件已安装并启用');
  console.log('💡 插件将自动连接到WebSocket服务器');
});

// 事件监听
eventBus.on('plugin-connected', () => {
  console.log('🎉 插件连接成功！');
});

eventBus.on('plugin-disconnected', () => {
  console.log('⚠️ 插件连接断开！');
});
