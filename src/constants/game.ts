import { RoleType, AIConfig } from '../../types';

// 默认角色配置（标准12人局）
export const DEFAULT_ROLES: Record<string, number> = {
  [RoleType.WEREWOLF]: 4,
  [RoleType.VILLAGER]: 4,
  [RoleType.SEER]: 1,
  [RoleType.WITCH]: 1,
  [RoleType.HUNTER]: 1,
  [RoleType.IDIOT]: 1,
};

// AI提供商预设配置
export const AI_PRESETS: Record<string, Partial<AIConfig>> = {
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

// AI提供商列表
export const AI_PROVIDERS = ['deepseek', 'kimi', 'openai', 'custom'] as const;
