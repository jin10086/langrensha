
import { Player, RoleType, PlayerStatus, GameEvent, AIConfig } from "../types";

// Generic OpenAI-Compatible Client
export const getStrategyAdvice = async (
  config: AIConfig,
  myRole: RoleType,
  players: Player[],
  events: GameEvent[],
  userQuery: string,
  chatHistory: string
): Promise<string> => {
  
  if (!config.apiKey || !config.baseUrl) {
    return "AI 配置未完成。请点击右上角设置配置 API Key。";
  }

  const alivePlayers = players.filter(p => p.status === PlayerStatus.ALIVE).map(p => p.id).join(', ');
  
  const playerDetails = players.map(p => {
    const claimed = p.claimedRole !== RoleType.UNKNOWN ? `[起跳: ${p.claimedRole}]` : '';
    const tags = p.tags.length > 0 ? `[标记: ${p.tags.join(', ')}]` : '';
    const meTag = p.isMe ? '(我)' : '';
    const notes = p.notes ? `\n   - 备注: ${p.notes}` : '';
    
    return `${p.id}号: ${p.status} [我猜是: ${p.suspectedRole}] ${claimed} ${meTag} ${tags}${notes}`;
  }).join('\n');

  const eventLog = events.map(e => 
    `Day ${e.day} [${new Date(e.timestamp).toLocaleTimeString()}]: ${e.description}`
  ).join('\n');

  const systemPrompt = `
    你是一个专业的狼人杀 (Werewolf) 高级策略助手。
    你需要根据场上的【实时局势】和【历史时间轴】来分析逻辑。

    我的身份: ${myRole}
    
    【玩家状态快照】:
    ${playerDetails}

    【关键动作时间轴 (Evidence)】:
    ${eventLog || "(暂无记录)"}

    【你的任务】:
    1. 寻找逻辑矛盾（例如：有人前一天发金水，今天又说他是狼）。
    2. 如果我是好人，帮我盘出谁是狼，基于动作和票型。
    3. 如果我是狼人，根据现在的起跳情况，建议我去刀谁，或者去抗推谁。
    4. 重点关注 "起跳" (Claim) 和 "动作" (Check Good/Bad) 的一致性。

    用户问题: ${userQuery}
    历史对话: ${chatHistory}

    请用中文简练回答。不要废话。
  `;

  try {
    // Remove trailing slash from baseUrl if present
    const cleanBaseUrl = config.baseUrl.replace(/\/+$/, '');
    const endpoint = `${cleanBaseUrl}/chat/completions`;

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`
      },
      body: JSON.stringify({
        model: config.model || 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userQuery }
        ],
        temperature: 0.7,
        max_tokens: 500
      })
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      console.error("AI API Error:", errData);
      throw new Error(`API Error: ${response.status}`);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || "无法获取有效回复。";

  } catch (error) {
    console.error("AI Service Error:", error);
    return `AI请求失败: ${(error as Error).message}。请检查网络或配置。`;
  }
};
