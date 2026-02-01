import { useState, useEffect, useCallback } from 'react';
import { RoleType } from '../../types';
import { DEFAULT_ROLES } from '../constants/game';
import { STORAGE_KEY_SETUP_CONFIG } from '../constants/storage';

interface SetupConfig {
  roleCounts: Record<string, number>;
  myId: number;
  myRole: RoleType;
  enableSheriff: boolean;
}

const DEFAULT_SETUP_CONFIG: SetupConfig = {
  roleCounts: DEFAULT_ROLES,
  myId: 1,
  myRole: RoleType.VILLAGER,
  enableSheriff: true
};

export function useSetupConfig() {
  // 懒加载初始化
  const [config, setConfig] = useState<SetupConfig>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_SETUP_CONFIG);
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          ...DEFAULT_SETUP_CONFIG,
          ...parsed
        };
      }
    } catch (e) {
      console.error('Error loading setup config:', e);
    }
    return DEFAULT_SETUP_CONFIG;
  });

  // 自动持久化
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_SETUP_CONFIG, JSON.stringify(config));
  }, [config]);

  // 更新角色数量
  const updateRoleCount = useCallback((role: string, delta: number) => {
    setConfig(prev => {
      const current = prev.roleCounts[role] || 0;
      const next = Math.max(0, current + delta);
      return {
        ...prev,
        roleCounts: { ...prev.roleCounts, [role]: next }
      };
    });
  }, []);

  // 应用预设配置
  const applyPreset = useCallback(() => {
    setConfig(prev => ({
      ...prev,
      roleCounts: DEFAULT_ROLES
    }));
  }, []);

  // 设置我的ID
  const setMyId = useCallback((myId: number) => {
    setConfig(prev => ({ ...prev, myId }));
  }, []);

  // 设置我的角色
  const setMyRole = useCallback((myRole: RoleType) => {
    setConfig(prev => ({ ...prev, myRole }));
  }, []);

  // 设置是否启用警长
  const setEnableSheriff = useCallback((enableSheriff: boolean) => {
    setConfig(prev => ({ ...prev, enableSheriff }));
  }, []);

  // 设置角色配置
  const setRoleCounts = useCallback((roleCounts: Record<string, number>) => {
    setConfig(prev => ({ ...prev, roleCounts }));
  }, []);

  const totalPlayers = Object.values(config.roleCounts).reduce((a: number, b: number) => a + b, 0);

  return {
    roleCounts: config.roleCounts,
    myId: config.myId,
    myRole: config.myRole,
    enableSheriff: config.enableSheriff,
    totalPlayers,
    updateRoleCount,
    applyPreset,
    setMyId,
    setMyRole,
    setEnableSheriff,
    setRoleCounts
  };
}

export default useSetupConfig;
