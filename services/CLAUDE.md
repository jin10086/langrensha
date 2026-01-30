[根目录](../CLAUDE.md) > **services**

# AI服务集成模块

**模块职责**: 提供多AI服务提供商集成功能，为狼人杀游戏提供智能策略分析和建议。

## 入口文件
- **[geminiService.ts](./geminiService.ts)**: 主要的AI服务集成模块，支持多提供商API调用

## 核心函数

### getStrategyAdvice

```typescript
export const getStrategyAdvice = async (
  config: AIConfig,
  myRole: RoleType,
  players: Player[],
  events: GameEvent[],
  userQuery: string,
  chatHistory: string
): Promise<string>
```

**功能描述**: 基于游戏状态和用户查询，从AI获取策略建议

## 接口定义

### AI配置接口
```typescript
interface AIConfig {
  provider: 'deepseek' | 'kimi' | 'openai' | 'custom';
  apiKey: string;
  baseUrl: string;
  model: string;
}
```

### OpenAI兼容API格式
```typescript
interface APIRequest {
  model: string;
  messages: Array<{
    role: 'system' | 'user';
    content: string;
  }>;
  temperature?: number;
  max_tokens?: number;
}
```

## 支持的AI提供商

### DeepSeek
- 基础URL: `https://api.deepseek.com`
- 推荐模型: `deepseek-chat`
- 特点: 中文理解好，逻辑推理能力强

### Kimi (月之暗面)
- 基础URL: `https://api.moonshot.cn/v1`
- 推荐模型: `moonshot-v1-8k`
- 特点: 长文本处理能力强

### OpenAI
- 基础URL: `https://api.openai.com/v1`
- 推荐模型: `gpt-4o-mini`
- 特点: 全球通用，性能稳定

### 自定义提供商
- 支持任意OpenAI兼容API
- 可配置baseUrl和模型名称
- 灵活性强，扩展性好

## 核心特性

### 智能上下文构建
1. **游戏状态快照**: 包含所有玩家的状态、标记、备注
2. **历史动作时间轴**: 按天记录的关键游戏事件
3. **角色视角分析**: 基于玩家自身角色提供个性化建议
4. **中文优化**: 提示词和交互全部采用中文

### 系统提示设计
```
你是一个专业的狼人杀 (Werewolf) 高级策略助手。
你需要根据场上的【实时局势】和【历史时间轴】来分析逻辑。

【你的任务】:
1. 寻找逻辑矛盾（例如：有人前一天发金水，今天又说他是狼）
2. 如果我是好人，帮我盘出谁是狼，基于动作和票型
3. 如果我是狼人，根据现在的起跳情况，建议我去刀谁，或者去抗推谁
4. 重点关注 "起跳" (Claim) 和 "动作" (Check Good/Bad) 的一致性
```

### 错误处理机制
1. **网络错误**: 捕获fetch异常，返回友好的错误信息
2. **API错误**: 处理HTTP状态码错误，解析错误响应
3. **配置错误**: 检查API密钥和基础URL的完整性
4. **超时处理**: 合理的请求超时机制

## 关键依赖

### 内部依赖
```typescript
import { Player, RoleType, PlayerStatus, GameEvent, AIConfig } from "../types";
```

### 外部依赖
- 纯TypeScript实现，无额外npm依赖
- 使用浏览器原生的fetch API

## 性能考虑

### API调用优化
1. **防抖机制**: 避免用户在思考过程中的频繁调用
2. **上下文压缩**: 合理控制发送给AI的数据量
3. **token限制**: 设置max_tokens避免过度消耗
4. **缓存策略**: 相同场景的智能建议缓存（未来可扩展）

### 网络优化
1. **CDN支持**: 通过CDN加速AI API访问
2. **重试机制**: 网络失败时的重试逻辑
3. **连接池**: 复用网络连接资源

## 安全考虑

### 客户端安全
1. **API密钥保护**: 避免在代码中硬编码敏感信息
2. **输入验证**: 对用户输入进行基本验证
3. **输出清理**: 对AI响应内容进行安全处理

### 隐私保护
1. **本地存储**: 敏感配置仅存储在本地
2. **数据传输**: 通过HTTPS进行安全传输
3. **权限控制**: 无额外权限请求

## 测试与监控

### 手动测试
1. **不同提供商**: 测试所有支持的AI服务
2. **异常场景**: 模拟网络和API错误
3. **性能测试**: 响应时间评估
4. **质量评估**: 建议准确性和实用性

### 监控指标
1. **响应时间**: API调用耗时统计
2. **成功率**: AI服务可用性监控
3. **错误类型**: 分类统计各种错误
4. **用户反馈**: 建议效果评估

## 扩展功能建议

### 智能增强
1. **多种策略风格**: 保守、激进、平衡等不同策略模式
2. **学习优化**: 根据用户选择优化建议质量
3. **群体智能**: 结合多人游戏数据分析
4. **实时更新**: 游戏过程中的动态策略调整

### 技术升级
1. **流式响应**: 支持大模型流式输出
2. **多线程**: 并发处理多个AI请求
3. **边缘计算**: 部署本地化推理能力
4. **模型微调**: 基于狼人杀数据集微调模型

## 使用示例

```typescript
// 获取AI策略建议
const advice = await getStrategyAdvice(
  aiConfig,
  RoleType.SEER,  // 我是预言家
  currentPlayers, // 当前玩家状态
  gameEvents,     // 游戏历史事件
  "我查验了3号是金水，但现在有人说3号是狼，我该相信谁？",
  conversationHistory // 之前的对话历史
);
```

## 依赖版本要求

```json
{
  "@google/genai": "^1.30.0",
  "typescript": "~5.8.2"
}
```

## 常见问题解决

1. **API请求失败**: 检查网络连接、API密钥、CORS配置
2. **响应质量不佳**: 调整temperature参数，优化提示词
3. **token超限**: 精简上下文内容，分段处理
4. **性价比问题**: 根据需求选择合适的模型和提供商

## 变更记录

**2026-01-30**: 初始化AI服务模块文档，梳理服务架构和实现细节
**2026-01-30**: 更新多AI提供商支持说明和使用指南