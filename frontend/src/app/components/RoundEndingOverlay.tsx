"use client";

import type { Player } from "~/types/game";

interface Props {
  secondsRemaining: number;
  guesserID: string;
  players: Player[];
}

export default function RoundEndingOverlay({
  secondsRemaining,
  guesserID,
  players,
}: Props) {
  const guesserName =
    players.find((p) => p.id === guesserID)?.displayName ?? guesserID;

  return (
    <div className="absolute inset-0 z-40 flex flex-col items-center justify-center bg-black/60 pointer-events-none select-none">
      <div
        className="flex flex-col items-center gap-4 border-4 border-yellow-400 bg-neutral-900 px-10 py-8"
        style={{ boxShadow: "6px 6px 0px #ca8a04" }}
      >
        <p className="font-mono text-xs uppercase tracking-widest text-yellow-400/70">
          correct guess
        </p>
        <p className="font-black text-2xl uppercase text-yellow-400 leading-none tracking-tight">
          {guesserName}
        </p>
        <p className="font-mono text-[5rem] font-black leading-none text-neutral-100 tabular-nums">
          {secondsRemaining}
        </p>
        <p className="font-mono text-xs uppercase tracking-widest text-neutral-500">
          next round starting
        </p>
      </div>
    </div>
  );
}
