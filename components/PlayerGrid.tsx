
import React, { useState } from 'react';
import { Player, PlayerStatus, RoleType, ROLE_COLORS, PlayerTag, TAG_CONFIG, GameEvent, SheriffStatus, SHERIFF_STATUS_CONFIG, SHERIFF_BADGE, GamePhase, VoteType } from '../types';
import { Skull, XCircle, X, ShieldCheck, ShieldAlert, Target, Mic, ArrowRightLeft, ArrowRight, FlaskConical, AlertTriangle } from 'lucide-react';

interface PlayerGridProps {
  players: Player[];
  currentDay: number;
  roleCounts: Record<string, number>;
  onUpdatePlayer: (id: number, updates: Partial<Player>) => void;
  onAddEvent: (event: Omit<GameEvent, 'id' | 'timestamp'>) => void;
  gameEvents: GameEvent[];
  // 上警相关
  phase?: GamePhase;
  enableSheriff?: boolean;
  onRegisterSheriff?: (playerId: number) => void;
  onWithdrawSheriff?: (playerId: number) => void;
  onElectSheriff?: (playerId: number) => void;
}

const PlayerGrid: React.FC<PlayerGridProps> = ({
  players,
  currentDay,
  roleCounts,
  onUpdatePlayer,
  onAddEvent,
  gameEvents,
  phase,
  enableSheriff,
  onRegisterSheriff,
  onWithdrawSheriff,
  onElectSheriff
}) => {
  const [editingPlayerId, setEditingPlayerId] = useState<number | null>(null);
  const [targetId, setTargetId] = useState<number | null>(null);

  const editingPlayer = editingPlayerId ? players.find(p => p.id === editingPlayerId) || null : null;

  // --- Statistics Logic ---
  const getRoleStats = (role: RoleType) => {
      const claimed = players.filter(p => p.claimedRole === role).length;
      const total = roleCounts[role] || 0;
      return { claimed, total, remaining: Math.max(0, total - claimed) };
  };

  // Group Gods
  const godRoles = [RoleType.SEER, RoleType.WITCH, RoleType.HUNTER, RoleType.GUARD, RoleType.IDIOT, RoleType.KNIGHT];
  const godStats = godRoles.reduce((acc, role) => {
      const stats = getRoleStats(role);
      acc.claimed += stats.claimed;
      acc.total += stats.total;
      return acc;
  }, { claimed: 0, total: 0 });

  const wolfStats = [RoleType.WEREWOLF, RoleType.WOLF_KING].reduce((acc, role) => {
      const stats = getRoleStats(role);
      acc.claimed += stats.claimed;
      acc.total += stats.total;
      return acc;
  }, { claimed: 0, total: 0 });

  const villagerStats = getRoleStats(RoleType.VILLAGER);

  // --- Filter Available Roles ---
  const availableRoles = Object.values(RoleType).filter(role => {
      if (role === RoleType.UNKNOWN) return true;
      return (roleCounts[role] || 0) > 0;
  });

  // --- Action Handlers ---

  const handleStatusChange = (status: PlayerStatus) => {
    if (!editingPlayer) return;
    onUpdatePlayer(editingPlayer.id, { status });
    if (status !== PlayerStatus.ALIVE) {
      onAddEvent({
        day: currentDay,
        sourceId: editingPlayer.id,
        type: 'DEATH',
        description: `${editingPlayer.id}号玩家状态更新为：${status}`
      });
    }
  };

  const handleRoleClaim = (role: RoleType) => {
    if (!editingPlayer) return;
    onUpdatePlayer(editingPlayer.id, { claimedRole: role });
    if (role !== RoleType.UNKNOWN) {
      onAddEvent({
        day: currentDay,
        sourceId: editingPlayer.id,
        type: 'CLAIM',
        description: `${editingPlayer.id}号玩家起跳身份：${role}`
      });
    }
  };

  const handleLogicRole = (role: RoleType) => {
      if (!editingPlayer) return;
      onUpdatePlayer(editingPlayer.id, { suspectedRole: role });
  }

  const handleAction = (type: 'CHECK_GOOD' | 'CHECK_BAD' | 'SAVE' | 'POISON') => {
    if (!editingPlayer || !targetId) return;

    const targetPlayer = players.find(p => p.id === targetId);
    if (!targetPlayer) return;

    let description = '';
    let tagToAdd: PlayerTag | null = null;
    let statusUpdate: Partial<Player> = {};

    switch (type) {
      case 'CHECK_GOOD':
        description = `${editingPlayer.id}号 (预言家) 给 ${targetId}号 发金水`;
        tagToAdd = PlayerTag.JIN_SHUI;
        break;
      case 'CHECK_BAD':
        description = `${editingPlayer.id}号 (预言家) 给 ${targetId}号 发查杀`;
        tagToAdd = PlayerTag.CHA_SHA;
        break;
      case 'SAVE':
        description = `${editingPlayer.id}号 (女巫) 给了 ${targetId}号 银水 (救人)`;
        tagToAdd = PlayerTag.YIN_SHUI;
        break;
      case 'POISON':
        description = `${editingPlayer.id}号 (女巫) 毒死了 ${targetId}号`;
        statusUpdate = { status: PlayerStatus.DEAD };
        break;
    }

    if (tagToAdd) {
       const currentTags = targetPlayer.tags || [];
       if (!currentTags.includes(tagToAdd)) {
           onUpdatePlayer(targetId, { tags: [...currentTags, tagToAdd] });
       }
    }

    if (Object.keys(statusUpdate).length > 0) {
        onUpdatePlayer(targetId, statusUpdate);
    }

    onAddEvent({
      day: currentDay,
      sourceId: editingPlayer.id,
      targetId: targetId,
      type: type === 'POISON' ? 'DEATH' : type === 'CHECK_BAD' ? 'CHECK_BAD' : 'CHECK_GOOD',
      description: description
    });

    setTargetId(null);
  };

  const handleTagToggle = (tag: PlayerTag) => {
    if (!editingPlayer) return;
    const currentTags = editingPlayer.tags || [];
    const newTags = currentTags.includes(tag)
      ? currentTags.filter(t => t !== tag)
      : [...currentTags, tag];
    onUpdatePlayer(editingPlayer.id, { tags: newTags });
  };

  const closeModal = () => {
    setEditingPlayerId(null);
    setTargetId(null);
  };

  // --- Derived State for UI ---
  const isSeer = editingPlayer?.claimedRole === RoleType.SEER;
  const isWitch = editingPlayer?.claimedRole === RoleType.WITCH;
  const showActions = isSeer || isWitch;

  const relatedEvents = editingPlayer ? gameEvents.filter(e => 
    e.sourceId === editingPlayer.id || e.targetId === editingPlayer.id
  ) : [];

  return (
    <>
      {/* Role Dashboard */}
      <div className="flex gap-2 mb-4 text-xs font-medium overflow-x-auto scrollbar-hide">
        <div className={`flex-1 bg-slate-900 border ${wolfStats.claimed > wolfStats.total ? 'border-red-500 text-red-400' : 'border-slate-800 text-slate-400'} rounded-lg p-2 flex flex-col items-center`}>
           <span className="text-[10px] uppercase opacity-70">🐺 狼人</span>
           <span className="text-sm font-bold text-white">
             {wolfStats.claimed} <span className="text-slate-500 text-[10px]">/ {wolfStats.total}</span>
           </span>
        </div>
        <div className={`flex-1 bg-slate-900 border ${godStats.claimed > godStats.total ? 'border-yellow-500 text-yellow-400' : 'border-slate-800 text-slate-400'} rounded-lg p-2 flex flex-col items-center`}>
           <span className="text-[10px] uppercase opacity-70">🔮 神职</span>
           <span className="text-sm font-bold text-white">
             {godStats.claimed} <span className="text-slate-500 text-[10px]">/ {godStats.total}</span>
           </span>
        </div>
        <div className={`flex-1 bg-slate-900 border ${villagerStats.claimed > villagerStats.total ? 'border-emerald-500 text-emerald-400' : 'border-slate-800 text-slate-400'} rounded-lg p-2 flex flex-col items-center`}>
           <span className="text-[10px] uppercase opacity-70">🧑 平民</span>
           <span className="text-sm font-bold text-white">
             {villagerStats.claimed} <span className="text-slate-500 text-[10px]">/ {villagerStats.total}</span>
           </span>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-3 gap-3 pb-20">
        {players.map((player) => {
          const isDead = player.status !== PlayerStatus.ALIVE;
          const roleColor = ROLE_COLORS[player.suspectedRole];
          
          // Logic Update: Show claim for ANY role (including Villager)
          const claimed = player.claimedRole !== RoleType.UNKNOWN;
          
          // Logic Update: Check conflict for ANY role
          let hasConflict = false;
          if (player.claimedRole !== RoleType.UNKNOWN) {
              const stats = getRoleStats(player.claimedRole);
              if (stats.claimed > stats.total) hasConflict = true;
          }

          return (
            <div 
              key={player.id}
              onClick={() => setEditingPlayerId(player.id)}
              className={`
                relative flex flex-col justify-between p-2 rounded-xl border cursor-pointer overflow-hidden
                ${isDead ? 'bg-slate-900/50 border-slate-800 opacity-60' : 'bg-slate-800 border-slate-700 hover:border-slate-500'}
                transition-all duration-200
              `}
              style={{ minHeight: '110px' }}
            >
              {/* Header */}
              <div className="flex justify-between items-start mb-1 relative z-10">
                <span className={`
                  flex items-center justify-center w-7 h-7 rounded-full font-bold text-sm
                  ${player.isMe ? 'bg-blue-600 text-white ring-2 ring-blue-400' : 'bg-slate-700 text-slate-300'}
                  ${player.isSheriff ? 'ring-2 ring-amber-500' : ''}
                `}>
                  {player.id}
                  {player.isSheriff && <span className="absolute -top-1 -right-1 text-xs">👑</span>}
                </span>
                <div className="flex gap-1 items-center">
                  {hasConflict && !isDead && <AlertTriangle size={14} className="text-yellow-500 animate-pulse" />}
                  {player.status === PlayerStatus.DEAD && <Skull size={16} className="text-red-500" />}
                  {player.status === PlayerStatus.EXILED && <XCircle size={16} className="text-orange-500" />}
                </div>
              </div>

              {/* Claim Label (if any) */}
              {claimed && (
                <div className="relative z-10 mb-1">
                    <span className="text-[10px] bg-slate-950 px-1.5 py-0.5 rounded text-slate-400 border border-slate-700 block w-fit">
                        跳 {player.claimedRole}
                    </span>
                </div>
              )}

              {/* Suspected Role (Main Display) */}
              <div className={`relative z-10 text-xs font-medium text-center py-1 px-1 rounded mb-2 truncate ${roleColor}`}>
                {player.suspectedRole}
              </div>

              {/* Tags & Sheriff Status */}
              <div className="relative z-10 flex flex-wrap gap-1 mt-auto min-h-[20px]">
                {player.isSheriff && (
                  <span className="text-[10px] leading-none px-1 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/50">
                    👑 警长
                  </span>
                )}
                {enableSheriff && player.sheriffStatus !== SheriffStatus.NOT_JOINED && !player.isSheriff && (
                  <span className={`text-[10px] leading-none px-1 py-0.5 rounded border ${SHERIFF_STATUS_CONFIG[player.sheriffStatus].color}`}>
                    {SHERIFF_STATUS_CONFIG[player.sheriffStatus].icon} {SHERIFF_STATUS_CONFIG[player.sheriffStatus].label}
                  </span>
                )}
                {player.tags.map(tag => (
                  <span key={tag} className="text-[10px] leading-none px-1 py-0.5 rounded bg-slate-950 text-slate-300 border border-slate-800">
                    {TAG_CONFIG[tag].icon}
                  </span>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Detail Edit Modal */}
      {editingPlayer && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm animate-in fade-in duration-200" onClick={closeModal}>
          <div 
            className="bg-slate-900 w-full max-w-md rounded-t-2xl sm:rounded-2xl border-t sm:border border-slate-700 p-5 space-y-5 animate-in slide-in-from-bottom-10 duration-300 max-h-[90vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <span className="bg-blue-600 w-8 h-8 rounded-full flex items-center justify-center text-sm">{editingPlayer.id}</span>
                号详情
              </h3>
              <button onClick={closeModal} className="p-2 bg-slate-800 rounded-full text-slate-400">
                <X size={20} />
              </button>
            </div>

            {/* Section 1: Status & Identity */}
            <div className="bg-slate-950/50 p-3 rounded-xl border border-slate-800 space-y-3">
                <div className="grid grid-cols-3 gap-2">
                    {[PlayerStatus.ALIVE, PlayerStatus.EXILED, PlayerStatus.DEAD].map(status => (
                    <button
                        key={status}
                        onClick={() => handleStatusChange(status)}
                        className={`
                        py-1.5 px-2 rounded text-xs font-medium border transition-colors
                        ${editingPlayer.status === status
                            ? (status === PlayerStatus.ALIVE ? 'bg-emerald-600/20 border-emerald-500 text-emerald-400' : 'bg-red-600/20 border-red-500 text-red-400')
                            : 'bg-slate-800 border-slate-700 text-slate-400'}
                        `}
                    >
                        {status}
                    </button>
                    ))}
                </div>

                <div className="flex gap-3">
                    <div className="flex-1">
                        <div className="flex justify-between items-end mb-1">
                            <label className="text-[10px] text-slate-500 uppercase">Ta起跳身份 (明)</label>
                            {editingPlayer.claimedRole !== RoleType.UNKNOWN && (
                                <span className="text-[10px] text-slate-400">
                                    {getRoleStats(editingPlayer.claimedRole).claimed} / {getRoleStats(editingPlayer.claimedRole).total}
                                </span>
                            )}
                        </div>
                        <select
                            value={editingPlayer.claimedRole}
                            onChange={(e) => handleRoleClaim(e.target.value as RoleType)}
                            className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1 text-sm text-white outline-none focus:border-blue-500"
                        >
                            {availableRoles.map(role => (
                                <option key={role} value={role}>{role}</option>
                            ))}
                        </select>
                    </div>
                    <div className="flex-1">
                        <label className="text-[10px] text-slate-500 uppercase block mb-1">我认为Ta是 (暗)</label>
                        <select
                             value={editingPlayer.suspectedRole}
                             onChange={(e) => handleLogicRole(e.target.value as RoleType)}
                             className={`w-full border rounded px-2 py-1 text-sm outline-none ${ROLE_COLORS[editingPlayer.suspectedRole]}`}
                        >
                            {availableRoles.map(role => (
                                <option key={role} value={role}>{role}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {/* Section: Sheriff Election */}
            {enableSheriff && editingPlayer.status === PlayerStatus.ALIVE && phase === GamePhase.SHERIFF_ELECTION && (
                <div className="bg-slate-950/50 p-3 rounded-xl border border-slate-800 space-y-3">
                    <h4 className="text-xs font-bold text-amber-400 uppercase flex items-center gap-2">
                        <span>👑</span> 警长竞选
                    </h4>
                    <div className="flex gap-2">
                        {editingPlayer.sheriffStatus === SheriffStatus.NOT_JOINED ? (
                            <button
                                onClick={() => {
                                    onRegisterSheriff?.(editingPlayer.id);
                                    closeModal();
                                }}
                                className="flex-1 py-2 rounded-lg text-xs font-medium bg-yellow-500/20 text-yellow-400 border border-yellow-500/50 hover:bg-yellow-500/30 transition-colors"
                            >
                                🎤 上警
                            </button>
                        ) : editingPlayer.sheriffStatus === SheriffStatus.RUNNING ? (
                            <>
                                <button
                                    onClick={() => {
                                        onWithdrawSheriff?.(editingPlayer.id);
                                        closeModal();
                                    }}
                                    className="flex-1 py-2 rounded-lg text-xs font-medium bg-blue-500/20 text-blue-400 border border-blue-500/50 hover:bg-blue-500/30 transition-colors"
                                >
                                    💧 退水
                                </button>
                                <button
                                    onClick={() => {
                                        onElectSheriff?.(editingPlayer.id);
                                        closeModal();
                                    }}
                                    className="flex-1 py-2 rounded-lg text-xs font-medium bg-amber-500/20 text-amber-400 border border-amber-500/50 hover:bg-amber-500/30 transition-colors"
                                >
                                    👑 当选警长
                                </button>
                            </>
                        ) : (
                            <button
                                onClick={() => {
                                    onRegisterSheriff?.(editingPlayer.id);
                                    closeModal();
                                }}
                                className="flex-1 py-2 rounded-lg text-xs font-medium bg-yellow-500/20 text-yellow-400 border border-yellow-500/50 hover:bg-yellow-500/30 transition-colors"
                            >
                                🎤 重新上警
                            </button>
                        )}
                    </div>
                    {editingPlayer.isSheriff && (
                        <div className="text-center text-xs text-amber-400">
                            👑 当前警长
                        </div>
                    )}
                </div>
            )}

            {/* Section 2: Logic Interactions */}
            {showActions ? (
                <div className="space-y-2">
                    <h4 className="text-xs font-bold text-blue-400 uppercase flex items-center gap-2">
                        <Mic size={12} />
                        {isSeer ? '预言家查验' : '女巫技能'}
                    </h4>
                    <div className="bg-slate-800 rounded-xl p-3 border border-slate-700">
                        {/* Target Selector */}
                        <div className="flex gap-2 overflow-x-auto pb-2 mb-2 scrollbar-hide border-b border-slate-700/50">
                            <span className="text-xs text-slate-400 self-center whitespace-nowrap">对象:</span>
                            {players.filter(p => p.id !== editingPlayer.id).map(p => (
                                <button
                                    key={p.id}
                                    onClick={() => setTargetId(p.id)}
                                    className={`
                                        w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 transition-all
                                        ${targetId === p.id 
                                            ? 'bg-blue-500 text-white ring-2 ring-blue-300 scale-110' 
                                            : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}
                                    `}
                                >
                                    {p.id}
                                </button>
                            ))}
                        </div>

                        {/* Action Buttons based on Role */}
                        <div className="grid grid-cols-2 gap-2">
                            {isSeer && (
                                <>
                                    <button
                                        onClick={() => handleAction('CHECK_GOOD')}
                                        disabled={!targetId}
                                        className={`
                                            flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-bold transition-all
                                            ${targetId 
                                                ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/50 hover:bg-yellow-500/30' 
                                                : 'bg-slate-900 text-slate-600 border border-slate-800 cursor-not-allowed'}
                                        `}
                                    >
                                        <ShieldCheck size={16} /> 发金水
                                    </button>
                                    <button
                                        onClick={() => handleAction('CHECK_BAD')}
                                        disabled={!targetId}
                                        className={`
                                            flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-bold transition-all
                                            ${targetId 
                                                ? 'bg-red-500/20 text-red-400 border border-red-500/50 hover:bg-red-500/30' 
                                                : 'bg-slate-900 text-slate-600 border border-slate-800 cursor-not-allowed'}
                                        `}
                                    >
                                        <Target size={16} /> 发查杀
                                    </button>
                                </>
                            )}
                             {isWitch && (
                                <>
                                    <button
                                        onClick={() => handleAction('SAVE')}
                                        disabled={!targetId}
                                        className={`
                                            flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-bold transition-all
                                            ${targetId 
                                                ? 'bg-slate-200/20 text-slate-200 border border-slate-200/50 hover:bg-slate-200/30' 
                                                : 'bg-slate-900 text-slate-600 border border-slate-800 cursor-not-allowed'}
                                        `}
                                    >
                                        <ShieldCheck size={16} /> 银水 (救)
                                    </button>
                                    <button
                                        onClick={() => handleAction('POISON')}
                                        disabled={!targetId}
                                        className={`
                                            flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-bold transition-all
                                            ${targetId 
                                                ? 'bg-purple-500/20 text-purple-400 border border-purple-500/50 hover:bg-purple-500/30' 
                                                : 'bg-slate-900 text-slate-600 border border-slate-800 cursor-not-allowed'}
                                        `}
                                    >
                                        <FlaskConical size={16} /> 毒药
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            ) : (
                 <div className="bg-slate-800/50 rounded-lg p-3 text-center border border-slate-800 border-dashed">
                    <p className="text-xs text-slate-500">选择 "预言家" 或 "女巫" 身份以解锁技能操作。</p>
                 </div>
            )}

             {/* Section 3: Interaction History */}
             {relatedEvents.length > 0 && (
                 <div className="space-y-2">
                    <h4 className="text-xs font-bold text-slate-400 uppercase flex items-center gap-2">
                        <ArrowRightLeft size={12} />
                        交互记录
                    </h4>
                    <div className="space-y-1 max-h-32 overflow-y-auto">
                        {relatedEvents.filter(e => ['CHECK_GOOD', 'CHECK_BAD', 'CLAIM'].includes(e.type) || e.description.includes('银水') || e.description.includes('毒')).map(e => {
                            const isIncoming = e.targetId === editingPlayer.id;
                            const isOutgoing = e.sourceId === editingPlayer.id;
                            if (!isIncoming && !isOutgoing) return null;

                            return (
                                <div key={e.id} className="text-xs bg-slate-950 p-2 rounded border border-slate-800 flex items-center gap-2">
                                    <span className="text-[10px] text-slate-600 font-mono">D{e.day}</span>
                                    {isIncoming ? (
                                        <>
                                            <span className="text-blue-400 font-bold">{e.sourceId}号</span>
                                            <ArrowRight size={10} className="text-slate-500" />
                                            <span className="text-slate-300">我</span>
                                        </>
                                    ) : (
                                        <>
                                            <span className="text-slate-300">我</span>
                                            {e.targetId ? (
                                                <>
                                                    <ArrowRight size={10} className="text-slate-500" />
                                                    <span className="text-yellow-400 font-bold">{e.targetId}号</span>
                                                </>
                                            ) : (
                                                <span className="text-[10px] px-1.5 py-0.5 bg-slate-800 text-slate-400 rounded ml-1">
                                                    {e.type === 'CLAIM' ? '起跳' : '动作'}
                                                </span>
                                            )}
                                        </>
                                    )}
                                    <span className="text-slate-400 ml-auto truncate max-w-[120px]">
                                        {e.type === 'CLAIM' 
                                            ? e.description.split('：')[1] || e.description 
                                            : e.description.split(' ').slice(2).join(' ')
                                        }
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                 </div>
             )}

            {/* Section 4: Tags & Notes */}
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase mb-2 block">手动标记</label>
              <div className="flex gap-2 mb-3">
                {Object.values(PlayerTag).map(tag => {
                  const isActive = editingPlayer.tags.includes(tag);
                  const config = TAG_CONFIG[tag];
                  return (
                    <button
                      key={tag}
                      onClick={() => handleTagToggle(tag)}
                      className={`
                        flex-1 py-2 rounded-lg border text-xs font-medium transition-all flex flex-col items-center gap-1
                        ${isActive ? config.color : 'bg-slate-800 border-slate-700 text-slate-500 grayscale opacity-70'}
                      `}
                    >
                      <span>{config.icon}</span>
                      <span>{config.label}</span>
                    </button>
                  )
                })}
              </div>
              
              <textarea
                  value={editingPlayer.notes}
                  onChange={(e) => onUpdatePlayer(editingPlayer.id, { notes: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-sm text-white focus:border-blue-500 outline-none"
                  rows={2}
                  placeholder="输入更多备注..."
               />
            </div>

          </div>
        </div>
      )}
    </>
  );
};

export default PlayerGrid;
