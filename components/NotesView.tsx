
import React, { useRef, useEffect } from 'react';
import { GameEvent } from '../types';
import { Trash2 } from 'lucide-react';

interface GameLogViewProps {
  events: GameEvent[];
  onDeleteEvent: (id: string) => void;
}

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
            {eventsByDay[day].map(event => (
              <div key={event.id} className="bg-slate-900 p-3 rounded-lg border border-slate-800 flex justify-between items-start group">
                <div>
                  <div className="text-sm text-slate-200">
                    <span className="font-bold text-blue-300">{event.sourceId}号 </span>
                    {event.targetId && (
                         <>
                            对 <span className="font-bold text-yellow-300">{event.targetId}号 </span>
                         </>
                    )}
                    <span className={
                        event.type === 'CHECK_BAD' ? 'text-red-400' : 
                        event.type === 'CHECK_GOOD' ? 'text-emerald-400' : 
                        event.type === 'DEATH' ? 'text-slate-500' : 'text-slate-300'
                    }>
                        {event.description.replace(/^\d+号玩家.*：|^\d+号玩家给 \d+号 /, '')}
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-600 mt-1">
                    {new Date(event.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                  </div>
                </div>
                <button 
                    onClick={() => onDeleteEvent(event.id)}
                    className="text-slate-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                    <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>
      ))}
      <div ref={bottomRef} />
    </div>
  );
};

export default GameLogView;
