import React from 'react';
import { Settings, FlaskConical, ShieldAlert, ChevronRight, Bot, Download, Flag } from 'lucide-react';
import { GamePhase, GameState, VoteType } from '../../../types';

interface GameHeaderProps {
  myId: number;
  myRole: string;
  gameState: GameState;
  showSettingsMenu: boolean;
  onToggleSettingsMenu: () => void;
  onCloseSettingsMenu: () => void;
  onOpenAISettings: () => void;
  onExportData: () => void;
  onRequestEndGame: () => void;
  onToggleGameState: (field: 'witchAntidoteUsed' | 'witchPoisonUsed' | 'hunterGunStatus') => void;
  onOpenVotingModal: (voteType: VoteType) => void;
  onAdvancePhase: () => void;
}

const GameHeader: React.FC<GameHeaderProps> = ({
  myId,
  myRole,
  gameState,
  showSettingsMenu,
  onToggleSettingsMenu,
  onCloseSettingsMenu,
  onOpenAISettings,
  onExportData,
  onRequestEndGame,
  onToggleGameState,
  onOpenVotingModal,
  onAdvancePhase
}) => {
  const getPhaseBadge = () => {
    switch (gameState.phase) {
      case GamePhase.SHERIFF_ELECTION:
        return <span className="text-[10px] text-amber-400">👑 上警</span>;
      case GamePhase.DAY_VOTE:
        return <span className="text-[10px] text-red-400">🗳️ 投票</span>;
      case GamePhase.NIGHT:
        return <span className="text-[10px] text-purple-400">🌙 夜晚</span>;
      default:
        return null;
    }
  };

  return (
    <header className="sticky top-0 z-30 bg-slate-950/95 backdrop-blur-md border-b border-slate-800 px-4 py-3 shadow-md">
      <div className="flex justify-between items-center mb-2 relative">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center font-bold text-white text-lg shadow-lg shadow-blue-900/20">
            {myId}
          </div>
          <div className="flex flex-col leading-tight">
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">{myRole}</span>
            <div className="flex items-center gap-2 text-white font-bold">
              <span>第 {gameState.currentDay} 天</span>
              {getPhaseBadge()}
            </div>
          </div>
        </div>
        <div className="relative">
          <button
            onClick={onToggleSettingsMenu}
            className={`p-2 rounded-full border transition-all ${
              showSettingsMenu
                ? 'bg-blue-900/50 text-blue-400 border-blue-800'
                : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
            }`}
          >
            <Settings size={18} />
          </button>

          {/* Dropdown Menu */}
          {showSettingsMenu && (
            <div className="absolute right-0 top-full mt-2 w-48 bg-slate-900 border border-slate-800 rounded-xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 origin-top-right z-50">
              <button
                onClick={() => { onOpenAISettings(); onCloseSettingsMenu(); }}
                className="w-full text-left px-4 py-3 text-sm text-slate-300 hover:bg-slate-800 flex items-center gap-2"
              >
                <Bot size={16} className="text-blue-400" /> AI 设置
              </button>
              <button
                onClick={onExportData}
                className="w-full text-left px-4 py-3 text-sm text-slate-300 hover:bg-slate-800 flex items-center gap-2 border-t border-slate-800"
              >
                <Download size={16} /> 导出数据
              </button>
              <button
                onClick={onRequestEndGame}
                className="w-full text-left px-4 py-3 text-sm text-red-400 hover:bg-red-950/30 border-t border-slate-800 flex items-center gap-2"
              >
                <Flag size={16} /> 结束本局
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Quick Status Toggles */}
      <div className="flex gap-2 overflow-x-auto scrollbar-hide py-1">
        <button
          onClick={() => onToggleGameState('witchAntidoteUsed')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all whitespace-nowrap ${
            gameState.witchAntidoteUsed
              ? 'bg-slate-900 text-slate-500 border-slate-800 line-through opacity-60'
              : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
          }`}
        >
          <FlaskConical size={12} /> 解药
        </button>
        <button
          onClick={() => onToggleGameState('witchPoisonUsed')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all whitespace-nowrap ${
            gameState.witchPoisonUsed
              ? 'bg-slate-900 text-slate-500 border-slate-800 line-through opacity-60'
              : 'bg-purple-500/10 text-purple-400 border-purple-500/30'
          }`}
        >
          <FlaskConical size={12} /> 毒药
        </button>
        <button
          onClick={() => onToggleGameState('hunterGunStatus')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all whitespace-nowrap ${
            !gameState.hunterGunStatus
              ? 'bg-slate-900 text-slate-500 border-slate-800 opacity-60'
              : 'bg-orange-500/10 text-orange-400 border-orange-500/30'
          }`}
        >
          <ShieldAlert size={12} /> 猎枪
        </button>

        {/* 投票按钮 */}
        {gameState.phase === GamePhase.SHERIFF_ELECTION && gameState.enableSheriff && (
          <button
            onClick={() => onOpenVotingModal(VoteType.SHERIFF)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all whitespace-nowrap bg-amber-500/10 text-amber-400 border-amber-500/30 hover:bg-amber-500/20"
          >
            <span>👑</span> 警长投票
          </button>
        )}
        {gameState.phase === GamePhase.DAY_VOTE && (
          <button
            onClick={() => onOpenVotingModal(VoteType.EXILE)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all whitespace-nowrap bg-red-500/10 text-red-400 border-red-500/30 hover:bg-red-500/20"
          >
            <span>🗳️</span> 放逐投票
          </button>
        )}

        {/* 阶段控制按钮 */}
        {gameState.phase !== GamePhase.DAY_VOTE && (
          <button
            onClick={onAdvancePhase}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all whitespace-nowrap bg-blue-500/10 text-blue-400 border-blue-500/30 hover:bg-blue-500/20"
          >
            <ChevronRight size={12} /> 下一阶段
          </button>
        )}
      </div>

      {/* Settings Overlay Backdrop */}
      {showSettingsMenu && (
        <div className="fixed inset-0 z-20 bg-transparent" onClick={onCloseSettingsMenu} />
      )}
    </header>
  );
};

export default GameHeader;
