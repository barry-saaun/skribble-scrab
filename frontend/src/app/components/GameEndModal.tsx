"use client";

import type { Player } from "~/types/game";

interface Props {
  winner: string; // playerID
  scores: Record<string, number>;
  players: Player[];
  onClose: () => void;
}

export default function GameEndModal({
  winner,
  scores,
  players,
  onClose,
}: Props) {
  const getPlayerName = (id: string) =>
    players.find((p) => p.id === id)?.displayName ?? id;

  const sorted = Object.entries(scores).sort(([, a], [, b]) => b - a);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75">
      <div
        className="bg-neutral-900 border-4 border-yellow-400 text-neutral-100 w-full max-w-md mx-4"
        style={{ boxShadow: "8px 8px 0px #ca8a04" }}
      >
        {/* Header bar */}
        <div className="bg-yellow-400 px-6 py-3 flex items-center justify-between">
          <span className="font-mono text-xs uppercase tracking-widest text-black font-bold">
            game over
          </span>
          <button
            onClick={onClose}
            className="font-mono text-xs uppercase tracking-widest text-black/60 hover:text-black transition-colors"
          >
            [close]
          </button>
        </div>

        {/* Winner block */}
        <div className="px-6 pt-6 pb-4 border-b-4 border-yellow-400/30">
          <p className="font-mono text-xs uppercase tracking-widest text-yellow-400/70 mb-1">
            winner
          </p>
          <p className="font-black text-5xl uppercase leading-none tracking-tight break-all text-yellow-400">
            {getPlayerName(winner)}
          </p>
        </div>

        {/* Scoreboard */}
        <div className="px-6 py-4 border-b-4 border-yellow-400/30">
          <p className="font-mono text-xs uppercase tracking-widest text-yellow-400/70 mb-3">
            final scores
          </p>
          <ol className="flex flex-col gap-1">
            {sorted.map(([id, score], i) => (
              <li
                key={id}
                className={`flex items-center justify-between px-3 py-2 border-2 font-mono text-sm ${
                  i === 0
                    ? "border-yellow-400 bg-yellow-400/10 text-yellow-300"
                    : "border-neutral-700 bg-neutral-800 text-neutral-300"
                }`}
              >
                <span className="font-bold">
                  {i + 1}. {getPlayerName(id)}
                </span>
                <span className="font-black">{score}</span>
              </li>
            ))}
          </ol>
        </div>

        {/* Footer */}
        <div className="px-6 py-4">
          <p className="font-mono text-xs text-neutral-600 uppercase tracking-widest text-center">
            thanks for playing
          </p>
        </div>
      </div>
    </div>
  );
}
