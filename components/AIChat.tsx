
import React, { useState, useRef, useEffect } from 'react';
import { Player, RoleType, ChatMessage, GameEvent, AIConfig } from '../types';
import { getStrategyAdvice } from '../services/geminiService';
import { Send, Sparkles, Bot, User, Settings2 } from 'lucide-react';

interface AIChatProps {
  myRole: RoleType;
  players: Player[];
  events: GameEvent[];
  aiConfig: AIConfig;
  onOpenSettings: () => void;
}

const AIChat: React.FC<AIChatProps> = ({ myRole, players, events, aiConfig, onOpenSettings }) => {
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize greeting
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([
        {
          role: 'model',
          text: `我是你的狼人杀助手。你现在的身份是【${myRole}】。有什么我可以帮你的吗？`,
          timestamp: Date.now(),
        }
      ]);
    }
  }, [myRole]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!query.trim() || isLoading) return;
    if (!aiConfig.apiKey) return;

    const userMsg: ChatMessage = { role: 'user', text: query, timestamp: Date.now() };
    setMessages(prev => [...prev, userMsg]);
    setQuery('');
    setIsLoading(true);

    const conversationLog = messages.slice(-6).map(m => `${m.role}: ${m.text}`).join('\n');
    const responseText = await getStrategyAdvice(aiConfig, myRole, players, events, userMsg.text, conversationLog);

    const botMsg: ChatMessage = { role: 'model', text: responseText, timestamp: Date.now() };
    setMessages(prev => [...prev, botMsg]);
    setIsLoading(false);
  };

  const suggestions = [
    "现在的局势怎么样？",
    "谁的发言有漏洞？",
    "分析一下起跳的预言家",
    "下一轮我该做什么？"
  ];

  // State: No API Key Configured
  if (!aiConfig.apiKey) {
    return (
      <div className="flex flex-col h-full items-center justify-center p-6 text-center space-y-6 opacity-0 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="bg-slate-900 p-6 rounded-full border border-slate-800 shadow-xl shadow-slate-900/50">
           <Sparkles size={48} className="text-slate-600" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-slate-200 mb-2">AI 军师未启用</h3>
          <p className="text-sm text-slate-500 max-w-xs mx-auto leading-relaxed">
            配置 API Key 即可激活 AI 助手。<br/>
            支持 <span className="text-blue-400">DeepSeek</span>, <span className="text-blue-400">Kimi</span>, <span className="text-blue-400">ChatGPT</span> 等模型。
          </p>
        </div>
        <button 
          onClick={onOpenSettings}
          className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold shadow-lg flex items-center gap-2 transition-all"
        >
           <Settings2 size={18} /> 配置 AI 服务
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full max-h-[calc(100vh-240px)]">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto space-y-4 p-2">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`
              max-w-[85%] rounded-2xl p-3 text-sm leading-relaxed
              ${msg.role === 'user' 
                ? 'bg-blue-600 text-white rounded-tr-none' 
                : 'bg-slate-800 text-slate-200 rounded-tl-none border border-slate-700'}
            `}>
              <div className="flex items-center gap-2 mb-1 opacity-70 text-xs font-bold">
                {msg.role === 'model' ? <Bot size={12} /> : <User size={12} />}
                {msg.role === 'model' ? '助手' : '你'}
              </div>
              <div className="whitespace-pre-wrap">{msg.text}</div>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
             <div className="bg-slate-800 rounded-2xl rounded-tl-none p-4 border border-slate-700 flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
             </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Suggestions */}
      <div className="flex gap-2 overflow-x-auto py-2 px-1 scrollbar-hide">
        {suggestions.map((s, i) => (
          <button
            key={i}
            onClick={() => setQuery(s)}
            className="whitespace-nowrap px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-full text-xs text-blue-300 transition-colors"
          >
            {s}
          </button>
        ))}
      </div>

      {/* Input Area */}
      <div className="mt-2 flex gap-2 items-center bg-slate-900 p-2 rounded-xl border border-slate-800">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder="询问 AI 军师..."
          className="flex-1 bg-transparent text-white placeholder-slate-500 outline-none text-sm"
        />
        <button 
          onClick={handleSend}
          disabled={isLoading}
          className="p-2 bg-blue-600 rounded-full text-white disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? <Sparkles size={18} className="animate-spin" /> : <Send size={18} />}
        </button>
      </div>
    </div>
  );
};

export default AIChat;
