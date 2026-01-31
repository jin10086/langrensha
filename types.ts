
export enum RoleType {
  WEREWOLF = '狼人',
  WOLF_KING = '狼王',
  VILLAGER = '平民',
  SEER = '预言家',
  WITCH = '女巫',
  HUNTER = '猎人',
  GUARD = '守卫',
  IDIOT = '白痴',
  KNIGHT = '骑士',
  UNKNOWN = '未知/待定',
}

export enum PlayerStatus {
  ALIVE = '存活',
  DEAD = '死亡',
  EXILED = '放逐',
}

export enum PlayerTag {
  JIN_SHUI = '金水', // Verified Good (Gold Water)
  CHA_SHA = '查杀', // Verified Bad (Check Kill)
  YIN_SHUI = '银水', // Saved by Witch (Silver Water)
  KANG_TUI = '抗推', // Push target
}

export enum SheriffStatus {
  NOT_JOINED = '未上警',
  RUNNING = '警上',
  WITHDRAWN = '已退水',
}

export enum GamePhase {
  SETUP = 'SETUP',
  SHERIFF_ELECTION = 'SHERIFF_ELECTION',
  DAY_DISCUSSION = 'DAY_DISCUSSION',
  DAY_VOTE = 'DAY_VOTE',
  NIGHT = 'NIGHT',
}

export enum VoteType {
  SHERIFF = 'SHERIFF',
  EXILE = 'EXILE',
}

export interface Player {
  id: number;
  status: PlayerStatus;
  suspectedRole: RoleType; // What I think they are
  claimedRole: RoleType;   // What they say they are
  tags: PlayerTag[];
  notes: string;
  isMe: boolean;
  sheriffStatus: SheriffStatus;
  isSheriff: boolean;
}

export interface GameState {
  currentDay: number;
  witchAntidoteUsed: boolean;
  witchPoisonUsed: boolean;
  guardLastProtectedId: number | null;
  hunterGunStatus: boolean;
  roleCounts: Record<string, number>; // Stores the initial configuration (e.g., { '狼人': 4, '预言家': 1 })
  phase: GamePhase;
  enableSheriff: boolean;
  sheriffId: number | null;
}

export interface GameEvent {
  id: string;
  day: number;
  sourceId: number; // Who spoke/acted
  targetId?: number; // Who was affected (optional)
  type: 'CLAIM' | 'CHECK_GOOD' | 'CHECK_BAD' | 'VOTE' | 'DEATH' | 'NOTE'
    | 'SHERIFF_REGISTER' | 'SHERIFF_WITHDRAW' | 'SHERIFF_ELECTED' | 'SHERIFF_VOTE' | 'DAY_VOTE';
  description: string;
  timestamp: number;
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  timestamp: number;
}

export interface AIConfig {
  provider: 'deepseek' | 'kimi' | 'openai' | 'custom';
  apiKey: string;
  baseUrl: string;
  model: string;
}

export enum Tab {
  BOARD = 'board',
  TIMELINE = 'timeline', // Renamed from NOTES
  CHAT = 'chat',
  SETTINGS = 'settings',
}

export const ROLE_COLORS: Record<RoleType, string> = {
  [RoleType.WEREWOLF]: 'bg-red-600/20 text-red-400 border-red-600/50',
  [RoleType.WOLF_KING]: 'bg-red-800/20 text-red-500 border-red-700/50',
  [RoleType.VILLAGER]: 'bg-emerald-600/20 text-emerald-400 border-emerald-600/50',
  [RoleType.SEER]: 'bg-fuchsia-600/20 text-fuchsia-400 border-fuchsia-600/50',
  [RoleType.WITCH]: 'bg-purple-600/20 text-purple-400 border-purple-600/50',
  [RoleType.HUNTER]: 'bg-orange-600/20 text-orange-400 border-orange-600/50',
  [RoleType.GUARD]: 'bg-blue-600/20 text-blue-400 border-blue-600/50',
  [RoleType.IDIOT]: 'bg-yellow-600/20 text-yellow-400 border-yellow-600/50',
  [RoleType.KNIGHT]: 'bg-indigo-600/20 text-indigo-400 border-indigo-600/50',
  [RoleType.UNKNOWN]: 'bg-slate-800 text-slate-400 border-slate-700',
};

export const TAG_CONFIG: Record<PlayerTag, { color: string, icon: string, label: string }> = {
  [PlayerTag.JIN_SHUI]: { color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50', icon: '💧', label: '金水' },
  [PlayerTag.CHA_SHA]: { color: 'bg-red-500/20 text-red-400 border-red-500/50', icon: '❌', label: '查杀' },
  [PlayerTag.YIN_SHUI]: { color: 'bg-slate-200/20 text-slate-300 border-slate-400/50', icon: '🛡️', label: '银水' },
  [PlayerTag.KANG_TUI]: { color: 'bg-orange-500/20 text-orange-300 border-orange-400/50', icon: '🎯', label: '抗推' },
};

export const SHERIFF_STATUS_CONFIG: Record<SheriffStatus, { icon: string; color: string; label: string }> = {
  [SheriffStatus.NOT_JOINED]: { icon: '', color: '', label: '' },
  [SheriffStatus.RUNNING]: { icon: '🎤', color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50', label: '警上' },
  [SheriffStatus.WITHDRAWN]: { icon: '💧', color: 'bg-blue-500/20 text-blue-400 border-blue-500/50', label: '退水' },
};

export const SHERIFF_BADGE = { icon: '👑', color: 'bg-amber-500 text-amber-900', label: '警长' };

// 新增投票记录接口
export interface VoteRecord {
  id: string;
  day: number;
  voteType: VoteType;
  voterId: number;
  targetId: number;
  timestamp: number;
}
