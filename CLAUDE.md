# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

狼人杀游戏辅助工具 (WolfPack Companion) - 专为线下面杀设计的PWA应用，集成AI策略助手功能。

## 常用命令

```bash
# 开发
npm run dev              # 启动开发服务器 (端口3000)
npm run build            # 生产构建
npm run preview          # 预览构建结果

# 部署
npm run deploy           # 部署到 GitHub Pages (page分支)
```

## 开发环境配置

1. 创建 `.env.local` 文件，添加 `GEMINI_API_KEY=你的API密钥`
2. `npm install` 安装依赖
3. `npm run dev` 启动开发服务器

## 架构概览

### 技术栈
- React 19.2.0 + TypeScript (严格模式)
- Vite 6.2.0 构建工具
- Tailwind CSS (CDN引入)
- Lucide React 图标库

### 核心文件结构
```
├── types.ts              # 所有类型定义 (RoleType, Player, GameEvent, AIConfig等)
├── App.tsx               # 主应用组件，管理全局状态和Tab导航
├── components/
│   ├── PlayerGrid.tsx    # 玩家网格界面 (核心游戏交互)
│   ├── AIChat.tsx        # AI聊天组件
│   └── NotesView.tsx     # 时间轴/笔记视图
└── services/
    └── geminiService.ts  # AI服务集成 (OpenAI兼容API)
```

### 状态管理
- 所有游戏状态集中在 `App.tsx` 管理
- 使用 `localStorage` 持久化存储 (key: `werewolf-game-state`)
- 通过 props 将状态和回调传递给子组件

### 数据模型
- **Player**: 玩家状态 (id, status, suspectedRole, claimedRole, tags, notes, isMe)
- **GameEvent**: 游戏事件 (id, day, sourceId, targetId, type, description, timestamp)
- **AIConfig**: AI配置 (provider, apiKey, baseUrl, model)
- **RoleType**: 角色枚举 (狼人、预言家、女巫、猎人等)

### AI服务架构
- 支持多提供商: DeepSeek, Kimi, OpenAI, 自定义
- OpenAI兼容API格式
- 系统提示词针对狼人杀场景优化 (中文)

## 关键实现细节

### 角色颜色系统
`ROLE_COLORS` 定义在 `types.ts`，使用Tailwind颜色类 (如 `bg-red-600/20 text-red-400`)

### PWA配置
- `manifest.json`: 应用配置
- `service-worker.js`: 离线缓存策略
- `index.html`: viewport设置禁用缩放，优化移动端体验

### 构建配置 (vite.config.ts)
- `base: './'` 支持GitHub Pages相对路径
- 端口3000，监听所有接口
- 路径别名 `@/` 映射到根目录
- 环境变量 `GEMINI_API_KEY` 注入

## 注意事项

1. **无测试框架**: 项目目前没有配置测试工具
2. **无ESLint/Prettier**: 代码风格依赖开发者自觉
3. **CDN依赖**: Tailwind CSS和Google Fonts通过CDN加载
4. **客户端API密钥**: AI服务的API密钥存储在本地，通过环境变量注入
