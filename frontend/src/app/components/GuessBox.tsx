"use client";

import { useRef, useState } from "react";
import { inlineErrorMessages } from "~/types/errors";
import type { GuessEntry } from "~/types/events";
import type { InlineErrorPayload } from "~/types/errors";

export default function GuessBox({
  guessLog,
  players,
  playerCount,
  isDrawer,
  gameStatus,
  onGuess,
  inlineError,
}: {
  guessLog: GuessEntry[];
  players: { id: string; userName: string }[];
  playerCount: number;
  isDrawer: boolean;
  gameStatus: string;
  onGuess: (word: string) => void;
  inlineError?: InlineErrorPayload;
}) {
  const [guessInput, setGuessInput] = useState("");
  const guessBottomRef = useRef<HTMLDivElement>(null);

  const handleGuess = () => {
    if (!guessInput.trim()) return;
    onGuess(guessInput.trim());
    setGuessInput("");
  };

  return (
    <div
      className="flex flex-col flex-1 min-h-0"
      style={{ borderBottom: "1.5px solid var(--border)" }}
    >
      <div
        className="font-mono text-xs uppercase tracking-widest text-muted-foreground px-3 py-2 shrink-0 flex items-center justify-between"
        style={{ borderBottom: "1.5px solid var(--border)" }}
      >
        <span>{"//"} GUESSES</span>
        <span className="font-bold text-foreground">{playerCount} ONLINE</span>
      </div>
      <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-1.5 min-h-0">
        {guessLog.length === 0 ? (
          <p className="font-mono text-xs text-muted-foreground italic">
            No correct guesses yet.
          </p>
        ) : (
          guessLog.map((g, i) => (
            <div
              key={i}
              className="font-mono text-xs px-2 py-1 font-bold"
              style={{
                background:
                  "color-mix(in oklch, var(--primary) 10%, transparent)",
                border:
                  "1px solid color-mix(in oklch, var(--primary) 40%, transparent)",
                color: "var(--primary)",
              }}
            >
              <span style={{ marginRight: "4px" }}>■</span>
              {players.find((p) => p.id === g.playerID)?.userName} guessed:{" "}
              {g.word}
            </div>
          ))
        )}
        <div ref={guessBottomRef} />
      </div>

      {gameStatus === "in_progress" && !isDrawer && (
        <div
          className="p-2 flex flex-col gap-1 shrink-0"
          style={{ borderTop: "1.5px solid var(--border)" }}
        >
          <div className="flex gap-2">
            <input
              className="flex-1 font-mono text-xs py-2 px-3 bg-secondary text-foreground"
              style={{ border: "1.5px solid var(--border)", outline: "none" }}
              placeholder="TYPE YOUR GUESS..."
              value={guessInput}
              onChange={(e) => setGuessInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleGuess()}
              onFocus={(e) =>
                (e.target.style.borderColor = "var(--brut-ink)")
              }
              onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
            />
            <button
              onClick={handleGuess}
              className="brut-press font-mono font-bold uppercase tracking-widest text-xs py-2 px-3 shrink-0"
              style={{
                border: "2px solid var(--brut-ink)",
                background: "var(--brut-ink)",
                color: "#F8F3E8",
              }}
            >
              GUESS
            </button>
          </div>
          {inlineError && (
            <p
              className="font-mono text-xs font-bold pl-1"
              style={{
                borderLeft: "2px solid var(--primary)",
                color: "var(--primary)",
              }}
            >
              {inlineErrorMessages[inlineError.code] || "Error"}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
