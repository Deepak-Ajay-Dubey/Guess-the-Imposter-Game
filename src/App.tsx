import { useState } from 'react';
import { AppShell } from './components/layout/AppShell';
import { CategoriesSheet } from './components/modals/CategoriesSheet';
import { CardRevealScreen } from './components/screens/CardRevealScreen';
import { DiscussionScreen } from './components/screens/DiscussionScreen';
import { ResultScreen } from './components/screens/ResultScreen';
import { SetupScreen } from './components/screens/SetupScreen';
import { useGameController } from './hooks/useGameController';

export default function App() {
  const {
    state,
    roleCounts,
    maxTotalOddOnes,
    currentCardPlayer,
    nextCardPlayer,
    startingPlayer,
    setMode,
    adjustPlayerCount,
    adjustMrWhiteCount,
    adjustUndercoverCount,
    setCustomName,
    clearCustomNames,
    toggleHintForOddOne,
    toggleCategory,
    selectAllCategories,
    toggleAiWords,
    toggleTimerEnabled,
    adjustTimerMinutes,
    startRound,
    advanceCard,
    revealOddOnes,
    backToSetup,
  } = useGameController();

  const [showCategories, setShowCategories] = useState(false);

  const oddOneCount = roleCounts.mrWhites + roleCounts.undercovers;

  const renderPhase = () => {
    switch (state.phase) {
      case 'SETUP':
        return (
          <SetupScreen
            config={state.config}
            roleCounts={roleCounts}
            maxTotalOddOnes={maxTotalOddOnes}
            onSetMode={setMode}
            onAdjustPlayers={adjustPlayerCount}
            onAdjustMrWhite={adjustMrWhiteCount}
            onAdjustUndercover={adjustUndercoverCount}
            onSetCustomName={setCustomName}
            onClearCustomNames={clearCustomNames}
            onToggleHint={toggleHintForOddOne}
            onOpenCategories={() => setShowCategories(true)}
            onToggleTimer={toggleTimerEnabled}
            onAdjustTimerMinutes={adjustTimerMinutes}
            onStartRound={startRound}
          />
        );

      case 'REVEAL':
        if (!currentCardPlayer || !state.wordPair) {
          return null;
        }
        return (
          <CardRevealScreen
            key={`${state.roundId}-${currentCardPlayer.id}`}
            player={currentCardPlayer}
            nextPlayer={nextCardPlayer}
            cardIndex={state.currentCardIndex}
            totalCards={state.players.length}
            wordPair={state.wordPair}
            hintForOddOne={state.config.hintForOddOne}
            onAdvance={advanceCard}
            onBackToSetup={backToSetup}
          />
        );

      case 'DISCUSS':
        if (!startingPlayer) {
          return null;
        }
        return (
          <DiscussionScreen
            startingPlayer={startingPlayer}
            mode={state.config.mode}
            oddOneCount={oddOneCount}
            timerEnabled={state.config.timerEnabled}
            timerMinutes={state.config.timerMinutes}
            onRevealOddOnes={revealOddOnes}
            onBackToSetup={backToSetup}
          />
        );

      case 'RESULT':
        if (!state.wordPair) {
          return null;
        }
        return (
          <ResultScreen
            players={state.players}
            wordPair={state.wordPair}
            onPlayAgain={startRound}
            onBackToSetup={backToSetup}
          />
        );
    }
  };

  return (
    <AppShell>
      {renderPhase()}

      {showCategories && state.phase === 'SETUP' && (
        <CategoriesSheet
          selectedCategories={state.config.selectedCategories}
          useAiWords={state.config.useAiWords}
          onToggleCategory={toggleCategory}
          onSelectAll={selectAllCategories}
          onToggleAiWords={toggleAiWords}
          onClose={() => setShowCategories(false)}
        />
      )}
    </AppShell>
  );
}
