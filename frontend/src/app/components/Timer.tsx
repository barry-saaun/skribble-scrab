import type { GameStatus } from "~/types/game";

interface TimerProps {
  secondsRemaining: number | null;
  status: GameStatus;
  currentRound: number;
  currentRotation: number;
  totalRotations: number;
  playersPerRotation: number; // drawOrder.length
}

export default function Timer({
  secondsRemaining,
  status,
  currentRound,
  currentRotation,
  totalRotations,
  playersPerRotation,
}: TimerProps) {
  if (status !== "in_progress") return null;

  const roundInRotation =
    playersPerRotation > 0
      ? ((currentRound - 1) % playersPerRotation) + 1
      : currentRound;

  const isLow = secondsRemaining !== null && secondsRemaining <= 10;

  return (
    <div className="flex items-center gap-4">
      {/* Rotation + round progress */}
      <div className="flex flex-col items-end gap-0.5">
        <span className="text-xs text-neutral-400 font-mono">
          Rotation {currentRotation}/{totalRotations}
        </span>
        <span className="text-xs text-neutral-500 font-mono">
          Round {roundInRotation}/{playersPerRotation}
        </span>
      </div>

      {/* Countdown */}
      <div
        className={`rounded px-3 py-1 font-mono text-xl font-bold tabular-nums transition-colors ${
          isLow
            ? "bg-red-900 text-red-300"
            : "bg-neutral-800 text-white"
        }`}
      >
        {secondsRemaining !== null ? secondsRemaining : "--"}
      </div>
    </div>
  );
}
