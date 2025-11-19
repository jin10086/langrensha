
import React, { useState, useRef, useEffect } from 'react';
import { Player, RoleType, ChatMessage, GameEvent } from '../types';
import { getStrategyAdvice } from '../services/geminiService';
import { Send, Sparkles, Bot, User } from 'lucide-react';

interface AIChatProps {
  myRole: RoleType;
  players: Player[];
  events: GameEvent[];
}

const AIChat: React.FC<AIChatProps> = ({ myRole, players, events }) => {
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'model',
      text: `我是你的狼人杀助手。你现在的身份是【${myRole}】。有什么我可以帮你的吗？`,
      timestamp: Date.now(),
    }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!query.trim() || isLoading) return;

    const userMsg: ChatMessage = { role: 'user', text: query, timestamp: Date.now() };
    setMessages(prev => [...prev, userMsg]);
    setQuery('');
    setIsLoading(true);

    const conversationLog = messages.slice(-6).map(m => `${m.role}: ${m.text}`).join('\n');
    const responseText = await getStrategyAdvice(myRole, players, events, userMsg.text, conversationLog);

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
