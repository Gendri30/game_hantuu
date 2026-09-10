import React from 'react';
import { Play, RotateCcw, Home, Volume2, VolumeX } from 'lucide-react';
import { LevelConfig } from '../types';

interface PauseModalProps {
  level: LevelConfig;
  onResume: () => void;
  onReplay: () => void;
  onHome: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
}

export const PauseModal: React.FC<PauseModalProps> = ({
  level,
  onResume,
  onReplay,
  onHome,
  isMuted,
  onToggleMute,
}) => {
  return (
    <div className="absolute inset-0 z-40 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="max-w-sm w-full bg-slate-900 rounded-3xl p-6 cartoon-border text-center shadow-2xl">
        <h2 className="font-cartoon text-3xl text-amber-300 tracking-wide mb-1">
          GAME DIHENTIKAN
        </h2>
        <p className="text-xs text-slate-400 mb-6">
          {level.titleIndo}
        </p>

        <div className="flex flex-col gap-2.5">
          <button
            onClick={onResume}
            className="w-full py-3 rounded-2xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-cartoon text-base font-bold cartoon-border transition active:scale-95 flex items-center justify-center gap-2"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>Lanjutkan Misi</span>
          </button>

          <button
            onClick={onReplay}
            className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-cartoon text-sm cartoon-border-sm transition active:scale-95 flex items-center justify-center gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Mulai Ulang</span>
          </button>

          <button
            onClick={onToggleMute}
            className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-cartoon text-sm cartoon-border-sm transition active:scale-95 flex items-center justify-center gap-2"
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
            <span>Suara: {isMuted ? 'Mati' : 'Aktif'}</span>
          </button>

          <button
            onClick={onHome}
            className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-cartoon text-sm cartoon-border-sm transition active:scale-95 flex items-center justify-center gap-2"
          >
            <Home className="w-4 h-4" />
            <span>Menu Utama</span>
          </button>
        </div>
      </div>
    </div>
  );
};
