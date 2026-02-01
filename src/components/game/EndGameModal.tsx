import React from 'react';
import { AlertTriangle } from 'lucide-react';

interface EndGameModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

const EndGameModal: React.FC<EndGameModalProps> = ({
  isOpen,
  onClose,
  onConfirm
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="bg-slate-900 w-full max-w-sm rounded-2xl border border-slate-700 shadow-2xl p-6 space-y-5 animate-in zoom-in-95">
        <div className="flex flex-col items-center text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-red-900/30 flex items-center justify-center">
            <AlertTriangle size={24} className="text-red-500" />
          </div>
          <h3 className="text-lg font-bold text-white">结束本局游戏？</h3>
          <p className="text-sm text-slate-400">
            当前的所有游戏记录（标记、笔记、AI对话）将被清空。<br />
            <span className="text-slate-500 text-xs">(下一局将保留当前的角色板子配置)</span>
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={onClose}
            className="py-3 rounded-xl font-medium text-slate-300 hover:bg-slate-800 transition-colors"
          >
            取消
          </button>
          <button
            onClick={onConfirm}
            className="py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl shadow-lg shadow-red-900/20 transition-colors"
          >
            确认结束
          </button>
        </div>
      </div>
    </div>
  );
};

export default EndGameModal;
