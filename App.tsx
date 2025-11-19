
import React, { useState, useEffect } from 'react';
import { Users, NotebookPen, Settings, Download, FlaskConical, ShieldAlert, ChevronRight, Plus, Minus, Play, RotateCcw, Flag, Sparkles, Bot, X, AlertTriangle } from 'lucide-react';
import PlayerGrid from './components/PlayerGrid';
import GameLogView from './components/NotesView';
import AIChat from './components/AIChat';
import { Player, RoleType, PlayerStatus, Tab, GameState, GameEvent, AIConfig } from './types';

// Storage Keys
const STORAGE_KEY_PLAYERS = 'wolfpack_players';
const STORAGE_KEY_META = 'wolfpack_meta';
const STORAGE_KEY_LOGS = 'wolfpack_logs';
const STORAGE_KEY_AI_CONFIG = 'wolfpack_ai_config';
const STORAGE_KEY_SETUP_CONFIG = 'wolfpack_setup_config';

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
    roleCounts: DEFAULT_ROLES
  });

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
          roleCounts: DEFAULT_ROLES 
        };
        setGameState(loadedGameState);
        
        // Sync roleCounts state with the loaded game so setup matches if we restart
        if (loadedGameState.roleCounts) {
            setRoleCounts(loadedGameState.roleCounts);
        }

        if (savedLogs) setGameEvents(JSON.parse(savedLogs));
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
      localStorage.setItem(STORAGE_KEY_META, JSON.stringify({
        myId,
        myRole,
        gameState
      }));
    }
  }, [players, myId, myRole, isSetupMode, gameState, gameEvents]);

  // 3. Save AI Config (Persist immediately on change)
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_AI_CONFIG, JSON.stringify(aiConfig));
  }, [aiConfig]);

  // 4. Save Setup Config (Persistent Preferences)
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_SETUP_CONFIG, JSON.stringify({
      roleCounts,
      myId,
      myRole
    }));
  }, [roleCounts, myId, myRole]);

  const initGame = () => {
    const initialPlayers: Player[] = Array.from({ length: totalPlayers }, (_, i) => ({
      id: i + 1,
      status: PlayerStatus.ALIVE,
      suspectedRole: (i + 1) === myId ? myRole : RoleType.UNKNOWN,
      claimedRole: RoleType.UNKNOWN,
      notes: '',
      tags: [],
      isMe: (i + 1) === myId
    }));
    setPlayers(initialPlayers);
    setGameEvents([]);
    setGameState({
        currentDay: 1,
        witchAntidoteUsed: false,
        witchPoisonUsed: false,
        guardLastProtectedId: null,
        hunterGunStatus: true,
        roleCounts: roleCounts, // Save the config into the game state
    });
    setIsSetupMode(false);
    setShowSettingsMenu(false);
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
    
    // Explicitly clear state
    setPlayers([]);
    setGameEvents([]);
    
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
                  <button onClick={nextDay} className="bg-slate-800 px-2 py-0.5 rounded hover:bg-slate-700 text-xs border border-slate-700 flex items-center gap-1 transition-colors">
                     <ChevronRight size={12} /> 下一天
                  </button>
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
