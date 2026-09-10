import React from 'react';
import { RotateCcw, Home, Skull, Lightbulb } from 'lucide-react';
import { LevelConfig } from '../types';

interface GameOverModalProps {
  level: LevelConfig;
  onReplay: () => void;
  onHome: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  level,
  onReplay,
  onHome,
}) => {
  const tips = [
    'Masuk ke lemari pakaian terdekat saat melihat lampu patroli hantu mendekat!',
    'Jalan jongkok [C] untuk menghilangkan suara langkah kakimu sepenuhnya.',
    'Lontarkan mainan bersuara [F] ke ruangan lain untuk memancing hantu menjauh.',
    'Gunakan bom asap gaib [G] saat terpojok di sudut ruangan.',
    'Hantu tidak bisa melihatmu jika terhalang dinding tinggi atau rak buku.',
  ];
  const randomTip = tips[Math.floor(Math.random() * tips.length)];

  return (
    <div className="absolute inset-0 z-40 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-slate-900 rounded-3xl p-6 cartoon-border text-center relative overflow-hidden shadow-2xl border-red-500">
        {/* Glow red header */}
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-48 h-48 bg-red-600/30 rounded-full blur-3xl pointer-events-none" />

        {/* Skull Icon */}
        <div className="inline-flex p-4 bg-red-600 text-white rounded-2xl cartoon-border-sm mb-3 shadow-lg transform rotate-6 animate-pulse">
          <Skull className="w-10 h-10" />
        </div>

        <h2 className="font-cartoon text-3xl sm:text-4xl text-red-400 tracking-wide mb-1">
          TERTANGKAP BASAH!
        </h2>
        <p className="text-sm text-slate-300 mb-5">
          Polisi hantu mendeteksi keberadaanmu dan menyita semua barang rampasanmu!
        </p>

        {/* Tactical Tip Box */}
        <div className="bg-slate-800/80 p-3.5 rounded-2xl border border-slate-700 text-left mb-6">
          <div className="flex items-center gap-1.5 text-amber-400 text-xs font-bold mb-1">
            <Lightbulb className="w-4 h-4" /> Tips Pencuri Licik:
          </div>
          <p className="text-xs text-slate-300 italic">
            "{randomTip}"
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-2.5">
          <button
            onClick={onReplay}
            className="w-full py-3.5 rounded-2xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-cartoon text-lg font-bold cartoon-border transition transform active:scale-95 shadow-md flex items-center justify-center gap-2"
          >
            <RotateCcw className="w-5 h-5" />
            <span>ULANGI MISI INI</span>
          </button>

          <button
            onClick={onHome}
            className="py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-cartoon text-sm cartoon-border-sm transition active:scale-95 flex items-center justify-center gap-2"
          >
            <Home className="w-4 h-4" />
            <span>Kembali ke Menu Utama</span>
          </button>
        </div>
      </div>
    </div>
  );
};
