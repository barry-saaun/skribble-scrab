"use client";

import { useState } from "react";
import useGameSocket from "~/hooks/useGameSocket";
import useErrorNotifications from "~/hooks/useErrorNotifications";
import usePlayerPresence from "~/hooks/usePlayerPresence";
import Canvas from "~/app/components/Canvas";
import ChatBox from "~/app/components/ChatBox";
import GameEndModal from "~/app/components/GameEndModal";
import GuessBox from "~/app/components/GuessBox";
import PlayersSidebar from "~/app/components/PlayersSidebar";
import RoomFooter from "~/app/components/RoomFooter";
import RoomHeader from "~/app/components/RoomHeader";
import RoundEndingOverlay from "~/app/components/RoundEndingOverlay";
import useCanvasSync from "~/hooks/useCanvasSync";
import HostLeaveModal from "~/app/components/HostLeaveModal";
import { RoomConfig } from "~/types/game";

export default function RoomClient({
  roomID,
  playerID,
  userName,
  config,
}: {
  roomID: string;
  playerID: string;
  userName: string;
  config: RoomConfig;
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
    sendTransferHost,
    registerDrawCallbacks,
  } = useGameSocket({ roomID, playerID });

  const isHost =
    playerID === gameState.players.find((p) => p.role === "host")?.id;

  const {
    handleLeave,
    onLeaveClick,
    onCancelLeave,
    isNextDrawer,
    showConfirmLeave,
    isIntermission,
    showHostLeaveModal,
    onCancelHostLeave,
    onLeaveRandom,
    onLeaveWithTransfer,
  } = usePlayerPresence({
    gameState,
    playerID,
    isHost,
    sendLeave,
    sendTransferHost,
  });

  const { canvasRef, handleStroke, handleClear } = useCanvasSync({
    registerDrawCallbacks,
    sendClear,
    sendStroke,
  });

  const [gameEndDismissed, setGameEndDismissed] = useState(false);

  const { inlineError } = useErrorNotifications(gameState.lastError);

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

      {showHostLeaveModal && (
        <HostLeaveModal
          players={gameState.players}
          scores={gameState.scores}
          onLeaveRandom={onLeaveRandom}
          onLeaveWithTransfer={onLeaveWithTransfer}
          onCancel={onCancelHostLeave}
        />
      )}

      <RoomHeader
        roomID={roomID}
        roomName={config.name}
        isDrawer={isDrawer}
        gameState={gameState}
        showConfirmLeave={showConfirmLeave}
        isNextDrawer={isNextDrawer}
        isIntermission={isIntermission}
        handleLeave={handleLeave}
        onLeaveClick={onLeaveClick}
        onCancelLeave={onCancelLeave}
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
          userName={userName}
          status={gameState.status}
          isHost={isHost}
          drawerWord={drawerWord}
          onStartGame={sendGameStart}
          onTransferHost={sendTransferHost}
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
            userName={userName}
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
