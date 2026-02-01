import React, { useState, useCallback } from 'react';
import { Users, NotebookPen, Sparkles } from 'lucide-react';
import PlayerGrid from './components/PlayerGrid';
import GameLogView from './components/NotesView';
import AIChat from './components/AIChat';
import VotingModal from './components/VotingModal';
import SetupScreen from './src/components/setup/SetupScreen';
import AISettingsModal from './src/components/setup/AISettingsModal';
import GameHeader from './src/components/game/GameHeader';
import EndGameModal from './src/components/game/EndGameModal';
import { Tab, VoteType } from './types';
import { useGameState } from './src/hooks/useGameState';
import { useAIConfig } from './src/hooks/useAIConfig';
import { useSetupConfig } from './src/hooks/useSetupConfig';

const App: React.FC = () => {
  // UI状态
  const [activeTab, setActiveTab] = useState<Tab>(Tab.BOARD);
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);
  const [showAISettings, setShowAISettings] = useState(false);
  const [showEndGameModal, setShowEndGameModal] = useState(false);
  const [showVotingModal, setShowVotingModal] = useState(false);
  const [currentVoteType, setCurrentVoteType] = useState<VoteType>(VoteType.SHERIFF);

  // 使用自定义hooks
  const {
    roleCounts,
    myId,
    myRole,
    enableSheriff,
    totalPlayers,
    updateRoleCount,
    applyPreset,
    setMyId,
    setMyRole,
    setEnableSheriff
  } = useSetupConfig();

  const {
    aiConfig,
    setAiConfig,
    updateAIConfig,
    handleAIProviderChange
  } = useAIConfig();

  const {
    players,
    gameState,
    gameEvents,
    votes,
    isSetupMode,
    initGame,
    updatePlayer,
    addGameEvent,
    deleteGameEvent,
    registerSheriff,
    withdrawSheriff,
    electSheriff,
    submitVote,
    calculateVoteResult,
    clearVotes,
    advancePhase,
    confirmEndGame,
    exportData,
    toggleGameStateField
  } = useGameState({ myId, myRole, roleCounts, enableSheriff });

  // ==================== 事件处理 ====================

  const handleInitGame = useCallback(() => {
    initGame();
  }, [initGame]);

  const handleOpenVotingModal = useCallback((voteType: VoteType) => {
    setCurrentVoteType(voteType);
    setShowVotingModal(true);
  }, []);

  const handleClearVotes = useCallback(() => {
    clearVotes(currentVoteType, gameState.currentDay);
  }, [clearVotes, currentVoteType, gameState.currentDay]);

  const handleCompleteVoting = useCallback(() => {
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
  }, [currentVoteType, calculateVoteResult, gameState.currentDay, electSheriff, advancePhase]);

  const handleConfirmEndGame = useCallback(() => {
    confirmEndGame();
    setShowEndGameModal(false);
  }, [confirmEndGame]);

  const handleExportData = useCallback(() => {
    exportData();
    setShowSettingsMenu(false);
  }, [exportData]);

  // ==================== 渲染 ====================

  // 设置模式
  if (isSetupMode) {
    return (
      <SetupScreen
        roleCounts={roleCounts}
        myId={myId}
        myRole={myRole}
        enableSheriff={enableSheriff}
        totalPlayers={totalPlayers}
        showAISettings={showAISettings}
        aiConfig={aiConfig}
        onRoleCountChange={updateRoleCount}
        onMyIdChange={setMyId}
        onMyRoleChange={setMyRole}
        onEnableSheriffChange={setEnableSheriff}
        onApplyPreset={applyPreset}
        onStartGame={handleInitGame}
        onShowAISettings={() => setShowAISettings(true)}
        onCloseAISettings={() => setShowAISettings(false)}
        onAIConfigChange={updateAIConfig}
        onAIProviderChange={handleAIProviderChange}
      />
    );
  }

  // 游戏模式
  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans selection:bg-blue-500/30">
      {/* Top Bar */}
      <GameHeader
        myId={myId}
        myRole={myRole}
        gameState={gameState}
        showSettingsMenu={showSettingsMenu}
        onToggleSettingsMenu={() => setShowSettingsMenu(!showSettingsMenu)}
        onCloseSettingsMenu={() => setShowSettingsMenu(false)}
        onOpenAISettings={() => setShowAISettings(true)}
        onExportData={handleExportData}
        onRequestEndGame={() => { setShowSettingsMenu(false); setShowEndGameModal(true); }}
        onToggleGameState={toggleGameStateField}
        onOpenVotingModal={handleOpenVotingModal}
        onAdvancePhase={advancePhase}
      />

      {/* AI Settings Modal */}
      <AISettingsModal
        isOpen={showAISettings}
        onClose={() => setShowAISettings(false)}
        aiConfig={aiConfig}
        onAIConfigChange={updateAIConfig}
        onProviderChange={handleAIProviderChange}
      />

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
      <EndGameModal
        isOpen={showEndGameModal}
        onClose={() => setShowEndGameModal(false)}
        onConfirm={handleConfirmEndGame}
      />

      {/* Main Content */}
      <main className="p-4 max-w-2xl mx-auto min-h-[calc(100vh-180px)]">
        {activeTab === Tab.BOARD && (
          <PlayerGrid
            players={players}
            currentDay={gameState.currentDay}
            roleCounts={gameState.roleCounts}
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

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 w-full bg-slate-900 border-t border-slate-800 pb-safe pt-2 z-20 safe-area-bottom">
        <div className="max-w-2xl mx-auto flex justify-around items-center px-2 pb-2">
          <NavButton
            active={activeTab === Tab.BOARD}
            onClick={() => setActiveTab(Tab.BOARD)}
            icon={<Users size={24} />}
            label="局势"
          />
          <NavButton
            active={activeTab === Tab.TIMELINE}
            onClick={() => setActiveTab(Tab.TIMELINE)}
            icon={<NotebookPen size={24} />}
            label="复盘日志"
          />
          <NavButton
            active={activeTab === Tab.CHAT}
            onClick={() => setActiveTab(Tab.CHAT)}
            icon={<Sparkles size={24} />}
            label="AI 军师"
          />
        </div>
      </nav>
    </div>
  );
};

// Navigation Button Component
const NavButton: React.FC<{
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  highlight?: boolean;
}> = ({ active, onClick, icon, label, highlight }) => (
  <button
    onClick={onClick}
    className={`flex flex-col items-center justify-center p-2 w-full transition-all duration-200 relative ${
      active ? 'text-blue-400' : 'text-slate-500 hover:text-slate-300'
    }`}
  >
    {highlight && !active && <span className="absolute top-2 right-8 w-2 h-2 bg-blue-500 rounded-full animate-ping" />}
    <div className={`${active ? 'transform scale-110' : ''} mb-1`}>{icon}</div>
    <span className="text-[10px] font-medium tracking-wide">{label}</span>
  </button>
);

export default App;
