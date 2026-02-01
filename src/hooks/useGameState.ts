import { useState, useEffect, useCallback } from 'react';
import {
  Player, PlayerStatus, RoleType, GameState, GameEvent,
  SheriffStatus, GamePhase, VoteType, VoteRecord
} from '../../types';
import { DEFAULT_ROLES } from '../constants/game';
import {
  STORAGE_KEY_PLAYERS, STORAGE_KEY_META, STORAGE_KEY_LOGS, STORAGE_KEY_VOTES
} from '../constants/storage';

interface UseGameStateOptions {
  myId: number;
  myRole: RoleType;
  roleCounts: Record<string, number>;
  enableSheriff: boolean;
}

export function useGameState(options: UseGameStateOptions) {
  const { myId, myRole, roleCounts, enableSheriff } = options;

  // ==================== 状态定义 ====================
  const [players, setPlayers] = useState<Player[]>([]);
  const [gameEvents, setGameEvents] = useState<GameEvent[]>([]);
  const [votes, setVotes] = useState<VoteRecord[]>([]);
  const [isSetupMode, setIsSetupMode] = useState(true);
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

  // ==================== 数据加载 ====================
  useEffect(() => {
    const savedPlayers = localStorage.getItem(STORAGE_KEY_PLAYERS);
    const savedMeta = localStorage.getItem(STORAGE_KEY_META);
    const savedLogs = localStorage.getItem(STORAGE_KEY_LOGS);

    if (savedPlayers && savedMeta) {
      try {
        const meta = JSON.parse(savedMeta);
        setPlayers(JSON.parse(savedPlayers));

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

        if (savedLogs) setGameEvents(JSON.parse(savedLogs));

        const savedVotes = localStorage.getItem(STORAGE_KEY_VOTES);
        if (savedVotes) setVotes(JSON.parse(savedVotes));

        setIsSetupMode(false);
      } catch (e) {
        console.error('Error loading save:', e);
      }
    }
  }, []);

  // ==================== 数据持久化 ====================
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

  // ==================== 游戏操作 ====================

  // 初始化游戏
  const initGame = useCallback(() => {
    const totalPlayers = Object.values(roleCounts).reduce((a, b) => a + b, 0);
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

    const initialPhase = enableSheriff ? GamePhase.SHERIFF_ELECTION : GamePhase.DAY_DISCUSSION;

    setGameState({
      currentDay: 1,
      witchAntidoteUsed: false,
      witchPoisonUsed: false,
      guardLastProtectedId: null,
      hunterGunStatus: true,
      roleCounts,
      phase: initialPhase,
      enableSheriff,
      sheriffId: null
    });
    setIsSetupMode(false);

    if (enableSheriff) {
      addGameEvent({
        day: 1,
        sourceId: 0,
        type: 'NOTE',
        description: '--- 警长竞选阶段 ---'
      });
    }
  }, [myId, myRole, roleCounts, enableSheriff]);

  // 更新玩家
  const updatePlayer = useCallback((id: number, updates: Partial<Player>) => {
    setPlayers(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
  }, []);

  // 添加游戏事件
  const addGameEvent = useCallback((event: Omit<GameEvent, 'id' | 'timestamp'>) => {
    const newEvent: GameEvent = {
      ...event,
      id: Math.random().toString(36).substring(2, 9),
      timestamp: Date.now()
    };
    setGameEvents(prev => [...prev, newEvent]);
  }, []);

  // 删除游戏事件
  const deleteGameEvent = useCallback((id: string) => {
    setGameEvents(prev => prev.filter(e => e.id !== id));
  }, []);

  // 进入下一天
  const nextDay = useCallback(() => {
    setGameState(prev => ({ ...prev, currentDay: prev.currentDay + 1 }));
    addGameEvent({
      day: gameState.currentDay + 1,
      sourceId: 0,
      type: 'NOTE',
      description: `--- 进入第 ${gameState.currentDay + 1} 天 ---`
    });
  }, [gameState.currentDay, addGameEvent]);

  // ==================== 上警功能 ====================

  // 上警报名
  const registerSheriff = useCallback((playerId: number) => {
    const player = players.find(p => p.id === playerId);
    if (!player || player.status !== PlayerStatus.ALIVE) return;

    updatePlayer(playerId, { sheriffStatus: SheriffStatus.RUNNING });
    addGameEvent({
      day: gameState.currentDay,
      sourceId: playerId,
      type: 'SHERIFF_REGISTER',
      description: `${playerId}号玩家上警`
    });
  }, [players, gameState.currentDay, updatePlayer, addGameEvent]);

  // 退水
  const withdrawSheriff = useCallback((playerId: number) => {
    const player = players.find(p => p.id === playerId);
    if (!player || player.sheriffStatus !== SheriffStatus.RUNNING) return;

    updatePlayer(playerId, { sheriffStatus: SheriffStatus.WITHDRAWN });
    addGameEvent({
      day: gameState.currentDay,
      sourceId: playerId,
      type: 'SHERIFF_WITHDRAW',
      description: `${playerId}号玩家退水`
    });
  }, [players, gameState.currentDay, updatePlayer, addGameEvent]);

  // 当选警长
  const electSheriff = useCallback((playerId: number) => {
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
  }, [players, gameState.currentDay, updatePlayer, addGameEvent]);

  // ==================== 投票功能 ====================

  // 提交投票
  const submitVote = useCallback((voterIds: number[], targetId: number, voteType: VoteType) => {
    const eventType = voteType === VoteType.SHERIFF ? 'SHERIFF_VOTE' : 'DAY_VOTE';
    const voteTypeLabel = voteType === VoteType.SHERIFF ? '警长投票' : '放逐投票';

    voterIds.forEach(voterId => {
      const existingVote = votes.find(v =>
        v.day === gameState.currentDay &&
        v.voteType === voteType &&
        v.voterId === voterId
      );

      if (existingVote) {
        setVotes(prev => prev.map(v =>
          v.id === existingVote.id
            ? { ...v, targetId, timestamp: Date.now() }
            : v
        ));
      } else {
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

    const votersStr = voterIds.join('、');
    addGameEvent({
      day: gameState.currentDay,
      sourceId: voterIds[0],
      targetId,
      type: eventType,
      description: `${voteTypeLabel}: ${votersStr}号 → ${targetId}号`
    });
  }, [votes, gameState.currentDay, addGameEvent]);

  // 计算投票结果
  const calculateVoteResult = useCallback((voteType: VoteType, day: number): Map<number, number> => {
    const dayVotes = votes.filter(v => v.day === day && v.voteType === voteType);
    const voteCount = new Map<number, number>();

    players.forEach(p => {
      if (p.status === PlayerStatus.ALIVE) {
        voteCount.set(p.id, 0);
      }
    });

    dayVotes.forEach(vote => {
      const current = voteCount.get(vote.targetId) || 0;
      let weight = 1;

      if (voteType === VoteType.EXILE) {
        const voter = players.find(p => p.id === vote.voterId);
        if (voter?.isSheriff) {
          weight = 1.5;
        }
      }

      voteCount.set(vote.targetId, current + weight);
    });

    return voteCount;
  }, [votes, players]);

  // 获取玩家投票
  const getPlayerVote = useCallback((playerId: number, voteType: VoteType, day: number): number | null => {
    const vote = votes.find(v =>
      v.day === day &&
      v.voteType === voteType &&
      v.voterId === playerId
    );
    return vote?.targetId ?? null;
  }, [votes]);

  // 清除投票
  const clearVotes = useCallback((voteType: VoteType, day: number) => {
    setVotes(prev => prev.filter(v => !(v.day === day && v.voteType === voteType)));
  }, []);

  // ==================== 阶段控制 ====================

  const advancePhase = useCallback(() => {
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
  }, [gameState, addGameEvent]);

  // ==================== 结束游戏 ====================

  const confirmEndGame = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY_PLAYERS);
    localStorage.removeItem(STORAGE_KEY_META);
    localStorage.removeItem(STORAGE_KEY_LOGS);
    localStorage.removeItem(STORAGE_KEY_VOTES);

    setPlayers([]);
    setGameEvents([]);
    setVotes([]);
    setIsSetupMode(true);
  }, []);

  // ==================== 导出数据 ====================

  const exportData = useCallback(() => {
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
  }, [myRole, myId, gameState, players, gameEvents]);

  // ==================== 游戏状态更新 ====================

  const setGameStateField = useCallback(<K extends keyof GameState>(
    field: K,
    value: GameState[K]
  ) => {
    setGameState(prev => ({ ...prev, [field]: value }));
  }, []);

  const toggleGameStateField = useCallback((field: 'witchAntidoteUsed' | 'witchPoisonUsed' | 'hunterGunStatus') => {
    setGameState(prev => ({ ...prev, [field]: !prev[field] }));
  }, []);

  return {
    // 状态
    players,
    gameEvents,
    votes,
    isSetupMode,
    gameState,

    // 游戏操作
    initGame,
    updatePlayer,
    addGameEvent,
    deleteGameEvent,
    nextDay,

    // 上警功能
    registerSheriff,
    withdrawSheriff,
    electSheriff,

    // 投票功能
    submitVote,
    calculateVoteResult,
    getPlayerVote,
    clearVotes,

    // 阶段控制
    advancePhase,

    // 结束游戏
    confirmEndGame,

    // 导出数据
    exportData,

    // 状态更新
    setGameStateField,
    toggleGameStateField
  };
}

export default useGameState;
