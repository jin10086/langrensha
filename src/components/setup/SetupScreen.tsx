import React from 'react';
import { Play, RotateCcw, Plus, Minus, Bot } from 'lucide-react';
import { RoleType } from '../../../types';
import AISettingsModal from './AISettingsModal';

interface SetupScreenProps {
  roleCounts: Record<string, number>;
  myId: number;
  myRole: RoleType;
  enableSheriff: boolean;
  totalPlayers: number;
  showAISettings: boolean;
  aiConfig: {
    provider: string;
    apiKey: string;
    baseUrl: string;
    model: string;
  };
  onRoleCountChange: (role: string, delta: number) => void;
  onMyIdChange: (id: number) => void;
  onMyRoleChange: (role: RoleType) => void;
  onEnableSheriffChange: (enabled: boolean) => void;
  onApplyPreset: () => void;
  onStartGame: () => void;
  onShowAISettings: () => void;
  onCloseAISettings: () => void;
  onAIConfigChange: (updates: Partial<{ provider: string; apiKey: string; baseUrl: string; model: string }>) => void;
  onAIProviderChange: (provider: string) => void;
}

const ROLE_DISPLAY_CONFIG: { role: RoleType; label: string; icon?: string }[] = [
  { role: RoleType.SEER, label: '预言家' },
  { role: RoleType.WITCH, label: '女巫' },
  { role: RoleType.HUNTER, label: '猎人' },
  { role: RoleType.GUARD, label: '守卫' },
  { role: RoleType.IDIOT, label: '白痴' },
  { role: RoleType.KNIGHT, label: '骑士' },
  { role: RoleType.WOLF_KING, label: '狼王' },
];

const SetupScreen: React.FC<SetupScreenProps> = ({
  roleCounts,
  myId,
  myRole,
  enableSheriff,
  totalPlayers,
  showAISettings,
  aiConfig,
  onRoleCountChange,
  onMyIdChange,
  onMyRoleChange,
  onEnableSheriffChange,
  onApplyPreset,
  onStartGame,
  onShowAISettings,
  onCloseAISettings,
  onAIConfigChange,
  onAIProviderChange
}) => {
  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-lg space-y-6 pb-10">
        <div className="text-center">
          <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-600 mb-2">
            WolfPack
          </h1>
          <p className="text-slate-400">狼人杀辅助工具</p>
        </div>

        <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-2xl space-y-6">
          {/* Section 1: Role Config */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-sm font-bold text-slate-300 uppercase tracking-wide">1. 配置板子</h2>
              <button
                onClick={onApplyPreset}
                className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1"
              >
                <RotateCcw size={12} /> 恢复标准12人
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {/* Main Factions */}
              <div className="col-span-2 grid grid-cols-2 gap-3">
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex justify-between items-center">
                  <span className="text-red-400 font-bold flex items-center gap-2">🐺 狼人</span>
                  <div className="flex items-center gap-3 bg-slate-800 rounded-lg px-1">
                    <button
                      onClick={() => onRoleCountChange(RoleType.WEREWOLF, -1)}
                      className="p-1 text-slate-400 hover:text-white"
                    >
                      <Minus size={14} />
                    </button>
                    <span className="text-white font-bold w-4 text-center">
                      {roleCounts[RoleType.WEREWOLF] || 0}
                    </span>
                    <button
                      onClick={() => onRoleCountChange(RoleType.WEREWOLF, 1)}
                      className="p-1 text-slate-400 hover:text-white"
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                </div>
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex justify-between items-center">
                  <span className="text-emerald-400 font-bold flex items-center gap-2">🧑 平民</span>
                  <div className="flex items-center gap-3 bg-slate-800 rounded-lg px-1">
                    <button
                      onClick={() => onRoleCountChange(RoleType.VILLAGER, -1)}
                      className="p-1 text-slate-400 hover:text-white"
                    >
                      <Minus size={14} />
                    </button>
                    <span className="text-white font-bold w-4 text-center">
                      {roleCounts[RoleType.VILLAGER] || 0}
                    </span>
                    <button
                      onClick={() => onRoleCountChange(RoleType.VILLAGER, 1)}
                      className="p-1 text-slate-400 hover:text-white"
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Gods and Specials */}
              {ROLE_DISPLAY_CONFIG.map(({ role, label }) => (
                <div
                  key={role}
                  className="bg-slate-950 px-3 py-2 rounded-xl border border-slate-800 flex justify-between items-center"
                >
                  <span className="text-slate-300 text-sm">{label}</span>
                  <div className="flex items-center gap-2 bg-slate-800 rounded-lg px-1">
                    <button
                      onClick={() => onRoleCountChange(role, -1)}
                      className="p-1 text-slate-500 hover:text-white"
                    >
                      <Minus size={12} />
                    </button>
                    <span
                      className={`text-sm font-bold w-3 text-center ${
                        roleCounts[role] > 0 ? 'text-blue-400' : 'text-slate-600'
                      }`}
                    >
                      {roleCounts[role] || 0}
                    </span>
                    <button
                      onClick={() => onRoleCountChange(role, 1)}
                      className="p-1 text-slate-500 hover:text-white"
                    >
                      <Plus size={12} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-between items-center pt-2">
              <span className="text-slate-500 text-sm">当前总人数:</span>
              <span className="text-2xl font-bold text-white bg-slate-800 px-4 py-1 rounded-lg border border-slate-700">
                {totalPlayers} <span className="text-xs font-normal text-slate-400">人</span>
              </span>
            </div>

            {/* Sheriff Election Toggle */}
            <div className="flex items-center justify-between bg-slate-950 p-3 rounded-xl border border-slate-800">
              <div className="flex items-center gap-2">
                <span className="text-amber-400">👑</span>
                <div className="flex flex-col">
                  <span className="text-sm text-slate-300 font-medium">开启上警功能</span>
                  <span className="text-xs text-slate-500">警长拥有1.5票归票权</span>
                </div>
              </div>
              <button
                onClick={() => onEnableSheriffChange(!enableSheriff)}
                className={`w-12 h-6 rounded-full transition-colors relative ${
                  enableSheriff ? 'bg-blue-600' : 'bg-slate-700'
                }`}
              >
                <span
                  className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
                    enableSheriff ? 'translate-x-7' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Section 2: My Info */}
          <div className="space-y-4 border-t border-slate-800 pt-4">
            <h2 className="text-sm font-bold text-slate-300 uppercase tracking-wide">2. 我的信息</h2>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">我的号码</label>
                <select
                  value={myId}
                  onChange={(e) => onMyIdChange(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-700 text-white p-2 rounded-lg focus:border-blue-500 outline-none"
                >
                  {Array.from({ length: totalPlayers }, (_, i) => i + 1).map((num) => (
                    <option key={num} value={num}>
                      {num} 号
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">我的底牌</label>
                <select
                  value={myRole}
                  onChange={(e) => onMyRoleChange(e.target.value as RoleType)}
                  className="w-full bg-slate-950 border border-slate-700 text-white p-2 rounded-lg focus:border-blue-500 outline-none"
                >
                  {Object.values(RoleType)
                    .filter((r) => r !== RoleType.UNKNOWN)
                    .map((role) => (
                      <option key={role} value={role}>
                        {role}
                      </option>
                    ))}
                </select>
              </div>
            </div>
          </div>

          <div className="space-y-3 pt-2">
            <button
              onClick={onStartGame}
              disabled={totalPlayers < 6}
              className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold rounded-xl shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-blue-500/20 transition-all"
            >
              <Play size={20} fill="currentColor" /> 开始游戏
            </button>

            <div className="flex justify-center">
              <button
                onClick={onShowAISettings}
                className="text-xs text-slate-500 hover:text-blue-400 flex items-center gap-1 transition-colors"
              >
                <Bot size={12} />
                配置 AI 服务
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* AI Settings Modal */}
      <AISettingsModal
        isOpen={showAISettings}
        onClose={onCloseAISettings}
        aiConfig={aiConfig}
        onAIConfigChange={onAIConfigChange}
        onProviderChange={onAIProviderChange}
      />
    </div>
  );
};

export default SetupScreen;
