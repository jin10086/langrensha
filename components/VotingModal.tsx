
import React, { useState, useMemo } from 'react';
import { Player, PlayerStatus, VoteType, VoteRecord } from '../types';
import { X, CheckCircle2, Scale } from 'lucide-react';

interface VotingModalProps {
  isOpen: boolean;
  onClose: () => void;
  voteType: VoteType;
  players: Player[];
  currentDay: number;
  votes: VoteRecord[];
  sheriffId: number | null;
  onSubmitVote: (voterIds: number[], targetId: number) => void;
  onClearVotes: () => void;
  onCompleteVoting: () => void;
}

const VotingModal: React.FC<VotingModalProps> = ({
  isOpen,
  onClose,
  voteType,
  players,
  currentDay,
  votes,
  sheriffId,
  onSubmitVote,
  onClearVotes,
  onCompleteVoting
}) => {
  const [selectedVoters, setSelectedVoters] = useState<number[]>([]);
  const [selectedTarget, setSelectedTarget] = useState<number | null>(null);

  // 获取当前投票类型的投票记录
  const currentVotes = useMemo(() => {
    return votes.filter(v => v.day === currentDay && v.voteType === voteType);
  }, [votes, currentDay, voteType]);

  // 计算投票结果
  const voteResults = useMemo(() => {
    const results = new Map<number, number>();

    // 初始化所有存活玩家
    players.forEach(p => {
      if (p.status === PlayerStatus.ALIVE) {
        results.set(p.id, 0);
      }
    });

    // 统计票数
    currentVotes.forEach(vote => {
      const current = results.get(vote.targetId) || 0;
      let weight = 1;

      // 放逐投票时，警长有1.5票
      if (voteType === VoteType.EXILE) {
        const voter = players.find(p => p.id === vote.voterId);
        if (voter?.isSheriff) {
          weight = 1.5;
        }
      }

      results.set(vote.targetId, current + weight);
    });

    return results;
  }, [currentVotes, players, voteType]);

  // 获取已投票的玩家
  const votedVoters = useMemo(() => {
    return new Set(currentVotes.map(v => v.voterId));
  }, [currentVotes]);

  // 获取某玩家的投票目标
  const getVoterTarget = (voterId: number): number | null => {
    const vote = currentVotes.find(v => v.voterId === voterId);
    return vote?.targetId ?? null;
  };

  // 确定可投票人
  const eligibleVoters = useMemo(() => {
    return players.filter(p => {
      if (p.status !== PlayerStatus.ALIVE) return false;

      if (voteType === VoteType.SHERIFF) {
        // 警长竞选投票：只有警下玩家可以投票
        return p.sheriffStatus === '未上警';
      }

      return true;
    });
  }, [players, voteType]);

  // 确定可被投人
  const eligibleTargets = useMemo(() => {
    return players.filter(p => {
      if (p.status !== PlayerStatus.ALIVE) return false;

      if (voteType === VoteType.SHERIFF) {
        // 警长竞选：只能投给警上玩家
        return p.sheriffStatus === '警上';
      }

      return true;
    });
  }, [players, voteType]);

  // 提交投票
  const handleSubmit = () => {
    if (selectedVoters.length > 0 && selectedTarget) {
      // 批量提交投票（传递数组）
      onSubmitVote(selectedVoters, selectedTarget);
      setSelectedVoters([]);
      setSelectedTarget(null);
    }
  };

  // 切换投票人选择（多选）
  const handleVoterToggle = (voterId: number) => {
    setSelectedVoters(prev => {
      const isSelected = prev.includes(voterId);
      if (isSelected) {
        return prev.filter(id => id !== voterId);
      } else {
        return [...prev, voterId];
      }
    });
  };

  // 全选未投票的玩家
  const selectAllUnvoted = () => {
    const unvotedVoters = eligibleVoters
      .filter(v => !votedVoters.has(v.id))
      .map(v => v.id);
    setSelectedVoters(unvotedVoters);
  };

  // 清空选择
  const clearSelection = () => {
    setSelectedVoters([]);
    setSelectedTarget(null);
  };

  // 获取最高票数
  const maxVotes = useMemo(() => {
    let max = 0;
    voteResults.forEach((count) => {
      if (count > max) max = count;
    });
    return max;
  }, [voteResults]);

  // 获取获胜者（可能有多个）
  const winners = useMemo(() => {
    if (maxVotes === 0) return [];
    const result: number[] = [];
    voteResults.forEach((count, playerId) => {
      if (count === maxVotes) {
        result.push(playerId);
      }
    });
    return result;
  }, [voteResults, maxVotes]);

  if (!isOpen) return null;

  const isSheriffVote = voteType === VoteType.SHERIFF;
  const title = isSheriffVote ? '警长竞选投票' : '放逐投票';
  const subtitle = isSheriffVote
    ? '警下玩家给警上玩家投票'
    : `所有存活玩家投票${sheriffId ? ' (警长1.5票)' : ''}`;

  const unvotedCount = eligibleVoters.length - votedVoters.size;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 w-full max-w-md rounded-t-2xl sm:rounded-2xl border-t sm:border border-slate-700 p-5 space-y-5 animate-in slide-in-from-bottom-10 duration-300 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <Scale size={20} className="text-blue-400" />
              {title}
            </h3>
            <p className="text-xs text-slate-500 mt-1">{subtitle}</p>
          </div>
          <button onClick={onClose} className="p-2 bg-slate-800 rounded-full text-slate-400 hover:text-white">
            <X size={20} />
          </button>
        </div>

        {/* Vote Results Summary */}
        {currentVotes.length > 0 && (
          <div className="bg-slate-950/50 p-3 rounded-xl border border-slate-800">
            <h4 className="text-xs font-bold text-slate-400 uppercase mb-2">当前票数统计</h4>
            <div className="flex flex-wrap gap-2">
              {Array.from(voteResults.entries())
                .filter(([_, count]) => count > 0)
                .sort((a, b) => b[1] - a[1])
                .map(([playerId, count]) => (
                  <div
                    key={playerId}
                    className={`flex items-center gap-1.5 px-2 py-1 rounded-lg border text-xs ${
                      winners.includes(playerId)
                        ? 'bg-amber-500/20 border-amber-500/50 text-amber-400'
                        : 'bg-slate-800 border-slate-700 text-slate-300'
                    }`}
                  >
                    <span className="font-bold">{playerId}号</span>
                    <span className="text-slate-500">|</span>
                    <span>{count} 票</span>
                    {winners.includes(playerId) && <span className="text-amber-400">👑</span>}
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Voter Selection */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <h4 className="text-xs font-bold text-slate-400 uppercase">
              {isSheriffVote ? '警下玩家 (投票人)' : '投票人'}
              <span className="text-slate-600 ml-1">
                {votedVoters.size}/{eligibleVoters.length} 已投票
              </span>
              {selectedVoters.length > 0 && (
                <span className="text-blue-400 ml-1">(已选{selectedVoters.length}人)</span>
              )}
            </h4>
            {unvotedCount > 0 && (
              <div className="flex gap-1">
                <button
                  onClick={selectAllUnvoted}
                  className="text-[10px] px-2 py-1 rounded bg-slate-800 text-slate-400 hover:text-white transition-colors"
                >
                  全选未投票
                </button>
                {selectedVoters.length > 0 && (
                  <button
                    onClick={clearSelection}
                    className="text-[10px] px-2 py-1 rounded bg-slate-800 text-slate-400 hover:text-white transition-colors"
                  >
                    清空选择
                  </button>
                )}
              </div>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {eligibleVoters.map(voter => {
              const hasVoted = votedVoters.has(voter.id);
              const votedTarget = getVoterTarget(voter.id);
              const isSelected = selectedVoters.includes(voter.id);

              return (
                <button
                  key={voter.id}
                  onClick={() => !hasVoted && handleVoterToggle(voter.id)}
                  disabled={hasVoted}
                  className={`
                    relative w-12 h-12 rounded-xl flex flex-col items-center justify-center text-sm font-bold transition-all
                    ${hasVoted
                      ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/50 cursor-default'
                      : isSelected
                        ? 'bg-blue-600 text-white ring-2 ring-blue-400'
                        : 'bg-slate-800 text-slate-300 border border-slate-700 hover:border-slate-500'}
                  `}
                >
                  <span>{voter.id}</span>
                  {hasVoted && votedTarget && (
                    <span className="text-[8px] opacity-70">→{votedTarget}</span>
                  )}
                  {hasVoted && (
                    <CheckCircle2 size={10} className="absolute -top-1 -right-1 text-emerald-400" />
                  )}
                  {isSelected && !hasVoted && (
                    <span className="absolute -top-1 -right-1 w-3 h-3 bg-blue-400 rounded-full flex items-center justify-center">
                      <span className="text-[8px] text-white">✓</span>
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Target Selection */}
        {selectedVoters.length > 0 && (
          <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
            <h4 className="text-xs font-bold text-slate-400 uppercase">
              选择投票对象
              <span className="text-slate-600 ml-1">(多选投票人可批量投票)</span>
            </h4>
            <div className="flex flex-wrap gap-2">
              {eligibleTargets.map(target => (
                <button
                  key={target.id}
                  onClick={() => setSelectedTarget(target.id)}
                  disabled={selectedVoters.includes(target.id)} // 不能自投
                  className={`
                    w-12 h-12 rounded-xl flex items-center justify-center text-sm font-bold transition-all
                    ${selectedVoters.includes(target.id)
                      ? 'bg-slate-800 text-slate-600 cursor-not-allowed'
                      : selectedTarget === target.id
                        ? 'bg-yellow-500 text-white ring-2 ring-yellow-300 scale-110'
                        : 'bg-slate-800 text-slate-300 border border-slate-700 hover:border-yellow-500/50'}
                  `}
                >
                  {target.id}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-2 pt-2">
          {selectedVoters.length > 0 && selectedTarget ? (
            // 有选中投票人时：只显示确认投票按钮
            <button
              onClick={handleSubmit}
              className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold rounded-xl shadow-lg hover:shadow-blue-500/20 transition-all"
            >
              确认投票: {selectedVoters.join('号、')}号 → {selectedTarget}号
            </button>
          ) : (
            // 没有选择投票人时：显示操作按钮（结束投票）
            <div className="flex gap-2">
              <button
                onClick={onClearVotes}
                disabled={currentVotes.length === 0}
                className="flex-1 py-2 bg-slate-800 text-slate-400 font-medium rounded-xl border border-slate-700 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                清空投票
              </button>
              <button
                onClick={onCompleteVoting}
                className="flex-1 py-2 bg-emerald-600/20 text-emerald-400 font-medium rounded-xl border border-emerald-500/50 hover:bg-emerald-600/30 transition-colors"
              >
                结束投票
              </button>
            </div>
          )}
        </div>

        {/* Sheriff Note */}
        {voteType === VoteType.EXILE && sheriffId && (
          <div className="text-center text-xs text-amber-400/70 bg-amber-500/10 p-2 rounded-lg">
            👑 {sheriffId}号 警长拥有 1.5 票归票权
          </div>
        )}
      </div>
    </div>
  );
};

export default VotingModal;
