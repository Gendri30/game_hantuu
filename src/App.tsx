import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GameEngine, InteractionTarget } from './game/GameEngine';
import { LEVELS } from './game/levelsData';
import { GameStatus, LevelConfig, LootItem } from './types';
import { soundEngine } from './audio/soundEngine';
import { HUD } from './components/HUD';
import { MainMenu } from './components/MainMenu';
import { VictoryModal } from './components/VictoryModal';
import { GameOverModal } from './components/GameOverModal';
import { PauseModal } from './components/PauseModal';

export default function App() {
  const [currentLevelId, setCurrentLevelId] = useState<number>(1);
  const [gameStatus, setGameStatus] = useState<GameStatus>('menu');
  const [score, setScore] = useState<number>(0);
  const [timeElapsed, setTimeElapsed] = useState<number>(0);
  const [interactionTarget, setInteractionTarget] = useState<InteractionTarget | null>(null);
  const [heartbeatIntensity, setHeartbeatIntensity] = useState<number>(0);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isPointerLocked, setIsPointerLocked] = useState<boolean>(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<GameEngine | null>(null);
  const timerRef = useRef<number | null>(null);

  const currentLevel = LEVELS.find((l) => l.id === currentLevelId) || LEVELS[0];

  // Start Level in Engine
  const startLevel = useCallback((levelToStart: LevelConfig) => {
    if (!containerRef.current) return;

    if (!engineRef.current) {
      engineRef.current = new GameEngine(containerRef.current);
    }

    const engine = engineRef.current;

    // Reset stats
    setScore(0);
    setTimeElapsed(0);
    setInteractionTarget(null);
    setHeartbeatIntensity(0);

    // Callbacks
    engine.onInteractionPrompt = (target) => {
      setInteractionTarget(target);
    };

    engine.onLootCollected = (item: LootItem) => {
      setScore((prev) => prev + item.value);
    };

    engine.onPlayerCaught = () => {
      setGameStatus('caught');
      if (document.exitPointerLock) {
        document.exitPointerLock();
      }
    };

    engine.onVictory = () => {
      setGameStatus('victory');
      if (document.exitPointerLock) {
        document.exitPointerLock();
      }
    };

    engine.onHeartbeatUpdate = (intensity: number) => {
      setHeartbeatIntensity(intensity);
    };

    engine.loadLevel(levelToStart);
    engine.start();
    setGameStatus('playing');
  }, []);

  // Timer interval while playing
  useEffect(() => {
    if (gameStatus === 'playing') {
      timerRef.current = window.setInterval(() => {
        setTimeElapsed((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [gameStatus]);

  // Pointer lock change listener
  useEffect(() => {
    const handlePointerLock = () => {
      setIsPointerLocked(document.pointerLockElement === containerRef.current);
    };
    document.addEventListener('pointerlockchange', handlePointerLock);
    return () => {
      document.removeEventListener('pointerlockchange', handlePointerLock);
    };
  }, []);

  const handleStartGame = () => {
    startLevel(currentLevel);
  };

  const handleReplay = () => {
    startLevel(currentLevel);
  };

  const handleNextLevel = () => {
    const nextId = currentLevelId + 1;
    const nextLevel = LEVELS.find((l) => l.id === nextId);
    if (nextLevel) {
      setCurrentLevelId(nextId);
      startLevel(nextLevel);
    } else {
      setGameStatus('menu');
    }
  };

  const handleHome = () => {
    if (engineRef.current) {
      engineRef.current.stop();
    }
    setGameStatus('menu');
    if (document.exitPointerLock) {
      document.exitPointerLock();
    }
  };

  const handlePause = () => {
    if (engineRef.current) {
      engineRef.current.stop();
    }
    setGameStatus('paused');
    if (document.exitPointerLock) {
      document.exitPointerLock();
    }
  };

  const handleResume = () => {
    if (engineRef.current) {
      engineRef.current.start();
    }
    setGameStatus('playing');
  };

  const handleToggleMute = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    soundEngine.setMuted(nextMuted);
  };

  // User Actions
  const handleInteract = () => {
    if (engineRef.current) {
      engineRef.current.interact();
    }
  };

  const handleToggleCrouch = () => {
    if (engineRef.current) {
      engineRef.current.toggleCrouch();
    }
  };

  const handleToggleSprint = (sprint: boolean) => {
    if (engineRef.current) {
      engineRef.current.setSprinting(sprint);
    }
  };

  const handleThrowDistraction = () => {
    if (engineRef.current) {
      engineRef.current.throwDistractionToy();
    }
  };

  const handleUseSmokeBomb = () => {
    if (engineRef.current) {
      engineRef.current.useSmokeBomb();
    }
  };

  const handleToggleFlashlight = () => {
    if (engineRef.current) {
      engineRef.current.toggleFlashlight();
    }
  };

  const handleVirtualMove = (x: number, y: number) => {
    if (engineRef.current) {
      engineRef.current.virtualMoveX = x;
      engineRef.current.virtualMoveY = y;
    }
  };

  const handleVirtualLook = (dx: number, dy: number) => {
    if (engineRef.current) {
      engineRef.current.rotatePlayerBy(dx, dy);
    }
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-slate-950 select-none">
      {/* 3D WebGL Canvas Container */}
      <div
        ref={containerRef}
        id="game-viewport"
        className="w-full h-full cursor-crosshair"
      />

      {/* Main Menu Overlay */}
      {gameStatus === 'menu' && (
        <MainMenu
          levels={LEVELS}
          currentLevelId={currentLevelId}
          onSelectLevel={(id) => setCurrentLevelId(id)}
          onStartGame={handleStartGame}
          isMuted={isMuted}
          onToggleMute={handleToggleMute}
        />
      )}

      {/* Active Game HUD */}
      {gameStatus === 'playing' && engineRef.current && (
        <HUD
          level={engineRef.current.currentLevel || currentLevel}
          player={engineRef.current.player}
          ghosts={engineRef.current.ghosts}
          interactionTarget={interactionTarget}
          heartbeatIntensity={heartbeatIntensity}
          timeElapsed={timeElapsed}
          score={score}
          onInteract={handleInteract}
          onToggleCrouch={handleToggleCrouch}
          onToggleSprint={handleToggleSprint}
          onThrowDistraction={handleThrowDistraction}
          onUseSmokeBomb={handleUseSmokeBomb}
          onToggleFlashlight={handleToggleFlashlight}
          onToggleMute={handleToggleMute}
          isMuted={isMuted}
          onPause={handlePause}
          onVirtualMove={handleVirtualMove}
          onVirtualLook={handleVirtualLook}
          isPointerLocked={isPointerLocked}
        />
      )}

      {/* Pause Modal */}
      {gameStatus === 'paused' && (
        <PauseModal
          level={currentLevel}
          onResume={handleResume}
          onReplay={handleReplay}
          onHome={handleHome}
          isMuted={isMuted}
          onToggleMute={handleToggleMute}
        />
      )}

      {/* Victory Modal */}
      {gameStatus === 'victory' && (
        <VictoryModal
          level={currentLevel}
          score={score}
          timeElapsed={timeElapsed}
          onNextLevel={handleNextLevel}
          onReplay={handleReplay}
          onHome={handleHome}
          hasNextLevel={currentLevelId < LEVELS.length}
        />
      )}

      {/* Game Over Modal */}
      {gameStatus === 'caught' && (
        <GameOverModal
          level={currentLevel}
          onReplay={handleReplay}
          onHome={handleHome}
        />
      )}
    </div>
  );
}
