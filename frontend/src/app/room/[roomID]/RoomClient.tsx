"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "~/components/ui/tooltip";
import useGameSocket from "~/hooks/useGameSocket";
import Canvas from "~/app/components/Canvas";
import ChatBox from "~/app/components/ChatBox";
import GameEndModal from "~/app/components/GameEndModal";
import GuessBox from "~/app/components/GuessBox";
import RoundEndingOverlay from "~/app/components/RoundEndingOverlay";
import type { CanvasHandle, DrawStrokePayload } from "~/types/events";
import {
  ErrorCode,
  errorMessages,
  toastErrorMessages,
  toastErrorTitles,
  isInlineErrorCode,
  isToastErrorCode,
} from "~/types/errors";

export default function RoomClient({
  roomID,
  playerID,
  username,
}: {
  roomID: string;
  playerID: string;
  username: string;
}) {
  const router = useRouter();
  const {
    gameState,
    drawerWord,
    isConnected,
    chatLog,
    guessLog,
    sendGameStart,
    sendChat,
    sendGuess,
    sendStroke,
    sendClear,
    sendLeave,
    registerDrawCallbacks,
  } = useGameSocket({ roomID, playerID });

  const [gameEndDismissed, setGameEndDismissed] = useState(false);
  const [confirmLeave, setConfirmLeave] = useState(false);
  const canvasRef = useRef<CanvasHandle>(null);

  // Derive whether this player draws next. Only meaningful during intermission
  // (roundLive = false, game in progress).
  // Skips rotation boundaries intentionally:
  // crossing into a new rotation feels like a natural break point.
  const drawerIndex = gameState.drawOrder.findIndex(
    (id) => id === gameState.drawerID,
  );
  const nextIndex = drawerIndex + 1;
  const isNextDrawer =
    gameState.status === "in_progress" &&
    !gameState.roundLive &&
    nextIndex < gameState.drawOrder.length &&
    gameState.drawOrder[nextIndex] === playerID;

  // True only during the post-guess countdown, this is the window where leaving is allowed
  // and we want to draw the player's eye to the Leave button.
  const isIntermission =
    gameState.status === "in_progress" &&
    !gameState.roundLive &&
    gameState.roundEndingCountdown !== null;

  const showConfirmLeave =
    confirmLeave &&
    gameState.status === "in_progress" &&
    !gameState.roundLive &&
    gameState.roundEndingCountdown !== null &&
    isNextDrawer;

  const handleLeave = useCallback(() => {
    sendLeave();
    router.push("/");
  }, [sendLeave, router]);

  const lastError = gameState.lastError;

  const inlineError = useMemo(() => {
    if (!lastError || !isInlineErrorCode(lastError.code)) return undefined;
    return { code: lastError.code };
  }, [lastError]);

  useEffect(() => {
    if (!lastError || !isToastErrorCode(lastError.code)) return;
    toast.error(toastErrorTitles[lastError.code], {
      description: toastErrorMessages[lastError.code],
    });
  }, [lastError]);

  useEffect(() => {
    registerDrawCallbacks(
      (payload) => canvasRef.current?.applyStroke(payload),
      () => canvasRef.current?.clearCanvas(),
    );
  }, [registerDrawCallbacks]);

  const handleStroke = useCallback(
    (payload: DrawStrokePayload) => sendStroke(payload),
    [sendStroke],
  );

  const handleClear = useCallback(() => {
    canvasRef.current?.clearCanvas();
    sendClear();
  }, [sendClear]);

  const isHost =
    playerID === gameState.players.find((p) => p.role === "host")?.id;
  const isDrawer = playerID === gameState.drawerID;

  const secondsLeft = gameState.secondsRemaining ?? 0;
  const timerPct = Math.min((secondsLeft / 60) * 100, 100);
  const timerColor =
    secondsLeft > 20
      ? "var(--primary)"
      : secondsLeft > 10
        ? "#C07A1A"
        : "#C0311A";

  return (
    <div className="h-screen bg-background flex flex-col overflow-hidden font-mono">
      {gameState.status === "finished" &&
        gameState.winner &&
        !gameEndDismissed && (
          <GameEndModal
            winner={gameState.winner}
            scores={gameState.scores}
            players={gameState.players}
            onClose={() => setGameEndDismissed(true)}
          />
        )}

      {/* Top bar */}
      <header
        className="px-4 py-2 flex items-center gap-4 shrink-0 bg-card"
        style={{ borderBottom: "2px solid var(--brut-ink)" }}
      >
        {showConfirmLeave ? (
          // Inline confirm — only shown during intermission when this player draws next
          <div className="inline-flex shrink-0 items-center gap-2">
            <span
              className="font-mono text-[10px] uppercase tracking-widest shrink-0"
              style={{ color: "var(--muted-foreground)" }}
            >
              You&apos;re up next
            </span>
            <button
              onClick={() => setConfirmLeave(false)}
              className="font-mono font-bold uppercase tracking-widest text-[10px] py-1.5 px-3 bg-transparent"
              style={{
                border: "2px solid var(--brut-ink)",
                color: "var(--brut-ink)",
              }}
            >
              Stay
            </button>
            <button
              onClick={handleLeave}
              className="font-mono font-bold uppercase tracking-widest text-[10px] py-1.5 px-3"
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
              {/* span wrapper is required — disabled buttons swallow pointer events so the tooltip would never open */}
              <TooltipTrigger asChild>
                <span className="inline-flex shrink-0">
                  <button
                    onClick={
                      gameState.roundLive
                        ? undefined
                        : isNextDrawer
                          ? () => setConfirmLeave(true)
                          : handleLeave
                    }
                    disabled={gameState.roundLive}
                    className="font-mono font-bold uppercase tracking-widest text-[10px] py-1.5 px-3 bg-transparent transition-all"
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

        <div className="flex items-center gap-2 min-w-0 flex-1">
          <span className="font-mono text-xs text-muted-foreground  tracking-widest hidden sm:block">
            {roomID}
          </span>
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

        {/* Timer */}
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

      {/* Word hint bar */}
      {gameState.status === "in_progress" && (
        <div
          className="px-4 py-2 flex items-center justify-center gap-6 shrink-0 bg-background"
          style={{ borderBottom: "1.5px solid var(--border)" }}
        >
          <span className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
            {isDrawer ? "YOUR WORD:" : "GUESS THE WORD:"}
          </span>
          <span className="font-mono font-bold text-xl tracking-[0.4em] text-foreground">
            {isDrawer ? drawerWord : "_".repeat(gameState.wordLength ?? 7)}
          </span>
        </div>
      )}

      {/* Main layout */}
      <div className="flex-1 flex flex-col lg:flex-row min-h-0 overflow-hidden">
        {/* Players sidebar — horizontal scroll on mobile, vertical on desktop */}
        <aside
          className="lg:w-52 shrink-0 bg-card flex lg:flex-col overflow-x-auto lg:overflow-x-visible overflow-y-hidden lg:overflow-y-auto"
          style={{ borderRight: "2px solid var(--brut-ink)" }}
        >
          <div
            className="font-mono text-xs uppercase tracking-widest text-muted-foreground px-3 py-2 shrink-0 hidden lg:block"
            style={{ borderBottom: "1.5px solid var(--border)" }}
          >
            {"//"} PLAYERS
          </div>

          <div className="flex lg:flex-col min-w-0 w-full">
            {gameState.players.map((p, i) => (
              <div
                key={p.id}
                className="flex items-center gap-2 px-3 py-2.5 min-w-35 lg:min-w-0 shrink-0"
                style={{
                  borderRight: "1px solid var(--border)",
                  borderBottom: "1px solid var(--border)",
                  background:
                    p.userName === username
                      ? "var(--secondary)"
                      : "transparent",
                }}
              >
                <span className="font-mono text-[10px] text-muted-foreground w-4 shrink-0">
                  {String(i + 1).padStart(2, "0")}
                </span>

                <div
                  className="w-6 h-6 shrink-0 flex items-center justify-center font-mono font-bold text-[10px]"
                  style={{
                    background:
                      p.id === gameState.drawerID
                        ? "var(--primary)"
                        : "var(--secondary)",
                    color:
                      p.id === gameState.drawerID
                        ? "oklch(0.975 0.010 80)"
                        : "var(--foreground)",
                    border:
                      p.id === gameState.drawerID
                        ? "none"
                        : "1px solid var(--border)",
                  }}
                >
                  {p.userName.charAt(0).toUpperCase()}
                </div>

                <div className="min-w-0 flex-1">
                  <div
                    className="font-mono text-[10px] font-bold truncate"
                    style={{
                      color:
                        p.userName === username
                          ? "var(--primary)"
                          : "var(--foreground)",
                    }}
                  >
                    {p.userName}
                  </div>
                  <div className="font-mono text-[10px] text-muted-foreground">
                    {gameState.scores[p.id] ?? 0} PTS
                  </div>
                </div>

                {p.id === gameState.drawerID && (
                  <div
                    className="w-1.5 h-1.5 rounded-full animate-pulse shrink-0"
                    style={{ background: "var(--primary)" }}
                  />
                )}
              </div>
            ))}
          </div>

          {/* Standings — desktop only */}
          <div
            className="hidden lg:block mt-auto p-3"
            style={{ borderTop: "1.5px solid var(--border)" }}
          >
            <div className="font-mono text-xs uppercase tracking-widest text-muted-foreground mb-2">
              {"//"} STANDINGS
            </div>
            <div className="flex flex-col gap-1">
              {[...gameState.players]
                .sort(
                  (a, b) =>
                    (gameState.scores[b.id] ?? 0) -
                    (gameState.scores[a.id] ?? 0),
                )
                .slice(0, 3)
                .map((p, i) => {
                  const score = gameState.scores[p.id] ?? 0;
                  const maxScore = Math.max(
                    ...Object.values(gameState.scores),
                    1,
                  );
                  return (
                    <div key={p.id} className="flex items-center gap-2">
                      <span
                        className="font-mono text-[10px] font-bold w-3"
                        style={{ color: "var(--primary)" }}
                      >
                        {i + 1}
                      </span>
                      <div
                        className="h-1.5 flex-1"
                        style={{
                          width: `${Math.min((score / maxScore) * 100, 100)}%`,
                          background:
                            "color-mix(in oklch, var(--primary) 60%, transparent)",
                        }}
                      />
                      <span className="font-mono text-[10px] text-muted-foreground shrink-0">
                        {score}
                      </span>
                    </div>
                  );
                })}
            </div>
          </div>

          {/* Start game / drawer word */}
          {gameState.status === "waiting" && isHost && (
            <button
              onClick={sendGameStart}
              className="m-3 font-mono font-bold uppercase tracking-widest text-xs py-2 px-3 shrink-0 transition-all"
              style={{
                border: "2px solid var(--primary)",
                background: "var(--primary)",
                color: "oklch(0.975 0.010 80)",
              }}
            >
              Start Game
            </button>
          )}

          {drawerWord && (
            <div
              className="m-3 p-2 shrink-0 font-mono text-xs"
              style={{
                border: "1.5px solid var(--primary)",
                background:
                  "color-mix(in oklch, var(--primary) 10%, transparent)",
              }}
            >
              <span className="uppercase tracking-widest text-muted-foreground">
                DRAW:{" "}
              </span>
              <span className="font-bold" style={{ color: "var(--primary)" }}>
                {drawerWord}
              </span>
            </div>
          )}
        </aside>

        {/* Canvas */}
        <div className="flex-1 flex flex-col min-h-0 min-w-0 p-2 lg:p-3 overflow-hidden bg-background">
          <Canvas
            ref={canvasRef}
            isDrawer={isDrawer}
            onStroke={handleStroke}
            onClear={handleClear}
          />
          {gameState.roundEndingCountdown !== null &&
            gameState.roundEndingGuesserID !== null &&
            gameState.status !== "finished" && (
              <RoundEndingOverlay
                secondsRemaining={gameState.roundEndingCountdown}
                guesserID={gameState.roundEndingGuesserID}
                players={gameState.players}
              />
            )}
        </div>

        {/* Right panel — Guesses + Chat (300px fixed on mobile, full height on desktop) */}
        <aside
          className="lg:w-72 shrink-0 bg-card flex flex-col h-75 lg:h-auto"
          style={{ borderLeft: "2px solid var(--brut-ink)" }}
        >
          <GuessBox
            guessLog={guessLog}
            players={gameState.players}
            playerCount={gameState.players.length}
            isDrawer={isDrawer}
            gameStatus={gameState.status}
            onGuess={sendGuess}
            inlineError={inlineError}
          />
          <ChatBox
            chatLog={chatLog}
            players={gameState.players}
            username={username}
            isDrawer={isDrawer}
            onSend={sendChat}
          />
        </aside>
      </div>

      {/* Bottom status bar */}
      <footer
        className="px-4 py-2 flex items-center justify-between text-[10px] font-mono text-muted-foreground shrink-0 bg-card"
        style={{ borderTop: "2px solid var(--brut-ink)" }}
      >
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <div
              className="w-1.5 h-1.5 rounded-full animate-pulse"
              style={{ background: isConnected ? "#1A8C3A" : "#C0311A" }}
            />
            <span>{isConnected ? "LIVE" : "CONNECTING"}</span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <span>
            ROOM: <span style={{ color: "var(--primary)" }}>{roomID}</span>
          </span>
          <span>{gameState.players.length} PLAYERS</span>
        </div>
      </footer>
    </div>
  );
}
