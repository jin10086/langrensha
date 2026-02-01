import React from 'react';
import { Bot, X } from 'lucide-react';
import { AIConfig } from '../../../types';
import { AI_PROVIDERS, AI_PRESETS } from '../../constants/game';

interface AISettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  aiConfig: AIConfig;
  onAIConfigChange: (updates: Partial<AIConfig>) => void;
  onProviderChange: (provider: string) => void;
}

const AISettingsModal: React.FC<AISettingsModalProps> = ({
  isOpen,
  onClose,
  aiConfig,
  onAIConfigChange,
  onProviderChange
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="bg-slate-900 w-full max-w-md rounded-2xl border border-slate-700 shadow-2xl p-6 space-y-5 animate-in slide-in-from-bottom-10">
        <div className="flex justify-between items-center">
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <Bot size={20} className="text-blue-400" /> AI 军师配置
          </h3>
          <button onClick={onClose} className="p-1 hover:bg-slate-800 rounded-full">
            <X size={20} className="text-slate-400" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-xs text-slate-400 font-bold uppercase mb-2 block">选择提供商</label>
            <div className="grid grid-cols-4 gap-2">
              {AI_PROVIDERS.map(p => (
                <button
                  key={p}
                  onClick={() => onProviderChange(p)}
                  className={`py-2 text-sm font-medium rounded-lg border capitalize transition-all ${
                    aiConfig.provider === p
                      ? 'bg-blue-600 border-blue-500 text-white'
                      : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3 bg-slate-950 p-4 rounded-xl border border-slate-800">
            <div>
              <label className="text-xs text-slate-500 block mb-1">API Key (令牌)</label>
              <input
                type="password"
                value={aiConfig.apiKey}
                onChange={(e) => onAIConfigChange({ apiKey: e.target.value })}
                placeholder="sk-..."
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:border-blue-500 outline-none font-mono"
              />
            </div>
            <div>
              <label className="text-xs text-slate-500 block mb-1">Base URL (接口地址)</label>
              <input
                type="text"
                value={aiConfig.baseUrl}
                onChange={(e) => onAIConfigChange({ baseUrl: e.target.value })}
                placeholder="https://api.example.com/v1"
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:border-blue-500 outline-none font-mono"
              />
            </div>
            <div>
              <label className="text-xs text-slate-500 block mb-1">Model Name (模型名称)</label>
              <input
                type="text"
                value={aiConfig.model}
                onChange={(e) => onAIConfigChange({ model: e.target.value })}
                placeholder="gpt-4o"
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:border-blue-500 outline-none font-mono"
              />
            </div>
          </div>

          <p className="text-xs text-slate-500">
            * 配置已自动保存到本地。
          </p>
        </div>

        <button
          onClick={onClose}
          className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl border border-slate-700 transition-colors"
        >
          关闭
        </button>
      </div>
    </div>
  );
};

export default AISettingsModal;
