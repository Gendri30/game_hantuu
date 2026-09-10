import React, { useState } from 'react';
import { LevelConfig } from '../types';
import {
  Ghost,
  Key,
  ShieldAlert,
  Volume2,
  VolumeX,
  Play,
  HelpCircle,
  Trophy,
  Compass,
  Sparkles,
  Footprints,
} from 'lucide-react';

interface MainMenuProps {
  levels: LevelConfig[];
  currentLevelId: number;
  onSelectLevel: (levelId: number) => void;
  onStartGame: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
}

export const MainMenu: React.FC<MainMenuProps> = ({
  levels,
  currentLevelId,
  onSelectLevel,
  onStartGame,
  isMuted,
  onToggleMute,
}) => {
  const [showHowToPlay, setShowHowToPlay] = useState(false);

  return (
    <div className="absolute inset-0 z-30 bg-slate-950 flex items-center justify-center p-4 overflow-y-auto">
      {/* Spooky Cartoon Background Gradient */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-900/40 via-slate-950 to-slate-950 pointer-events-none" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e1b4b_1px,transparent_1px),linear-gradient(to_bottom,#1e1b4b_1px,transparent_1px)] bg-[size:32px_32px] opacity-20 pointer-events-none" />

      <div className="relative max-w-2xl w-full my-auto text-center z-10">
        {/* Top Floating Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-500/20 border border-indigo-500/40 text-indigo-300 text-xs sm:text-sm font-bold mb-4 shadow-lg">
          <Ghost className="w-4 h-4 text-cyan-300 animate-bounce" />
          <span>Game Perampokan First-Person ala Robbery Bob</span>
        </div>

        {/* Game Title */}
        <h1 className="text-4xl sm:text-6xl font-black font-cartoon text-transparent bg-clip-text bg-gradient-to-b from-amber-200 via-amber-400 to-amber-600 drop-shadow-[0_5px_5px_rgba(0,0,0,0.8)] tracking-wide mb-2">
          SPOOKY HEIST
        </h1>
        <p className="text-lg sm:text-2xl font-cartoon text-cyan-300 tracking-wider mb-6">
          PATROLI POLISI HANTU 3D
        </p>

        {/* Level Selection Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6 text-left">
          {levels.map((lvl) => {
            const isSelected = lvl.id === currentLevelId;
            return (
              <div
                key={lvl.id}
                onClick={() => onSelectLevel(lvl.id)}
                className={`cursor-pointer p-3.5 rounded-2xl transition-all duration-200 cartoon-border-sm relative overflow-hidden ${
                  isSelected
                    ? 'bg-indigo-950 border-amber-400 ring-2 ring-amber-400/80 -translate-y-1'
                    : 'bg-slate-900/80 border-slate-700 hover:bg-slate-800'
                }`}
              >
                {isSelected && (
                  <span className="absolute top-2 right-2 w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping" />
                )}
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-black px-2 py-0.5 rounded-md bg-slate-800 text-amber-300">
                    LVL {lvl.id}
                  </span>
                  <span className="text-xs font-semibold text-slate-400">
                    {lvl.ghosts.length} Hantu
                  </span>
                </div>
                <h3 className="font-cartoon text-base text-slate-100 mb-1 truncate">
                  {lvl.titleIndo}
                </h3>
                <p className="text-xs text-slate-400 line-clamp-2">
                  {lvl.subtitle}
                </p>
                <div className="mt-2.5 flex items-center justify-between text-[11px] font-bold text-amber-400/90 border-t border-slate-800 pt-1.5">
                  <span>{lvl.loot.filter((l) => l.isObjective).length} Sasaran</span>
                  <span>Maks {lvl.timeLimitSeconds}s</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Main Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-4">
          <button
            onClick={onStartGame}
            className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-cartoon text-xl font-bold cartoon-border transition-all transform active:scale-95 shadow-xl flex items-center justify-center gap-2"
          >
            <Play className="w-6 h-6 fill-current" />
            <span>MULAI MENYUSUP</span>
          </button>

          <button
            onClick={() => setShowHowToPlay(!showHowToPlay)}
            className="w-full sm:w-auto px-5 py-3.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-cartoon text-base cartoon-border-sm transition active:scale-95 flex items-center justify-center gap-2"
          >
            <HelpCircle className="w-5 h-5 text-sky-400" />
            <span>Cara Bermain</span>
          </button>

          <button
            onClick={onToggleMute}
            className="p-3.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 cartoon-border-sm transition active:scale-95"
            title="Toggle Audio"
          >
            {isMuted ? <VolumeX className="w-5 h-5 text-red-400" /> : <Volume2 className="w-5 h-5 text-emerald-400" />}
          </button>
        </div>

        {/* How to Play Modal Popup */}
        {showHowToPlay && (
          <div className="mt-4 p-4 rounded-2xl bg-slate-900 border-2 border-indigo-500/50 text-left text-sm text-slate-300 cartoon-border shadow-2xl">
            <h4 className="font-cartoon text-lg text-amber-300 mb-2 flex items-center gap-2">
              <Compass className="w-5 h-5" /> Panduan Menyusup & Mencuri
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <div className="p-2 rounded-xl bg-slate-800/80 border border-slate-700">
                <strong className="text-cyan-300 flex items-center gap-1 mb-0.5">
                  <Key className="w-3.5 h-3.5" /> 1. Cari Barang Sasaran
                </strong>
                Dekati barang berkilau emas, tekan <strong>[E]</strong> untuk mencuri. Semua sasaran wajib diambil untuk membuka pintu keluar.
              </div>
              <div className="p-2 rounded-xl bg-slate-800/80 border border-slate-700">
                <strong className="text-red-400 flex items-center gap-1 mb-0.5">
                  <ShieldAlert className="w-3.5 h-3.5" /> 2. Hindari Polisi Hantu
                </strong>
                Hantu memiliki lampu sorot mata. Jika sorot berubah merah, kamu terdeteksi dan akan dikejar!
              </div>
              <div className="p-2 rounded-xl bg-slate-800/80 border border-slate-700">
                <strong className="text-emerald-300 flex items-center gap-1 mb-0.5">
                  <Ghost className="w-3.5 h-3.5" /> 3. Sembunyi di Lemari
                </strong>
                Tekan <strong>[E]</strong> di depan lemari pakaian untuk sembunyi dan mengintip dari balik kisi kayu!
              </div>
              <div className="p-2 rounded-xl bg-slate-800/80 border border-slate-700">
                <strong className="text-amber-300 flex items-center gap-1 mb-0.5">
                  <Footprints className="w-3.5 h-3.5" /> 4. Langkah Kaki & Suara
                </strong>
                Jongkok <strong>[C]</strong> agar senyap tanpa suara. Berlari <strong>[Shift]</strong> cepat tapi suaramu terdengar oleh hantu!
              </div>
            </div>
            <div className="mt-2.5 text-center">
              <button
                onClick={() => setShowHowToPlay(false)}
                className="text-xs text-sky-400 underline hover:text-sky-300"
              >
                Tutup Panduan
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
