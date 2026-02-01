import { useState, useEffect, useCallback } from 'react';
import { AIConfig } from '../../types';
import { AI_PRESETS } from '../constants/game';
import { STORAGE_KEY_AI_CONFIG } from '../constants/storage';

const DEFAULT_AI_CONFIG: AIConfig = {
  provider: 'deepseek',
  apiKey: '',
  baseUrl: 'https://api.deepseek.com',
  model: 'deepseek-chat'
};

export function useAIConfig() {
  // 懒加载初始化
  const [aiConfig, setAiConfig] = useState<AIConfig>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_AI_CONFIG);
      return saved ? JSON.parse(saved) : DEFAULT_AI_CONFIG;
    } catch (e) {
      console.error('Error loading AI config:', e);
      return DEFAULT_AI_CONFIG;
    }
  });

  // 自动持久化
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_AI_CONFIG, JSON.stringify(aiConfig));
  }, [aiConfig]);

  // 处理AI提供商切换
  const handleAIProviderChange = useCallback((provider: string) => {
    if (AI_PRESETS[provider]) {
      setAiConfig(prev => ({
        ...prev,
        provider: provider as AIConfig['provider'],
        baseUrl: AI_PRESETS[provider].baseUrl || '',
        model: AI_PRESETS[provider].model || ''
      }));
    } else {
      setAiConfig(prev => ({ ...prev, provider: 'custom' as const }));
    }
  }, []);

  // 更新单个字段
  const updateAIConfig = useCallback((updates: Partial<AIConfig>) => {
    setAiConfig(prev => ({ ...prev, ...updates }));
  }, []);

  return {
    aiConfig,
    setAiConfig,
    updateAIConfig,
    handleAIProviderChange
  };
}

export default useAIConfig;
