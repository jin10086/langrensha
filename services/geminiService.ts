
import { GoogleGenAI, HarmCategory, HarmBlockThreshold } from "@google/genai";
import { Player, RoleType, PlayerStatus, GameEvent } from "../types";

const apiKey = process.env.API_KEY || '';

let ai: GoogleGenAI | null = null;
if (apiKey) {
  ai = new GoogleGenAI({ apiKey });
}

export const getStrategyAdvice = async (
  myRole: RoleType,
  players: Player[],
  events: GameEvent[],
  userQuery: string,
  chatHistory: string
): Promise<string> => {
  if (!ai) {
    return "API Key 未配置。";
  }

  const alivePlayers = players.filter(p => p.status === PlayerStatus.ALIVE).map(p => p.id).join(', ');
  
  const playerDetails = players.map(p => {
    const claimed = p.claimedRole !== RoleType.UNKNOWN ? `[起跳: ${p.claimedRole}]` : '';
    const tags = p.tags.length > 0 ? `[标记: ${p.tags.join(', ')}]` : '';
    const meTag = p.isMe ? '(我)' : '';
    // Only show notes if they exist
    const notes = p.notes ? `\n   - 备注: ${p.notes}` : '';
    
    return `${p.id}号: ${p.status} [我猜是: ${p.suspectedRole}] ${claimed} ${meTag} ${tags}${notes}`;
  }).join('\n');

  // Format events nicely
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
    2. 如果我是好人，帮我盘出谁是狼，基于动作和票型（如果有）。
    3. 如果我是狼人，根据现在的起跳情况，建议我去刀谁，或者去抗推谁。
    4. 重点关注 "起跳" (Claim) 和 "动作" (Check Good/Bad) 的一致性。

    用户问题: ${userQuery}
    历史对话: ${chatHistory}

    请用中文简练回答。不要废话。
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: userQuery,
      config: {
        systemInstruction: systemPrompt,
        temperature: 0.7,
        safetySettings: [
            { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
            { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
            { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
            { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
        ]
      }
    });

    return response.text || "无法生成建议。";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "AI 服务暂时不可用。";
  }
};
