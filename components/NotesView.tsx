
import React, { useRef, useEffect } from 'react';
import { GameEvent } from '../types';
import { Trash2, Gavel, Crown, MessageSquare, Skull, Shield, CheckCircle, XCircle, HelpCircle, Vote } from 'lucide-react';

interface GameLogViewProps {
  events: GameEvent[];
  onDeleteEvent: (id: string) => void;
}

// 获取事件类型图标
const getEventIcon = (type: GameEvent['type']) => {
  switch (type) {
    case 'SHERIFF_VOTE': return <Crown size={14} className="text-amber-400" />;
    case 'DAY_VOTE': return <Gavel size={14} className="text-red-400" />;
    case 'SHERIFF_ELECTED': return <Crown size={14} className="text-amber-400" />;
    case 'SHERIFF_REGISTER': return <Vote size={14} className="text-yellow-400" />;
    case 'SHERIFF_WITHDRAW': return <XCircle size={14} className="text-blue-400" />;
    case 'CHECK_GOOD': return <CheckCircle size={14} className="text-emerald-400" />;
    case 'CHECK_BAD': return <XCircle size={14} className="text-red-400" />;
    case 'DEATH': return <Skull size={14} className="text-slate-500" />;
    case 'CLAIM': return <MessageSquare size={14} className="text-blue-400" />;
    default: return <HelpCircle size={14} className="text-slate-500" />;
  }
};

// 获取事件类型标签
const getEventTypeLabel = (type: GameEvent['type']) => {
  switch (type) {
    case 'SHERIFF_VOTE': return '警长投票';
    case 'DAY_VOTE': return '放逐投票';
    case 'SHERIFF_ELECTED': return '当选警长';
    case 'SHERIFF_REGISTER': return '上警';
    case 'SHERIFF_WITHDRAW': return '退水';
    case 'CHECK_GOOD': return '金水';
    case 'CHECK_BAD': return '查杀';
    case 'DEATH': return '死亡';
    case 'CLAIM': return '起跳';
    default: return '';
  }
};

// 获取事件颜色
const getEventColor = (type: GameEvent['type']) => {
  switch (type) {
    case 'SHERIFF_VOTE': return 'text-yellow-300';
    case 'DAY_VOTE': return 'text-red-300';
    case 'SHERIFF_ELECTED': return 'text-amber-400 font-bold';
    case 'SHERIFF_REGISTER': return 'text-yellow-400';
    case 'SHERIFF_WITHDRAW': return 'text-blue-400';
    case 'CHECK_GOOD': return 'text-emerald-400';
    case 'CHECK_BAD': return 'text-red-400';
    case 'DEATH': return 'text-slate-500';
    case 'CLAIM': return 'text-blue-300';
    default: return 'text-slate-300';
  }
};

const GameLogView: React.FC<GameLogViewProps> = ({ events, onDeleteEvent }) => {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
     // Optional: auto-scroll to bottom when new events add
     // bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [events.length]);

  // Group events by day
  const eventsByDay = events.reduce((acc, event) => {
    if (!acc[event.day]) acc[event.day] = [];
    acc[event.day].push(event);
    return acc;
  }, {} as Record<number, GameEvent[]>);

  const sortedDays = Object.keys(eventsByDay).map(Number).sort((a, b) => a - b);

  // 渲染投票事件描述
  const renderVoteDescription = (event: GameEvent) => {
    // 新的批量投票格式: "警长投票: 1、2、3号 → 4号"
    if (event.description.includes('号 → ')) {
      return <span className={getEventColor(event.type)}>{event.description}</span>;
    }
    // 旧格式兼容
    return <span className={getEventColor(event.type)}>{event.description}</span>;
  };

  return (
    <div className="space-y-6 pb-20 animate-in fade-in">
      <h2 className="text-xl font-bold text-slate-200 mb-4 flex items-center gap-2">
         <span>📜</span> 局势复盘 (Timeline)
      </h2>

      {events.length === 0 && (
          <div className="text-center text-slate-500 py-10">
              暂无记录。在主界面点击玩家头像，使用动作按钮添加记录。
          </div>
      )}

      {sortedDays.map(day => (
        <div key={day} className="relative border-l-2 border-slate-800 ml-3 pl-6 space-y-4">
          <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-blue-600 border-4 border-slate-950"></div>
          <h3 className="text-sm font-bold text-blue-400 uppercase tracking-widest">第 {day} 天</h3>

          <div className="space-y-2">
            {eventsByDay[day].map(event => {
              const isVoteEvent = event.type === 'SHERIFF_VOTE' || event.type === 'DAY_VOTE';
              const typeLabel = getEventTypeLabel(event.type);

              return (
                <div key={event.id} className="bg-slate-900 p-3 rounded-lg border border-slate-800 flex justify-between items-start group">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      {getEventIcon(event.type)}
                      {typeLabel && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                          {typeLabel}
                        </span>
                      )}
                      <span className="text-[10px] text-slate-600">
                        {new Date(event.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </span>
                    </div>
                    <div className="text-sm text-slate-200">
                      {isVoteEvent ? (
                        // 投票事件显示
                        renderVoteDescription(event)
                      ) : event.targetId ? (
                        // 有目标的事件
                        <>
                          <span className="font-bold text-blue-300">{event.sourceId}号 </span>
                          对 <span className="font-bold text-yellow-300">{event.targetId}号 </span>
                          <span className={getEventColor(event.type)}>
                            {event.description.replace(/^\d+号玩家.*：|^\d+号玩家给 \d+号 /, '')}
                          </span>
                        </>
                      ) : (
                        // 无目标的事件
                        <span className={getEventColor(event.type)}>
                          {event.description}
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                      onClick={() => onDeleteEvent(event.id)}
                      className="text-slate-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity ml-2"
                  >
                      <Trash2 size={14} />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      ))}
      <div ref={bottomRef} />
    </div>
  );
};

export default GameLogView;
