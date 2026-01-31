
import React, { useState, useEffect } from 'react';
import { Users, NotebookPen, Settings, Download, FlaskConical, ShieldAlert, ChevronRight, Plus, Minus, Play, RotateCcw, Flag, Sparkles, Bot, X, AlertTriangle } from 'lucide-react';
import PlayerGrid from './components/PlayerGrid';
import GameLogView from './components/NotesView';
import AIChat from './components/AIChat';
import VotingModal from './components/VotingModal';
import { Player, RoleType, PlayerStatus, Tab, GameState, GameEvent, AIConfig, SheriffStatus, GamePhase, VoteType, VoteRecord } from './types';

// Storage Keys
const STORAGE_KEY_PLAYERS = 'wolfpack_players';
const STORAGE_KEY_META = 'wolfpack_meta';
const STORAGE_KEY_LOGS = 'wolfpack_logs';
const STORAGE_KEY_AI_CONFIG = 'wolfpack_ai_config';
const STORAGE_KEY_SETUP_CONFIG = 'wolfpack_setup_config';
const STORAGE_KEY_VOTES = 'wolfpack_votes';

// Default Role Config (Standard 12 players)
const DEFAULT_ROLES: Record<string, number> = {
  [RoleType.WEREWOLF]: 4,
  [RoleType.VILLAGER]: 4,
  [RoleType.SEER]: 1,
  [RoleType.WITCH]: 1,
  [RoleType.HUNTER]: 1,
  [RoleType.IDIOT]: 1,
};

// AI Provider Presets
const AI_PRESETS: Record<string, Partial<AIConfig>> = {
  deepseek: {
    baseUrl: 'https://api.deepseek.com',
    model: 'deepseek-chat'
  },
  kimi: {
    baseUrl: 'https://api.moonshot.cn/v1',
    model: 'moonshot-v1-8k'
  },
  openai: {
    baseUrl: 'https://api.openai.com/v1',
    model: 'gpt-4o-mini'
  }
};

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>(Tab.BOARD);
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);
  const [showAISettings, setShowAISettings] = useState(false);
  const [showEndGameModal, setShowEndGameModal] = useState(false);

  // 投票弹窗状态
  const [showVotingModal, setShowVotingModal] = useState(false);
  const [currentVoteType, setCurrentVoteType] = useState<VoteType>(VoteType.SHERIFF);

  // Load initial setup config
  const getSavedSetup = () => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_SETUP_CONFIG);
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  };
  const savedSetup = getSavedSetup();

  // Game State
  const [players, setPlayers] = useState<Player[]>([]);
  const [gameEvents, setGameEvents] = useState<GameEvent[]>([]);
  const [myId, setMyId] = useState<number>(savedSetup?.myId || 1);
  const [myRole, setMyRole] = useState<RoleType>(savedSetup?.myRole || RoleType.VILLAGER);
  const [isSetupMode, setIsSetupMode] = useState(true);
  
  // Setup State
  const [roleCounts, setRoleCounts] = useState<Record<string, number>>(savedSetup?.roleCounts || DEFAULT_ROLES);
  const [enableSheriff, setEnableSheriff] = useState<boolean>(savedSetup?.enableSheriff ?? true);
  
  // AI Config State (Lazy initialization from LocalStorage)
  const [aiConfig, setAiConfig] = useState<AIConfig>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_AI_CONFIG);
      return saved ? JSON.parse(saved) : {
        provider: 'deepseek',
        apiKey: '',
        baseUrl: 'https://api.deepseek.com',
        model: 'deepseek-chat'
      };
    } catch (e) {
      console.error("Error loading AI config", e);
      return {
        provider: 'deepseek',
        apiKey: '',
        baseUrl: 'https://api.deepseek.com',
        model: 'deepseek-chat'
      };
    }
  });

  const [gameState, setGameState] = useState<GameState>({
    currentDay: 1,
    witchAntidoteUsed: false,
    witchPoisonUsed: false,
    guardLastProtectedId: null,
    hunterGunStatus: true,
    roleCounts: DEFAULT_ROLES,
    phase: GamePhase.SETUP,
    enableSheriff: true,
    sheriffId: null
  });

  // 投票记录状态
  const [votes, setVotes] = useState<VoteRecord[]>([]);

  // Derived state for Setup
  const totalPlayers = Object.values(roleCounts).reduce((a, b) => a + b, 0);

  // 1. Load Data (Game Progress)
  useEffect(() => {
    const savedPlayers = localStorage.getItem(STORAGE_KEY_PLAYERS);
    const savedMeta = localStorage.getItem(STORAGE_KEY_META);
    const savedLogs = localStorage.getItem(STORAGE_KEY_LOGS);

    if (savedPlayers && savedMeta) {
      try {
        const meta = JSON.parse(savedMeta);
        setPlayers(JSON.parse(savedPlayers));
        setMyId(meta.myId);
        setMyRole(meta.myRole);
        
        const loadedGameState = meta.gameState || {
          currentDay: 1,
          witchAntidoteUsed: false,
          witchPoisonUsed: false,
          roleCounts: DEFAULT_ROLES,
          phase: GamePhase.DAY_DISCUSSION,
          enableSheriff: false,
          sheriffId: null
        };
        setGameState(loadedGameState);
        
        // Sync roleCounts state with the loaded game so setup matches if we restart
        if (loadedGameState.roleCounts) {
            setRoleCounts(loadedGameState.roleCounts);
        }

        if (savedLogs) setGameEvents(JSON.parse(savedLogs));

        // Load votes
        const savedVotes = localStorage.getItem(STORAGE_KEY_VOTES);
        if (savedVotes) setVotes(JSON.parse(savedVotes));

        setIsSetupMode(false);
      } catch (e) {
        console.error("Error loading save", e);
      }
    }
  }, []);

  // 2. Save Data (Active Game)
  useEffect(() => {
    if (!isSetupMode && players.length > 0) {
      localStorage.setItem(STORAGE_KEY_PLAYERS, JSON.stringify(players));
      localStorage.setItem(STORAGE_KEY_LOGS, JSON.stringify(gameEvents));
      localStorage.setItem(STORAGE_KEY_VOTES, JSON.stringify(votes));
      localStorage.setItem(STORAGE_KEY_META, JSON.stringify({
        myId,
        myRole,
        gameState
      }));
    }
  }, [players, myId, myRole, isSetupMode, gameState, gameEvents, votes]);

  // 3. Save AI Config (Persist immediately on change)
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_AI_CONFIG, JSON.stringify(aiConfig));
  }, [aiConfig]);

  // 4. Save Setup Config (Persistent Preferences)
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_SETUP_CONFIG, JSON.stringify({
      roleCounts,
      myId,
      myRole,
      enableSheriff
    }));
  }, [roleCounts, myId, myRole, enableSheriff]);

  const initGame = () => {
    const initialPlayers: Player[] = Array.from({ length: totalPlayers }, (_, i) => ({
      id: i + 1,
      status: PlayerStatus.ALIVE,
      suspectedRole: (i + 1) === myId ? myRole : RoleType.UNKNOWN,
      claimedRole: RoleType.UNKNOWN,
      notes: '',
      tags: [],
      isMe: (i + 1) === myId,
      sheriffStatus: SheriffStatus.NOT_JOINED,
      isSheriff: false
    }));
    setPlayers(initialPlayers);
    setGameEvents([]);
    setVotes([]);

    // 判断是否开启上警功能
    const initialPhase = enableSheriff ? GamePhase.SHERIFF_ELECTION : GamePhase.DAY_DISCUSSION;

    setGameState({
        currentDay: 1,
        witchAntidoteUsed: false,
        witchPoisonUsed: false,
        guardLastProtectedId: null,
        hunterGunStatus: true,
        roleCounts: roleCounts,
        phase: initialPhase,
        enableSheriff,
        sheriffId: null
    });
    setIsSetupMode(false);
    setShowSettingsMenu(false);

    // 添加上警阶段事件
    if (enableSheriff) {
      addGameEvent({
        day: 1,
        sourceId: 0,
        type: 'NOTE',
        description: '--- 警长竞选阶段 ---'
      });
    }
  };

  const updatePlayer = (id: number, updates: Partial<Player>) => {
    setPlayers(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
  };

  const addGameEvent = (event: Omit<GameEvent, 'id' | 'timestamp'>) => {
      const newEvent: GameEvent = {
          ...event,
          id: Math.random().toString(36).substring(2, 9),
          timestamp: Date.now()
      };
      setGameEvents(prev => [...prev, newEvent]);
  };

  const deleteGameEvent = (id: string) => {
      setGameEvents(prev => prev.filter(e => e.id !== id));
  };

  const nextDay = () => {
      setGameState(prev => ({ ...prev, currentDay: prev.currentDay + 1 }));
      addGameEvent({
          day: gameState.currentDay + 1,
          sourceId: 0,
          type: 'NOTE',
          description: `--- 进入第 ${gameState.currentDay + 1} 天 ---`
      });
  };

  const exportData = () => {
    const data = {
      date: new Date().toLocaleString(),
      myRole,
      myId,
      gameState,
      players,
      events: gameEvents
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `wolfpack-game-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    setShowSettingsMenu(false);
  };

  const requestEndGame = () => {
    setShowSettingsMenu(false);
    setShowEndGameModal(true);
  };

  const confirmEndGame = () => {
    localStorage.removeItem(STORAGE_KEY_PLAYERS);
    localStorage.removeItem(STORAGE_KEY_META);
    localStorage.removeItem(STORAGE_KEY_LOGS);
    localStorage.removeItem(STORAGE_KEY_VOTES);

    // Explicitly clear state
    setPlayers([]);
    setGameEvents([]);
    setVotes([]);

    // Note: We do NOT remove STORAGE_KEY_SETUP_CONFIG or STORAGE_KEY_AI_CONFIG
    // State variables (roleCounts, etc.) retain their current values (which match the game we just ended)
    setIsSetupMode(true);
    setShowEndGameModal(false);
  };

  const handleAIProviderChange = (provider: string) => {
     if (AI_PRESETS[provider]) {
         setAiConfig(prev => ({
             ...prev,
             provider: provider as any,
             baseUrl: AI_PRESETS[provider].baseUrl || '',
             model: AI_PRESETS[provider].model || ''
         }));
     } else {
         setAiConfig(prev => ({ ...prev, provider: 'custom' }));
     }
  };

  // Setup Helpers
  const updateRoleCount = (role: string, delta: number) => {
    setRoleCounts(prev => {
      const current = prev[role] || 0;
      const next = Math.max(0, current + delta);
      return { ...prev, [role]: next };
    });
  };

  const applyPreset = () => {
    setRoleCounts(DEFAULT_ROLES);
  };

  // ==================== 上警与投票功能 ====================

  // 上警报名
  const registerSheriff = (playerId: number) => {
    const player = players.find(p => p.id === playerId);
    if (!player || player.status !== PlayerStatus.ALIVE) return;

    updatePlayer(playerId, { sheriffStatus: SheriffStatus.RUNNING });
    addGameEvent({
      day: gameState.currentDay,
      sourceId: playerId,
      type: 'SHERIFF_REGISTER',
      description: `${playerId}号玩家上警`
    });
  };

  // 退水
  const withdrawSheriff = (playerId: number) => {
    const player = players.find(p => p.id === playerId);
    if (!player || player.sheriffStatus !== SheriffStatus.RUNNING) return;

    updatePlayer(playerId, { sheriffStatus: SheriffStatus.WITHDRAWN });
    addGameEvent({
      day: gameState.currentDay,
      sourceId: playerId,
      type: 'SHERIFF_WITHDRAW',
      description: `${playerId}号玩家退水`
    });
  };

  // 当选警长
  const electSheriff = (playerId: number) => {
    // 清除之前的警长
    const currentSheriff = players.find(p => p.isSheriff);
    if (currentSheriff) {
      updatePlayer(currentSheriff.id, { isSheriff: false });
    }

    updatePlayer(playerId, { isSheriff: true });
    setGameState(prev => ({ ...prev, sheriffId: playerId }));
    addGameEvent({
      day: gameState.currentDay,
      sourceId: playerId,
      type: 'SHERIFF_ELECTED',
      description: `${playerId}号玩家当选警长`
    });
  };

  // 提交投票（批量）
  const submitVote = (voterIds: number[], targetId: number, voteType: VoteType) => {
    const eventType = voteType === VoteType.SHERIFF ? 'SHERIFF_VOTE' : 'DAY_VOTE';
    const voteTypeLabel = voteType === VoteType.SHERIFF ? '警长投票' : '放逐投票';

    // 批量处理投票
    voterIds.forEach(voterId => {
      // 检查是否已投票
      const existingVote = votes.find(v =>
        v.day === gameState.currentDay &&
        v.voteType === voteType &&
        v.voterId === voterId
      );

      if (existingVote) {
        // 更新投票
        setVotes(prev => prev.map(v =>
          v.id === existingVote.id
            ? { ...v, targetId, timestamp: Date.now() }
            : v
        ));
      } else {
        // 新增投票
        const newVote: VoteRecord = {
          id: Math.random().toString(36).substring(2, 9),
          day: gameState.currentDay,
          voteType,
          voterId,
          targetId,
          timestamp: Date.now()
        };
        setVotes(prev => [...prev, newVote]);
      }
    });

    // 记录批量事件（合并显示）
    const votersStr = voterIds.join('、');
    addGameEvent({
      day: gameState.currentDay,
      sourceId: voterIds[0], // 用第一个投票人作为sourceId
      targetId,
      type: eventType,
      description: `${voteTypeLabel}: ${votersStr}号 → ${targetId}号`
    });
  };

  // 计算投票结果
  const calculateVoteResult = (voteType: VoteType, day: number): Map<number, number> => {
    const dayVotes = votes.filter(v => v.day === day && v.voteType === voteType);
    const voteCount = new Map<number, number>();

    // 初始化
    players.forEach(p => {
      if (p.status === PlayerStatus.ALIVE) {
        voteCount.set(p.id, 0);
      }
    });

    // 统计票数
    dayVotes.forEach(vote => {
      const current = voteCount.get(vote.targetId) || 0;
      let weight = 1;

      // 放逐投票时，警长有1.5票
      if (voteType === VoteType.EXILE) {
        const voter = players.find(p => p.id === vote.voterId);
        if (voter?.isSheriff) {
          weight = 1.5;
        }
      }

      voteCount.set(vote.targetId, current + weight);
    });

    return voteCount;
  };

  // 获取某玩家在某天的投票
  const getPlayerVote = (playerId: number, voteType: VoteType, day: number): number | null => {
    const vote = votes.find(v =>
      v.day === day &&
      v.voteType === voteType &&
      v.voterId === playerId
    );
    return vote?.targetId ?? null;
  };

  // 清除某天的投票
  const clearVotes = (voteType: VoteType, day: number) => {
    setVotes(prev => prev.filter(v => !(v.day === day && v.voteType === voteType)));
  };

  // 阶段切换
  const advancePhase = () => {
    const { phase, enableSheriff } = gameState;

    switch (phase) {
      case GamePhase.SHERIFF_ELECTION:
        setGameState(prev => ({ ...prev, phase: GamePhase.DAY_DISCUSSION }));
        addGameEvent({
          day: gameState.currentDay,
          sourceId: 0,
          type: 'NOTE',
          description: '--- 警长竞选结束，进入白天讨论 ---'
        });
        break;
      case GamePhase.DAY_DISCUSSION:
        setGameState(prev => ({ ...prev, phase: GamePhase.DAY_VOTE }));
        break;
      case GamePhase.DAY_VOTE:
        setGameState(prev => ({ ...prev, phase: GamePhase.NIGHT }));
        break;
      case GamePhase.NIGHT:
        const nextDay = gameState.currentDay + 1;
        // 只有第一天有警长竞选
        const nextPhase = (enableSheriff && nextDay === 1)
          ? GamePhase.SHERIFF_ELECTION
          : GamePhase.DAY_DISCUSSION;

        setGameState(prev => ({
          ...prev,
          currentDay: nextDay,
          phase: nextPhase
        }));
        addGameEvent({
          day: nextDay,
          sourceId: 0,
          type: 'NOTE',
          description: `--- 进入第 ${nextDay} 天 ---`
        });
        // 只有第一天显示警长竞选阶段
        if (enableSheriff && nextDay === 1) {
          addGameEvent({
            day: nextDay,
            sourceId: 0,
            type: 'NOTE',
            description: '--- 警长竞选阶段 ---'
          });
        }
        break;
    }
  };

  // 打开投票弹窗
  const openVotingModal = (voteType: VoteType) => {
    setCurrentVoteType(voteType);
    setShowVotingModal(true);
  };

  // 清空当前投票
  const handleClearVotes = () => {
    clearVotes(currentVoteType, gameState.currentDay);
  };

  // 完成投票
  const handleCompleteVoting = () => {
    setShowVotingModal(false);

    // 如果是警长竞选投票，自动设置警长
    if (currentVoteType === VoteType.SHERIFF) {
      const results = calculateVoteResult(VoteType.SHERIFF, gameState.currentDay);
      let maxVotes = 0;
      let winner: number | null = null;

      results.forEach((count, playerId) => {
        if (count > maxVotes) {
          maxVotes = count;
          winner = playerId;
        }
      });

      if (winner) {
        electSheriff(winner);
      }
    }

    // 进入下一阶段
    advancePhase();
  };

  if (isSetupMode) {
     return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="w-full max-w-lg space-y-6 pb-10">
          <div className="text-center">
            <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-600 mb-2">WolfPack</h1>
            <p className="text-slate-400">狼人杀辅助工具</p>
          </div>
          
          <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-2xl space-y-6">
             {/* Section 1: Role Config */}
             <div className="space-y-4">
                <div className="flex justify-between items-center">
                    <h2 className="text-sm font-bold text-slate-300 uppercase tracking-wide">1. 配置板子</h2>
                    <button onClick={applyPreset} className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1">
                        <RotateCcw size={12} /> 恢复标准12人
                    </button>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                    {/* Main Factions */}
                    <div className="col-span-2 grid grid-cols-2 gap-3">
                         <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex justify-between items-center">
                            <span className="text-red-400 font-bold flex items-center gap-2">🐺 狼人</span>
                            <div className="flex items-center gap-3 bg-slate-800 rounded-lg px-1">
                                <button onClick={() => updateRoleCount(RoleType.WEREWOLF, -1)} className="p-1 text-slate-400 hover:text-white"><Minus size={14}/></button>
                                <span className="text-white font-bold w-4 text-center">{roleCounts[RoleType.WEREWOLF] || 0}</span>
                                <button onClick={() => updateRoleCount(RoleType.WEREWOLF, 1)} className="p-1 text-slate-400 hover:text-white"><Plus size={14}/></button>
                            </div>
                         </div>
                         <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex justify-between items-center">
                            <span className="text-emerald-400 font-bold flex items-center gap-2">🧑 平民</span>
                            <div className="flex items-center gap-3 bg-slate-800 rounded-lg px-1">
                                <button onClick={() => updateRoleCount(RoleType.VILLAGER, -1)} className="p-1 text-slate-400 hover:text-white"><Minus size={14}/></button>
                                <span className="text-white font-bold w-4 text-center">{roleCounts[RoleType.VILLAGER] || 0}</span>
                                <button onClick={() => updateRoleCount(RoleType.VILLAGER, 1)} className="p-1 text-slate-400 hover:text-white"><Plus size={14}/></button>
                            </div>
                         </div>
                    </div>

                    {/* Gods and Specials */}
                    {[RoleType.SEER, RoleType.WITCH, RoleType.HUNTER, RoleType.GUARD, RoleType.IDIOT, RoleType.KNIGHT, RoleType.WOLF_KING].map(role => (
                        <div key={role} className="bg-slate-950 px-3 py-2 rounded-xl border border-slate-800 flex justify-between items-center">
                            <span className="text-slate-300 text-sm">{role}</span>
                             <div className="flex items-center gap-2 bg-slate-800 rounded-lg px-1">
                                <button onClick={() => updateRoleCount(role, -1)} className="p-1 text-slate-500 hover:text-white"><Minus size={12}/></button>
                                <span className={`text-sm font-bold w-3 text-center ${roleCounts[role] > 0 ? 'text-blue-400' : 'text-slate-600'}`}>{roleCounts[role] || 0}</span>
                                <button onClick={() => updateRoleCount(role, 1)} className="p-1 text-slate-500 hover:text-white"><Plus size={12}/></button>
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
                        onClick={() => setEnableSheriff(!enableSheriff)}
                        className={`w-12 h-6 rounded-full transition-colors relative ${enableSheriff ? 'bg-blue-600' : 'bg-slate-700'}`}
                    >
                        <span className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${enableSheriff ? 'translate-x-7' : 'translate-x-1'}`} />
                    </button>
                </div>
             </div>

             {/* Section 2: My Info */}
             <div className="space-y-4 border-t border-slate-800 pt-4">
                <h2 className="text-sm font-bold text-slate-300 uppercase tracking-wide">2. 我的信息</h2>
                
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-medium text-slate-500 mb-1">我的号码</label>
                        <select value={myId} onChange={(e) => setMyId(Number(e.target.value))} className="w-full bg-slate-950 border border-slate-700 text-white p-2 rounded-lg focus:border-blue-500 outline-none">
                            {Array.from({ length: totalPlayers }, (_, i) => i + 1).map(num => <option key={num} value={num}>{num} 号</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-slate-500 mb-1">我的底牌</label>
                         <select value={myRole} onChange={(e) => setMyRole(e.target.value as RoleType)} className="w-full bg-slate-950 border border-slate-700 text-white p-2 rounded-lg focus:border-blue-500 outline-none">
                            {Object.values(RoleType).filter(r => r !== RoleType.UNKNOWN).map((role) => (
                                <option key={role} value={role}>{role}</option>
                            ))}
                        </select>
                    </div>
                </div>
             </div>
            
            <div className="space-y-3 pt-2">
                 <button 
                    onClick={initGame} 
                    disabled={totalPlayers < 6}
                    className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold rounded-xl shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-blue-500/20 transition-all"
                >
                    <Play size={20} fill="currentColor" /> 开始游戏
                </button>
                
                <div className="flex justify-center">
                     <button 
                        onClick={() => setShowAISettings(true)} 
                        className="text-xs text-slate-500 hover:text-blue-400 flex items-center gap-1 transition-colors"
                    >
                        <Bot size={12} />
                        配置 AI 服务
                    </button>
                </div>
            </div>
          </div>
        </div>

        {/* AI Settings Modal (Available in Setup Mode too) */}
        {showAISettings && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
                <div className="bg-slate-900 w-full max-w-md rounded-2xl border border-slate-700 shadow-2xl p-6 space-y-5 animate-in slide-in-from-bottom-10">
                    <div className="flex justify-between items-center">
                        <h3 className="text-xl font-bold text-white flex items-center gap-2"><Bot size={20} className="text-blue-400" /> AI 军师配置</h3>
                        <button onClick={() => setShowAISettings(false)} className="p-1 hover:bg-slate-800 rounded-full"><X size={20} className="text-slate-400"/></button>
                    </div>
                    
                    <div className="space-y-4">
                        <div>
                            <label className="text-xs text-slate-400 font-bold uppercase mb-2 block">选择提供商</label>
                            <div className="grid grid-cols-3 gap-2">
                                {['deepseek', 'kimi', 'openai', 'custom'].map(p => (
                                    <button 
                                        key={p}
                                        onClick={() => handleAIProviderChange(p)}
                                        className={`py-2 text-sm font-medium rounded-lg border capitalize transition-all ${aiConfig.provider === p ? 'bg-blue-600 border-blue-500 text-white' : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600'}`}
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
                                    onChange={(e) => setAiConfig(prev => ({...prev, apiKey: e.target.value}))}
                                    placeholder="sk-..."
                                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:border-blue-500 outline-none font-mono"
                                />
                            </div>
                            <div>
                                <label className="text-xs text-slate-500 block mb-1">Base URL (接口地址)</label>
                                <input 
                                    type="text" 
                                    value={aiConfig.baseUrl}
                                    onChange={(e) => setAiConfig(prev => ({...prev, baseUrl: e.target.value}))}
                                    placeholder="https://api.example.com/v1"
                                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:border-blue-500 outline-none font-mono"
                                />
                            </div>
                             <div>
                                <label className="text-xs text-slate-500 block mb-1">Model Name (模型名称)</label>
                                <input 
                                    type="text" 
                                    value={aiConfig.model}
                                    onChange={(e) => setAiConfig(prev => ({...prev, model: e.target.value}))}
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
                        onClick={() => setShowAISettings(false)}
                        className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl border border-slate-700 transition-colors"
                    >
                        关闭
                    </button>
                </div>
            </div>
        )}
      </div>
     );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans selection:bg-blue-500/30">
      
      {/* Top Bar */}
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
                  {gameState.phase === GamePhase.SHERIFF_ELECTION && (
                    <span className="text-[10px] text-amber-400">👑 上警</span>
                  )}
                  {gameState.phase === GamePhase.DAY_VOTE && (
                    <span className="text-[10px] text-red-400">🗳️ 投票</span>
                  )}
                  {gameState.phase === GamePhase.NIGHT && (
                    <span className="text-[10px] text-purple-400">🌙 夜晚</span>
                  )}
               </div>
             </div>
          </div>
          <div className="relative">
            <button 
                onClick={() => setShowSettingsMenu(!showSettingsMenu)} 
                className={`p-2 rounded-full border transition-all ${showSettingsMenu ? 'bg-blue-900/50 text-blue-400 border-blue-800' : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'}`}
            >
                <Settings size={18} />
            </button>
            
            {/* Dropdown Menu */}
            {showSettingsMenu && (
                <div className="absolute right-0 top-full mt-2 w-48 bg-slate-900 border border-slate-800 rounded-xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 origin-top-right z-50">
                    <button onClick={() => { setShowAISettings(true); setShowSettingsMenu(false); }} className="w-full text-left px-4 py-3 text-sm text-slate-300 hover:bg-slate-800 flex items-center gap-2">
                        <Bot size={16} className="text-blue-400" /> AI 设置
                    </button>
                    <button onClick={exportData} className="w-full text-left px-4 py-3 text-sm text-slate-300 hover:bg-slate-800 flex items-center gap-2 border-t border-slate-800">
                        <Download size={16} /> 导出数据
                    </button>
                    <button onClick={requestEndGame} className="w-full text-left px-4 py-3 text-sm text-red-400 hover:bg-red-950/30 border-t border-slate-800 flex items-center gap-2">
                        <Flag size={16} /> 结束本局
                    </button>
                </div>
            )}
          </div>
        </div>
        
        {/* Quick Status Toggles */}
        <div className="flex gap-2 overflow-x-auto scrollbar-hide py-1">
          <button onClick={() => setGameState(p => ({...p, witchAntidoteUsed: !p.witchAntidoteUsed}))} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all whitespace-nowrap ${gameState.witchAntidoteUsed ? 'bg-slate-900 text-slate-500 border-slate-800 line-through opacity-60' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'}`}>
            <FlaskConical size={12} /> 解药
          </button>
          <button onClick={() => setGameState(p => ({...p, witchPoisonUsed: !p.witchPoisonUsed}))} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all whitespace-nowrap ${gameState.witchPoisonUsed ? 'bg-slate-900 text-slate-500 border-slate-800 line-through opacity-60' : 'bg-purple-500/10 text-purple-400 border-purple-500/30'}`}>
             <FlaskConical size={12} /> 毒药
          </button>
          <button onClick={() => setGameState(p => ({...p, hunterGunStatus: !p.hunterGunStatus}))} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all whitespace-nowrap ${!gameState.hunterGunStatus ? 'bg-slate-900 text-slate-500 border-slate-800 opacity-60' : 'bg-orange-500/10 text-orange-400 border-orange-500/30'}`}>
             <ShieldAlert size={12} /> 猎枪
          </button>

          {/* 投票按钮 */}
          {gameState.phase === GamePhase.SHERIFF_ELECTION && gameState.enableSheriff && (
            <button
              onClick={() => openVotingModal(VoteType.SHERIFF)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all whitespace-nowrap bg-amber-500/10 text-amber-400 border-amber-500/30 hover:bg-amber-500/20"
            >
              <span>👑</span> 警长投票
            </button>
          )}
          {gameState.phase === GamePhase.DAY_VOTE && (
            <button
              onClick={() => openVotingModal(VoteType.EXILE)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all whitespace-nowrap bg-red-500/10 text-red-400 border-red-500/30 hover:bg-red-500/20"
            >
              <span>🗳️</span> 放逐投票
            </button>
          )}

          {/* 阶段控制按钮 */}
          {gameState.phase !== GamePhase.DAY_VOTE && (
            <button
              onClick={advancePhase}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all whitespace-nowrap bg-blue-500/10 text-blue-400 border-blue-500/30 hover:bg-blue-500/20"
            >
              <ChevronRight size={12} /> 下一阶段
            </button>
          )}
        </div>
      </header>
      
      {/* Settings Overlay Backdrop */}
      {showSettingsMenu && (
          <div className="fixed inset-0 z-20 bg-transparent" onClick={() => setShowSettingsMenu(false)} />
      )}

       {/* AI Settings Modal */}
       {showAISettings && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
            <div className="bg-slate-900 w-full max-w-md rounded-2xl border border-slate-700 shadow-2xl p-6 space-y-5 animate-in slide-in-from-bottom-10">
                <div className="flex justify-between items-center">
                    <h3 className="text-xl font-bold text-white flex items-center gap-2"><Bot size={20} className="text-blue-400" /> AI 军师配置</h3>
                    <button onClick={() => setShowAISettings(false)} className="p-1 hover:bg-slate-800 rounded-full"><X size={20} className="text-slate-400"/></button>
                </div>
                
                <div className="space-y-4">
                    <div>
                        <label className="text-xs text-slate-400 font-bold uppercase mb-2 block">选择提供商</label>
                        <div className="grid grid-cols-3 gap-2">
                            {['deepseek', 'kimi', 'openai', 'custom'].map(p => (
                                <button 
                                    key={p}
                                    onClick={() => handleAIProviderChange(p)}
                                    className={`py-2 text-sm font-medium rounded-lg border capitalize transition-all ${aiConfig.provider === p ? 'bg-blue-600 border-blue-500 text-white' : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600'}`}
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
                                onChange={(e) => setAiConfig(prev => ({...prev, apiKey: e.target.value}))}
                                placeholder="sk-..."
                                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:border-blue-500 outline-none font-mono"
                            />
                        </div>
                        <div>
                            <label className="text-xs text-slate-500 block mb-1">Base URL (接口地址)</label>
                            <input 
                                type="text" 
                                value={aiConfig.baseUrl}
                                onChange={(e) => setAiConfig(prev => ({...prev, baseUrl: e.target.value}))}
                                placeholder="https://api.example.com/v1"
                                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:border-blue-500 outline-none font-mono"
                            />
                        </div>
                         <div>
                            <label className="text-xs text-slate-500 block mb-1">Model Name (模型名称)</label>
                            <input 
                                type="text" 
                                value={aiConfig.model}
                                onChange={(e) => setAiConfig(prev => ({...prev, model: e.target.value}))}
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
                    onClick={() => setShowAISettings(false)}
                    className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl border border-slate-700 transition-colors"
                >
                    关闭
                </button>
            </div>
        </div>
       )}

       {/* Voting Modal */}
       {showVotingModal && (
        <VotingModal
          isOpen={showVotingModal}
          onClose={() => setShowVotingModal(false)}
          voteType={currentVoteType}
          players={players}
          currentDay={gameState.currentDay}
          votes={votes}
          sheriffId={gameState.sheriffId}
          onSubmitVote={(voterIds, targetId) => submitVote(voterIds, targetId, currentVoteType)}
          onClearVotes={handleClearVotes}
          onCompleteVoting={handleCompleteVoting}
        />
       )}

       {/* End Game Confirmation Modal */}
       {showEndGameModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
            <div className="bg-slate-900 w-full max-w-sm rounded-2xl border border-slate-700 shadow-2xl p-6 space-y-5 animate-in zoom-in-95">
                <div className="flex flex-col items-center text-center space-y-3">
                    <div className="w-12 h-12 rounded-full bg-red-900/30 flex items-center justify-center">
                        <AlertTriangle size={24} className="text-red-500" />
                    </div>
                    <h3 className="text-lg font-bold text-white">结束本局游戏？</h3>
                    <p className="text-sm text-slate-400">
                        当前的所有游戏记录（标记、笔记、AI对话）将被清空。<br/>
                        <span className="text-slate-500 text-xs">(下一局将保留当前的角色板子配置)</span>
                    </p>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                    <button 
                        onClick={() => setShowEndGameModal(false)}
                        className="py-3 rounded-xl font-medium text-slate-300 hover:bg-slate-800 transition-colors"
                    >
                        取消
                    </button>
                    <button 
                        onClick={confirmEndGame}
                        className="py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl shadow-lg shadow-red-900/20 transition-colors"
                    >
                        确认结束
                    </button>
                </div>
            </div>
        </div>
       )}

      <main className="p-4 max-w-2xl mx-auto min-h-[calc(100vh-180px)]">
        {activeTab === Tab.BOARD && (
          <PlayerGrid
            players={players}
            currentDay={gameState.currentDay}
            roleCounts={gameState.roleCounts || DEFAULT_ROLES}
            onUpdatePlayer={updatePlayer}
            onAddEvent={addGameEvent}
            gameEvents={gameEvents}
            phase={gameState.phase}
            enableSheriff={gameState.enableSheriff}
            onRegisterSheriff={registerSheriff}
            onWithdrawSheriff={withdrawSheriff}
            onElectSheriff={electSheriff}
          />
        )}
        {activeTab === Tab.TIMELINE && (
          <GameLogView events={gameEvents} onDeleteEvent={deleteGameEvent} />
        )}
        {activeTab === Tab.CHAT && (
          <AIChat 
            myRole={myRole} 
            players={players} 
            events={gameEvents} 
            aiConfig={aiConfig}
            onOpenSettings={() => setShowAISettings(true)}
          />
        )}
      </main>

      <nav className="fixed bottom-0 w-full bg-slate-900 border-t border-slate-800 pb-safe pt-2 z-20 safe-area-bottom">
        <div className="max-w-2xl mx-auto flex justify-around items-center px-2 pb-2">
          <NavButton active={activeTab === Tab.BOARD} onClick={() => setActiveTab(Tab.BOARD)} icon={<Users size={24} />} label="局势" />
          <NavButton active={activeTab === Tab.TIMELINE} onClick={() => setActiveTab(Tab.TIMELINE)} icon={<NotebookPen size={24} />} label="复盘日志" />
          <NavButton active={activeTab === Tab.CHAT} onClick={() => setActiveTab(Tab.CHAT)} icon={<Sparkles size={24} />} label="AI 军师" />
        </div>
      </nav>
    </div>
  );
};

const NavButton: React.FC<{ active: boolean; onClick: () => void; icon: React.ReactNode; label: string; highlight?: boolean }> = ({ active, onClick, icon, label, highlight }) => (
  <button onClick={onClick} className={`flex flex-col items-center justify-center p-2 w-full transition-all duration-200 relative ${active ? 'text-blue-400' : 'text-slate-500 hover:text-slate-300'}`}>
    {highlight && !active && <span className="absolute top-2 right-8 w-2 h-2 bg-blue-500 rounded-full animate-ping" />}
    <div className={`${active ? 'transform scale-110' : ''} mb-1`}>{icon}</div>
    <span className="text-[10px] font-medium tracking-wide">{label}</span>
  </button>
);

export default App;
