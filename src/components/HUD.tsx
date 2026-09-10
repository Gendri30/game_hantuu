import React, { useRef, useState, useEffect } from 'react';
import {
  InteractionTarget,
  PlayerState,
  LootItem,
  LevelConfig,
} from '../types';
import { GhostEntity } from '../game/ghostAI';
import {
  Flashlight,
  Volume2,
  VolumeX,
  Footprints,
  EyeOff,
  Bell,
  Sparkles,
  MapPin,
  HelpCircle,
  Pause,
  Key,
} from 'lucide-react';

interface HUDProps {
  level: LevelConfig;
  player: PlayerState;
  ghosts: GhostEntity[];
  interactionTarget: InteractionTarget | null;
  heartbeatIntensity: number;
  timeElapsed: number;
  score: number;
  onInteract: () => void;
  onToggleCrouch: () => void;
  onToggleSprint: (sprint: boolean) => void;
  onThrowDistraction: () => void;
  onUseSmokeBomb: () => void;
  onToggleFlashlight: () => void;
  onToggleMute: () => void;
  isMuted: boolean;
  onPause: () => void;
  onVirtualMove: (x: number, y: number) => void;
  onVirtualLook: (dx: number, dy: number) => void;
  isPointerLocked: boolean;
}

export const HUD: React.FC<HUDProps> = ({
  level,
  player,
  ghosts,
  interactionTarget,
  heartbeatIntensity,
  timeElapsed,
  score,
  onInteract,
  onToggleCrouch,
  onToggleSprint,
  onThrowDistraction,
  onUseSmokeBomb,
  onToggleFlashlight,
  onToggleMute,
  isMuted,
  onPause,
  onVirtualMove,
  onVirtualLook,
  isPointerLocked,
}) => {
  const objectives = level.loot.filter((l) => l.isObjective);
  const collectedObjectives = objectives.filter((l) => l.collected).length;
  const allObjectivesCollected = collectedObjectives === objectives.length;

  // Touch Virtual Joystick refs
  const joystickBaseRef = useRef<HTMLDivElement>(null);
  const [joystickActive, setJoystickActive] = useState(false);
  const [stickPos, setStickPos] = useState({ x: 0, y: 0 });

  // Touch Look Drag Area
  const lookTouchStart = useRef<{ id: number; x: number; y: number } | null>(null);

  const handleJoystickStart = (e: React.TouchEvent) => {
    e.stopPropagation();
    setJoystickActive(true);
    updateStickPos(e.touches[0]);
  };

  const handleJoystickMove = (e: React.TouchEvent) => {
    if (!joystickActive) return;
    updateStickPos(e.touches[0]);
  };

  const handleJoystickEnd = () => {
    setJoystickActive(false);
    setStickPos({ x: 0, y: 0 });
    onVirtualMove(0, 0);
  };

  const updateStickPos = (touch: React.Touch) => {
    if (!joystickBaseRef.current) return;
    const rect = joystickBaseRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    let dx = touch.clientX - centerX;
    let dy = touch.clientY - centerY;
    const maxRadius = 45;
    const dist = Math.hypot(dx, dy);

    if (dist > maxRadius) {
      dx = (dx / dist) * maxRadius;
      dy = (dy / dist) * maxRadius;
    }

    setStickPos({ x: dx, y: dy });
    onVirtualMove(dx / maxRadius, dy / maxRadius);
  };

  const handleLookTouchStart = (e: React.TouchEvent) => {
    if (lookTouchStart.current === null && e.touches.length > 0) {
      const touch = e.touches[e.touches.length - 1];
      lookTouchStart.current = { id: touch.identifier, x: touch.clientX, y: touch.clientY };
    }
  };

  const handleLookTouchMove = (e: React.TouchEvent) => {
    if (!lookTouchStart.current) return;
    for (let i = 0; i < e.touches.length; i++) {
      const t = e.touches[i];
      if (t.identifier === lookTouchStart.current.id) {
        const dx = t.clientX - lookTouchStart.current.x;
        const dy = t.clientY - lookTouchStart.current.y;
        onVirtualLook(dx, dy);
        lookTouchStart.current.x = t.clientX;
        lookTouchStart.current.y = t.clientY;
        break;
      }
    }
  };

  const handleLookTouchEnd = () => {
    lookTouchStart.current = null;
  };

  // Format Timer
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div className="absolute inset-0 pointer-events-none select-none overflow-hidden flex flex-col justify-between">
      {/* 1. DANGER & HEARTBEAT VIGNETTE */}
      <div
        className="absolute inset-0 pointer-events-none transition-opacity duration-300"
        style={{
          boxShadow:
            heartbeatIntensity > 0
              ? `inset 0 0 ${120 * heartbeatIntensity}px rgba(${
                  heartbeatIntensity > 0.7 ? '239, 68, 68' : '234, 179, 8'
                }, ${heartbeatIntensity * 0.75})`
              : 'none',
        }}
      />

      {/* 2. INVISIBILITY / SMOKE BOMB AURA */}
      {player.invisibilityTimeLeft > 0 && (
        <div className="absolute inset-0 pointer-events-none border-4 border-indigo-400/50 bg-indigo-950/20 backdrop-blur-[1px] animate-pulse">
          <div className="absolute top-20 left-1/2 -translate-x-1/2 bg-indigo-900/90 text-indigo-200 px-4 py-1.5 rounded-full text-sm font-bold border border-indigo-400 shadow-lg flex items-center gap-2">
            <Sparkles className="w-4 h-4 animate-spin" />
            Mode Asap Gaib: {player.invisibilityTimeLeft.toFixed(1)}s (Tidak Terlihat!)
          </div>
        </div>
      )}

      {/* 3. WARDROBE HIDING PEEK OVERLAY */}
      {player.isHiding && (
        <div className="absolute inset-0 pointer-events-none z-10 flex flex-col justify-between">
          <div className="h-16 bg-stone-900/95 border-b-8 border-amber-950 shadow-2xl flex items-center justify-center">
            <span className="text-amber-300 font-cartoon text-lg flex items-center gap-2">
              <EyeOff className="w-5 h-5" /> Kamu Sedang Bersembunyi di Lemari! (Aman dari Hantu)
            </span>
          </div>
          {/* Louver Wooden Slats Grid */}
          <div className="flex-1 flex flex-col justify-around py-4 opacity-75">
            {[...Array(9)].map((_, i) => (
              <div key={i} className="h-3 bg-stone-950/90 w-full border-y border-amber-950/80 shadow-md" />
            ))}
          </div>
          <div className="h-16 bg-stone-900/95 border-t-8 border-amber-950 flex items-center justify-center">
            <span className="text-amber-200 text-sm font-semibold animate-pulse">
              Tekan [E] atau Tombol Aksi untuk Keluar
            </span>
          </div>
        </div>
      )}

      {/* 4. TOP BAR: OBJECTIVES, RADAR & CONTROLS */}
      <div className="w-full p-4 flex items-start justify-between z-20">
        {/* Left: Mission Checklist */}
        <div className="bg-slate-900/90 backdrop-blur-md rounded-2xl p-3.5 cartoon-border-sm max-w-xs sm:max-w-sm text-white pointer-events-auto">
          <div className="flex items-center justify-between gap-3 mb-2 border-b border-slate-700/60 pb-1.5">
            <div className="flex items-center gap-2">
              <Key className="w-4 h-4 text-amber-400" />
              <span className="font-cartoon text-base text-amber-300 tracking-wide">
                Target Barang
              </span>
            </div>
            <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
              {collectedObjectives}/{objectives.length} Sasaran
            </span>
          </div>

          <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
            {objectives.map((item) => (
              <div
                key={item.id}
                className={`flex items-center justify-between text-xs py-1 px-2 rounded-lg transition-all ${
                  item.collected
                    ? 'bg-emerald-950/50 text-emerald-300 line-through opacity-80'
                    : 'bg-slate-800/60 text-slate-200'
                }`}
              >
                <span className="font-medium flex items-center gap-1.5 truncate">
                  <span
                    className="w-2 h-2 rounded-full inline-block"
                    style={{ backgroundColor: item.color }}
                  />
                  {item.nameIndo}
                </span>
                <span className="font-bold text-amber-400 shrink-0 ml-2">
                  +{item.value}
                </span>
              </div>
            ))}
          </div>

          {/* Escape Prompt when all collected */}
          {allObjectivesCollected ? (
            <div className="mt-2 py-1.5 px-2.5 rounded-xl bg-emerald-500/25 border border-emerald-400 text-emerald-300 text-xs font-bold animate-pulse flex items-center justify-center gap-1.5">
              <MapPin className="w-3.5 h-3.5" /> PINTU KELUAR TERBUKA! LARI KE PINTU!
            </div>
          ) : (
            <div className="mt-2 text-[11px] text-slate-400 flex items-center justify-between">
              <span>Total Rampasan: <strong className="text-amber-400">{score} Poin</strong></span>
              <span>Waktu: <strong className="text-sky-300">{formatTime(timeElapsed)}</strong></span>
            </div>
          )}
        </div>

        {/* Center: Sneak / Noise Level Indicator */}
        <div className="hidden sm:flex flex-col items-center pointer-events-auto bg-slate-900/85 backdrop-blur-md px-4 py-2 rounded-2xl cartoon-border-sm">
          <div className="flex items-center gap-2 text-xs font-bold mb-1">
            <Footprints
              className={`w-4 h-4 ${
                player.isSprinting
                  ? 'text-red-400 animate-bounce'
                  : player.isCrouching
                  ? 'text-emerald-400'
                  : 'text-slate-300'
              }`}
            />
            <span
              className={
                player.isSprinting
                  ? 'text-red-400'
                  : player.isCrouching
                  ? 'text-emerald-400'
                  : 'text-slate-300'
              }
            >
              {player.isHiding
                ? 'TERSEMBUNYI (Lemari)'
                : player.isCrouching
                ? 'MENYUSUP (Senyap)'
                : player.isSprinting
                ? 'BERLARI (Bising!)'
                : 'BERJALAN'}
            </span>
          </div>
          {/* Noise Meter Bar */}
          <div className="w-28 h-2 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
            <div
              className={`h-full transition-all duration-150 rounded-full ${
                player.noiseLevel > 0.6
                  ? 'bg-red-500'
                  : player.noiseLevel > 0.2
                  ? 'bg-amber-400'
                  : 'bg-emerald-500'
              }`}
              style={{ width: `${Math.max(10, player.noiseLevel * 100)}%` }}
            />
          </div>
        </div>

        {/* Right: Top-Down Radar & Quick Settings */}
        <div className="flex flex-col items-end gap-2 pointer-events-auto">
          <div className="flex items-center gap-1.5">
            <button
              onClick={onToggleMute}
              className="p-2 rounded-xl bg-slate-900/90 cartoon-border-sm text-white hover:bg-slate-800 transition active:scale-95"
              title="Suara"
            >
              {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
            </button>
            <button
              onClick={onPause}
              className="p-2 rounded-xl bg-slate-900/90 cartoon-border-sm text-white hover:bg-slate-800 transition active:scale-95"
              title="Pause"
            >
              <Pause className="w-4 h-4 text-sky-400" />
            </button>
          </div>

          {/* Top-Down Cartoon Radar */}
          <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-2xl bg-slate-950/90 border-2 border-slate-700 relative overflow-hidden shadow-xl cartoon-border-sm">
            {/* Grid Lines */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:14px_14px] opacity-40" />

            {/* Radar Sweep Animation */}
            <div className="absolute inset-0 rounded-full border border-sky-500/20" />

            {/* Radar Coordinates Center: relative to level center */}
            {/* Loot Dots */}
            {level.loot.map((l) => {
              if (l.collected) return null;
              // Normalize (-12 to 12) -> (0 to 100%)
              const leftPercent = ((l.x + 14) / 28) * 100;
              const topPercent = ((l.z + 14) / 28) * 100;
              return (
                <div
                  key={l.id}
                  className={`absolute w-2 h-2 rounded-full -translate-x-1/2 -translate-y-1/2 ${
                    l.isObjective ? 'bg-amber-400 ring-2 ring-amber-300/80 animate-ping' : 'bg-yellow-200'
                  }`}
                  style={{ left: `${leftPercent}%`, top: `${topPercent}%` }}
                />
              );
            })}

            {/* Exit Door Dot */}
            {level.exitDoor && (
              <div
                className={`absolute w-3 h-3 rounded -translate-x-1/2 -translate-y-1/2 border border-black ${
                  allObjectivesCollected ? 'bg-emerald-400 animate-pulse' : 'bg-red-500'
                }`}
                style={{
                  left: `${((level.exitDoor.x + 14) / 28) * 100}%`,
                  top: `${((level.exitDoor.z + 14) / 28) * 100}%`,
                }}
              />
            )}

            {/* Ghosts Dots & Vision Cones */}
            {ghosts.map((g) => {
              const left = ((g.group.position.x + 14) / 28) * 100;
              const top = ((g.group.position.z + 14) / 28) * 100;
              return (
                <div
                  key={g.data.id}
                  className={`absolute w-2.5 h-2.5 rounded-full -translate-x-1/2 -translate-y-1/2 transition-all ${
                    g.data.state === 'chase'
                      ? 'bg-red-500 ring-4 ring-red-500/60 scale-125'
                      : g.data.state === 'suspicious'
                      ? 'bg-amber-400 ring-2 ring-amber-400/50'
                      : 'bg-sky-400'
                  }`}
                  style={{ left: `${left}%`, top: `${top}%` }}
                />
              );
            })}

            {/* Player Triangle on Radar */}
            <div
              className="absolute w-3 h-3 -translate-x-1/2 -translate-y-1/2"
              style={{
                left: `${((player.x + 14) / 28) * 100}%`,
                top: `${((player.z + 14) / 28) * 100}%`,
                transform: `translate(-50%, -50%) rotate(${player.rotationY}rad)`,
              }}
            >
              <div className="w-0 h-0 border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-b-[9px] border-b-emerald-400 mx-auto" />
            </div>
          </div>
        </div>
      </div>

      {/* 5. CENTER SCREEN: CROSSHAIR & INTERACTION PROMPT */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        {/* Simple Crosshair */}
        {!player.isHiding && (
          <div className="w-3 h-3 rounded-full border-2 border-white/70 bg-black/30 shadow-sm" />
        )}

        {/* Interaction Bubble Prompt */}
        {interactionTarget && (
          <div className="absolute bottom-1/3 px-4 py-2 bg-amber-500 text-slate-950 font-cartoon text-sm sm:text-base rounded-2xl cartoon-border animate-bounce flex items-center gap-2 shadow-2xl">
            <span className="bg-slate-950 text-amber-300 px-2 py-0.5 rounded-lg text-xs font-sans font-black">
              [E]
            </span>
            <span>{interactionTarget.name}</span>
          </div>
        )}

        {/* Click to lock mouse prompt if on desktop and not locked */}
        {!isPointerLocked && !player.isHiding && (
          <div className="hidden sm:flex absolute bottom-24 bg-slate-900/90 text-slate-200 px-4 py-2 rounded-xl text-xs cartoon-border-sm items-center gap-2">
            <HelpCircle className="w-4 h-4 text-sky-400" />
            <span>Klik layar untuk mengunci kursor & melihat sekeliling (WASD untuk jalan)</span>
          </div>
        )}
      </div>

      {/* 6. BOTTOM BAR: GADGETS, ACTIONS & TOUCH CONTROLS */}
      <div className="w-full p-4 flex items-end justify-between z-20">
        {/* Mobile Left Touch Virtual Joystick */}
        <div className="sm:hidden pointer-events-auto">
          <div
            ref={joystickBaseRef}
            onTouchStart={handleJoystickStart}
            onTouchMove={handleJoystickMove}
            onTouchEnd={handleJoystickEnd}
            className="w-28 h-28 rounded-full bg-slate-900/70 border-2 border-slate-600 flex items-center justify-center relative touch-none"
          >
            <div
              className="w-12 h-12 rounded-full bg-sky-500/80 border-2 border-white shadow-lg pointer-events-none transition-transform"
              style={{ transform: `translate(${stickPos.x}px, ${stickPos.y}px)` }}
            />
          </div>
        </div>

        {/* Quick Inventory / Gadgets Belt */}
        <div className="pointer-events-auto bg-slate-900/90 backdrop-blur-md rounded-2xl p-2.5 cartoon-border-sm flex items-center gap-2 sm:gap-3 text-white">
          {/* Action / Loot / Hide Button */}
          <button
            onClick={onInteract}
            className={`px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl font-cartoon text-xs sm:text-sm font-bold flex items-center gap-1.5 transition active:scale-95 shadow-md ${
              interactionTarget
                ? 'bg-amber-400 text-slate-950 ring-2 ring-amber-300'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <span className="hidden sm:inline bg-slate-950 text-white px-1.5 py-0.5 rounded text-[10px] font-sans">
              E
            </span>
            <span>{player.isHiding ? 'Keluar' : 'Aksi / Ambil'}</span>
          </button>

          {/* Crouch / Sneak Toggle */}
          <button
            onClick={onToggleCrouch}
            className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition active:scale-95 ${
              player.isCrouching
                ? 'bg-emerald-500 text-slate-950 ring-2 ring-emerald-300'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <Footprints className="w-4 h-4" />
            <span className="hidden sm:inline font-sans text-[10px] bg-black/40 px-1 rounded">C</span>
            <span>{player.isCrouching ? 'Menyusup' : 'Jongkok'}</span>
          </button>

          {/* Sprint Button (Hold on mobile) */}
          <button
            onTouchStart={() => onToggleSprint(true)}
            onTouchEnd={() => onToggleSprint(false)}
            onClick={() => onToggleSprint(!player.isSprinting)}
            className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition active:scale-95 ${
              player.isSprinting
                ? 'bg-red-500 text-white ring-2 ring-red-300 animate-pulse'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <span className="hidden sm:inline font-sans text-[10px] bg-black/40 px-1 rounded">Shift</span>
            <span>Lari</span>
          </button>

          {/* Wind-up Distraction Toy */}
          <button
            onClick={onThrowDistraction}
            disabled={player.distractionToys <= 0}
            className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition active:scale-95 relative ${
              player.distractionToys > 0
                ? 'bg-amber-600/80 hover:bg-amber-500 text-white'
                : 'bg-slate-800/40 text-slate-500 cursor-not-allowed'
            }`}
            title="Lontarkan mainan bersuara untuk memancing hantu menjauh"
          >
            <Bell className="w-4 h-4 text-amber-300" />
            <span className="hidden sm:inline font-sans text-[10px] bg-black/40 px-1 rounded">F</span>
            <span className="hidden sm:inline">Mainan</span>
            <span className="bg-amber-400 text-slate-950 text-[10px] font-black px-1.5 py-0.2 rounded-full">
              {player.distractionToys}
            </span>
          </button>

          {/* Smoke Bomb Invisibility */}
          <button
            onClick={onUseSmokeBomb}
            disabled={player.smokeBombs <= 0}
            className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition active:scale-95 relative ${
              player.smokeBombs > 0
                ? 'bg-indigo-600/80 hover:bg-indigo-500 text-white'
                : 'bg-slate-800/40 text-slate-500 cursor-not-allowed'
            }`}
            title="Bom asap tembus pandang selama 4.5 detik"
          >
            <Sparkles className="w-4 h-4 text-indigo-300" />
            <span className="hidden sm:inline font-sans text-[10px] bg-black/40 px-1 rounded">G</span>
            <span className="hidden sm:inline">Asap Gaib</span>
            <span className="bg-indigo-300 text-slate-950 text-[10px] font-black px-1.5 py-0.2 rounded-full">
              {player.smokeBombs}
            </span>
          </button>

          {/* Flashlight Toggle */}
          <button
            onClick={onToggleFlashlight}
            className={`p-2 rounded-xl transition active:scale-95 ${
              player.flashlightOn ? 'bg-yellow-400 text-slate-950 shadow-md' : 'bg-slate-800 text-slate-400'
            }`}
            title="Senter [T]"
          >
            <Flashlight className="w-4 h-4" />
          </button>
        </div>

        {/* Mobile Right Touch Look Pad */}
        <div
          onTouchStart={handleLookTouchStart}
          onTouchMove={handleLookTouchMove}
          onTouchEnd={handleLookTouchEnd}
          className="sm:hidden pointer-events-auto w-28 h-28 rounded-2xl bg-slate-900/40 border border-slate-700/50 flex items-center justify-center text-slate-400 text-[11px] text-center font-medium touch-none"
        >
          Geser untuk lihat
        </div>
      </div>
    </div>
  );
};
