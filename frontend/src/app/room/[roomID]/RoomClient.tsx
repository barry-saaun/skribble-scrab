"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import useGameSocket from "~/hooks/useGameSocket";
import usePlayerPresence from "~/hooks/usePlayerPresence";
import Canvas from "~/app/components/Canvas";
import ChatBox from "~/app/components/ChatBox";
import GameEndModal from "~/app/components/GameEndModal";
import GuessBox from "~/app/components/GuessBox";
import PlayersSidebar from "~/app/components/PlayersSidebar";
import RoomFooter from "~/app/components/RoomFooter";
import RoomHeader from "~/app/components/RoomHeader";
import RoundEndingOverlay from "~/app/components/RoundEndingOverlay";
import type { CanvasHandle, DrawStrokePayload } from "~/types/events";
import {
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

  const {
    handleLeave,
    setConfirmLeave,
    isNextDrawer,
    showConfirmLeave,
    isIntermission,
  } = usePlayerPresence({ gameState, playerID, sendLeave });

  const [gameEndDismissed, setGameEndDismissed] = useState(false);
  const canvasRef = useRef<CanvasHandle>(null);

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

      <RoomHeader
        roomID={roomID}
        isDrawer={isDrawer}
        gameState={gameState}
        showConfirmLeave={showConfirmLeave}
        isNextDrawer={isNextDrawer}
        isIntermission={isIntermission}
        handleLeave={handleLeave}
        setConfirmLeave={setConfirmLeave}
      />

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
        <PlayersSidebar
          players={gameState.players}
          scores={gameState.scores}
          drawerID={gameState.drawerID}
          username={username}
          status={gameState.status}
          isHost={isHost}
          drawerWord={drawerWord}
          onStartGame={sendGameStart}
        />

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

        {/* Right panel — Guesses + Chat */}
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

      <RoomFooter
        isConnected={isConnected}
        roomID={roomID}
        playerCount={gameState.players.length}
      />
    </div>
  );
}
