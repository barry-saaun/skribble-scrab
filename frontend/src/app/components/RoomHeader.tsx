"use client";

import { useState } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "~/components/ui/tooltip";
import { ErrorCode, errorMessages } from "~/types/errors";
import type { GameState } from "~/types/game";

interface Props {
  roomID: string;
  roomName: string;
  isDrawer: boolean;
  gameState: GameState;
  // from usePlayerPresence
  showConfirmLeave: boolean;
  isNextDrawer: boolean;
  isIntermission: boolean;
  handleLeave: () => void;
  onLeaveClick: () => void;
  onCancelLeave: () => void;
}

export default function RoomHeader({
  roomID,
  roomName,
  isDrawer,
  gameState,
  showConfirmLeave,
  isNextDrawer,
  isIntermission,
  handleLeave,
  onLeaveClick,
  onCancelLeave,
}: Props) {
  const [copied, setCopied] = useState(false);

  const secondsLeft = gameState.secondsRemaining ?? 0;
  const timerPct = Math.min((secondsLeft / 60) * 100, 100);
  const timerColor =
    secondsLeft > 20
      ? "var(--primary)"
      : secondsLeft > 10
        ? "#C07A1A"
        : "#C0311A";

  function handleCopy() {
    navigator.clipboard.writeText(roomID).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <header
      className="px-4 py-2 flex items-center gap-4 shrink-0 bg-card"
      style={{ borderBottom: "2px solid var(--brut-ink)" }}
    >
      {showConfirmLeave ? (
        <div className="confirm-leave-enter inline-flex shrink-0 items-center gap-2">
          {isNextDrawer && (
            <span
              className="font-mono text-[10px] uppercase tracking-widest shrink-0"
              style={{ color: "var(--muted-foreground)" }}
            >
              You&apos;re up next
            </span>
          )}
          <button
            onClick={onCancelLeave}
            className="brut-press font-mono font-bold uppercase tracking-widest text-[10px] py-1.5 px-3 bg-transparent"
            style={{
              border: "2px solid var(--brut-ink)",
              color: "var(--brut-ink)",
            }}
          >
            Stay
          </button>
          <button
            onClick={handleLeave}
            className="brut-press font-mono font-bold uppercase tracking-widest text-[10px] py-1.5 px-3"
            style={{
              border: "2px solid var(--primary)",
              background: "var(--primary)",
              color: "oklch(0.975 0.01 80)",
            }}
          >
            Leave
          </button>
        </div>
      ) : (
        <TooltipProvider>
          <Tooltip>
            {/* span wrapper required — disabled buttons swallow pointer events */}
            <TooltipTrigger asChild>
              <span className="inline-flex shrink-0">
                <button
                  onClick={gameState.roundLive ? undefined : onLeaveClick}
                  disabled={gameState.roundLive}
                  className="brut-press font-mono font-bold uppercase tracking-widest text-[10px] py-1.5 px-3 bg-transparent"
                  style={{
                    border: `2px solid ${isIntermission ? "#ca8a04" : "var(--brut-ink)"}`,
                    color: isIntermission ? "#ca8a04" : "var(--brut-ink)",
                    opacity: gameState.roundLive ? 0.35 : 1,
                    cursor: gameState.roundLive ? "not-allowed" : "pointer",
                    pointerEvents: gameState.roundLive ? "none" : "auto",
                    boxShadow: isIntermission
                      ? "var(--brut-shadow-sm)"
                      : "none",
                  }}
                >
                  ← LEAVE
                </button>
              </span>
            </TooltipTrigger>
            {gameState.roundLive && (
              <TooltipContent side="bottom">
                {errorMessages[ErrorCode.CANNOT_LEAVE_MID_ROUND]}
              </TooltipContent>
            )}
          </Tooltip>
        </TooltipProvider>
      )}

      <div className="flex items-center gap-3 min-w-0 flex-1">
        <span
          className="font-mono font-black text-sm uppercase tracking-widest truncate hidden sm:block"
          style={{ color: "var(--foreground)" }}
        >
          <span style={{ color: "var(--muted-foreground)" }}>{"//"}</span>{" "}
          {roomName}
        </span>

        {gameState.status === "waiting" && (
          <span
            className="font-mono text-[10px] px-2 py-0.5 uppercase tracking-wider font-bold shrink-0"
            style={{
              border: "1.5px solid var(--muted-foreground)",
              color: "var(--muted-foreground)",
            }}
          >
            WAITING
          </span>
        )}

        {gameState.status === "in_progress" && (
          <>
            <span
              className="font-mono text-[10px] px-2 py-0.5 uppercase tracking-wider font-bold shrink-0"
              style={{
                border: "1.5px solid var(--brut-ink)",
                color: "var(--brut-ink)",
              }}
            >
              ROUND {gameState.currentRound}/{gameState.totalRotations}
            </span>
            {isDrawer && (
              <span
                className="font-mono text-[10px] px-2 py-0.5 uppercase tracking-wider font-bold shrink-0"
                style={{
                  border: "1.5px solid var(--primary)",
                  color: "var(--primary)",
                }}
              >
                YOU ARE DRAWING
              </span>
            )}
          </>
        )}
      </div>

      {/* Room code + copy — always visible */}
      <div className="hidden sm:flex items-center shrink-0">
        <span
          className="font-mono font-bold text-xs uppercase tracking-widest px-3 py-1.5"
          style={{
            border: "2px solid var(--brut-ink)",
            borderRight: "none",
            color: "var(--foreground)",
            background: "var(--secondary)",
          }}
        >
          {roomID}
        </span>
        <button
          onClick={handleCopy}
          className="brut-press font-mono font-bold text-[10px] uppercase tracking-widest px-2 py-1.5 transition-colors"
          style={{
            border: "2px solid var(--brut-ink)",
            background: copied ? "var(--primary)" : "var(--card)",
            color: copied ? "oklch(0.975 0.01 80)" : "var(--brut-ink)",
          }}
        >
          {copied ? "COPIED!" : "COPY"}
        </button>
      </div>

      {gameState.status === "in_progress" && (
        <div className="flex items-center gap-3 shrink-0">
          <div className="hidden sm:flex items-center gap-2">
            <div
              className="w-28 h-2 overflow-hidden"
              style={{
                border: "1.5px solid var(--border)",
                background: "var(--secondary)",
              }}
            >
              <div
                className="h-full transition-all duration-1000"
                style={{ width: `${timerPct}%`, background: timerColor }}
              />
            </div>
          </div>
          <div
            className="font-mono font-black text-2xl tabular-nums"
            style={{
              color: secondsLeft <= 10 ? "#C0311A" : "var(--foreground)",
            }}
          >
            {String(secondsLeft).padStart(2, "0")}
          </div>
        </div>
      )}
    </header>
  );
}
