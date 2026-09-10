import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Star, Trophy, ArrowRight, RotateCcw, Home, Clock, Award } from 'lucide-react';
import { LevelConfig } from '../types';

interface VictoryModalProps {
  level: LevelConfig;
  score: number;
  timeElapsed: number;
  onNextLevel: () => void;
  onReplay: () => void;
  onHome: () => void;
  hasNextLevel: boolean;
}

export const VictoryModal: React.FC<VictoryModalProps> = ({
  level,
  score,
  timeElapsed,
  onNextLevel,
  onReplay,
  onHome,
  hasNextLevel,
}) => {
  // Fire celebratory cartoon confetti on mount
  useEffect(() => {
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#facc15', '#38bdf8', '#ef4444', '#10b981'],
      });
    } catch {
      // Confetti fallback
    }
  }, []);

  // Calculate Stars (1 to 3)
  const isSpeedy = timeElapsed <= level.parTimeSeconds;
  const stars = isSpeedy ? 3 : 2;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div className="absolute inset-0 z-40 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-slate-900 rounded-3xl p-6 cartoon-border text-center relative overflow-hidden shadow-2xl">
        {/* Glow header */}
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-48 h-48 bg-amber-500/20 rounded-full blur-3xl pointer-events-none" />

        {/* Comic Trophy icon */}
        <div className="inline-flex p-4 bg-amber-400 text-slate-950 rounded-2xl cartoon-border-sm mb-3 shadow-lg transform -rotate-3">
          <Trophy className="w-10 h-10" />
        </div>

        <h2 className="font-cartoon text-3xl sm:text-4xl text-amber-300 tracking-wide mb-1">
          KABUR DENGAN SUKSES!
        </h2>
        <p className="text-sm text-slate-300 mb-4">
          Semua barang berharga berhasil dibawa kabur dari hadapan polisi hantu!
        </p>

        {/* Stars Rating Display */}
        <div className="flex items-center justify-center gap-2 mb-5">
          {[1, 2, 3].map((starIdx) => {
            const isEarned = starIdx <= stars;
            return (
              <div
                key={starIdx}
                className={`p-2 rounded-2xl cartoon-border-sm transition-all duration-300 ${
                  isEarned
                    ? 'bg-amber-400 text-slate-950 scale-110 rotate-3 shadow-lg'
                    : 'bg-slate-800 text-slate-600'
                }`}
              >
                <Star className={`w-8 h-8 ${isEarned ? 'fill-current' : ''}`} />
              </div>
            );
          })}
        </div>

        {/* Heist Stats Cards */}
        <div className="grid grid-cols-2 gap-3 mb-6 text-left">
          <div className="bg-slate-800/80 p-3 rounded-2xl border border-slate-700">
            <span className="text-[11px] text-slate-400 font-medium flex items-center gap-1 mb-0.5">
              <Award className="w-3.5 h-3.5 text-amber-400" /> Nilai Rampasan
            </span>
            <span className="font-cartoon text-xl text-amber-300">
              {score} Poin
            </span>
          </div>

          <div className="bg-slate-800/80 p-3 rounded-2xl border border-slate-700">
            <span className="text-[11px] text-slate-400 font-medium flex items-center gap-1 mb-0.5">
              <Clock className="w-3.5 h-3.5 text-sky-400" /> Waktu Selesai
            </span>
            <span className="font-cartoon text-xl text-sky-300">
              {formatTime(timeElapsed)}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-2.5">
          {hasNextLevel && (
            <button
              onClick={onNextLevel}
              className="w-full py-3.5 rounded-2xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-cartoon text-lg font-bold cartoon-border transition transform active:scale-95 shadow-md flex items-center justify-center gap-2"
            >
              <span>LANJUT LEVEL BERIKUTNYA</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          )}

          <div className="grid grid-cols-2 gap-2.5">
            <button
              onClick={onReplay}
              className="py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-cartoon text-sm cartoon-border-sm transition active:scale-95 flex items-center justify-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Main Lagi</span>
            </button>

            <button
              onClick={onHome}
              className="py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-cartoon text-sm cartoon-border-sm transition active:scale-95 flex items-center justify-center gap-2"
            >
              <Home className="w-4 h-4" />
              <span>Menu Utama</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
