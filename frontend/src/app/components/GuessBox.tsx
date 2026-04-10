"use client";

import { useEffect, useRef, useState } from "react";
import { inlineErrorMessages, InlineErrorPayload } from "~/types/errors";
import type { GuessEntry } from "~/types/events";
import { GameState } from "~/types/game";

export default function GuessBox({
  guesses,
  gameState,
  isDrawer,
  onGuess,
  inlineError,
}: {
  guesses: GuessEntry[];
  gameState: GameState;
  isDrawer: boolean;
  onGuess: (word: string) => void;
  inlineError?: InlineErrorPayload;
}) {
  const [draft, setDraft] = useState("");
  const [dismissedError, setDismissedError] = useState<
    InlineErrorPayload | undefined
  >();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const bottomRef = useRef<HTMLDivElement>(null);

  const players = gameState.players;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [guesses]);

  useEffect(() => {
    if (!inlineError) return;
    if (timerRef.current !== null) return; // timer already running — don't reset

    timerRef.current = setTimeout(() => {
      setDismissedError(inlineError);
      timerRef.current = null;
    }, 2000);
  }, [inlineError]);

  // cleanup on unmount only
  useEffect(() => {
    return () => {
      if (timerRef.current !== null) clearTimeout(timerRef.current);
    };
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const word = draft.trim();
    if (!word) return;
    onGuess(word);
    setDraft("");
  };

  const nameOf = (id: string) =>
    players.find((p) => p.id === id)?.userName ?? id;

  const displayError =
    inlineError && inlineError !== dismissedError
      ? inlineError.code
      : undefined;

  return (
    <div className="rounded border border-neutral-700 bg-neutral-900 flex flex-col min-h-0">
      <p className="px-3 pt-3 pb-2 text-xs font-semibold text-neutral-500 uppercase tracking-wide border-b border-neutral-800">
        Guesses
      </p>

      <div className="overflow-y-auto px-3 py-2 flex flex-col gap-1 max-h-40">
        {guesses.length === 0 ? (
          <p className="text-neutral-600 italic text-xs mt-1">
            No correct guesses yet.
          </p>
        ) : (
          guesses.map((g, i) => (
            <div key={i} className="flex items-center gap-2 text-sm">
              <span className="w-2 h-2 rounded-full bg-green-500 shrink-0" />
              <span className="font-semibold text-green-300">
                {nameOf(g.playerID)}
              </span>
              <span className="text-neutral-500 text-xs">guessed</span>
              <span className="text-neutral-300 font-mono text-xs">
                {g.word}
              </span>
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>

      {!isDrawer && (
        <div className="border-t border-neutral-800">
          {displayError && (
            <div className="px-3 py-1.5 text-xs text-red-300 bg-red-950/60 border-b border-red-900/40">
              {inlineErrorMessages[displayError]}
            </div>
          )}
          <form onSubmit={handleSubmit} className="flex">
            <input
              type="text"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Your guess…"
              className="flex-1 bg-transparent px-3 py-2 text-sm text-neutral-200 placeholder-neutral-600 outline-none"
            />
            <button
              type="submit"
              disabled={!draft.trim()}
              className="px-3 py-2 text-xs font-semibold text-blue-400 hover:text-blue-200 disabled:opacity-30 transition-colors"
            >
              Guess
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
