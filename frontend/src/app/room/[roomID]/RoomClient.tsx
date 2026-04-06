"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import useGameSocket from "~/hooks/useGameSocket";
import PlayersListPlaceholder from "~/app/components/PlayersList";
import CanvasPlaceholder from "~/app/components/Canvas";
import ChatBox from "~/app/components/ChatBox";
import GuessBox from "~/app/components/GuessBox";
import TimerPlaceholder from "~/app/components/Timer";
import ScoreBoardPlaceholder from "~/app/components/ScoreBoard";
import GameEndModal from "~/app/components/GameEndModal";
import RoundEndingOverlay from "~/app/components/RoundEndingOverlay";

// TODO: remove later, dev purpose only
function ConnectionBanner({ isConnected }: { isConnected: boolean }) {
  return (
    <div
      className={`px-3 py-1 rounded text-xs font-mono ${
        isConnected
          ? "bg-green-900 text-green-300"
          : "bg-red-900 text-red-300 animate-pulse"
      }`}
    >
      {isConnected ? "connected" : "connecting…"}
    </div>
  );
}

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
  } = useGameSocket({ roomID, playerID });

  const [gameEndDismissed, setGameEndDismissed] = useState(false);

  useEffect(() => {
    if (gameState.lastError) {
      toast.error(gameState.lastError.message, {
        description: gameState.lastError.code,
      });
    }
  }, [gameState.lastError]);

  const isHost =
    playerID === gameState.players.find((p) => p.role === "host")?.id;

  const drawer = gameState.players.find((p) => p.id === gameState.drawerID);
  const drawerName = drawer?.userName ?? null;
  const isDrawer = playerID === gameState.drawerID;

  return (
    <main className="h-screen overflow-hidden bg-neutral-950 text-neutral-100 flex flex-col">
      {gameState.status === "finished" && gameState.winner && !gameEndDismissed && (
        <GameEndModal
          winner={gameState.winner}
          scores={gameState.scores}
          players={gameState.players}
          onClose={() => setGameEndDismissed(true)}
        />
      )}
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-3 border-b border-neutral-800">
        <div className="flex items-center gap-3">
          <span className="font-bold text-lg">skribble</span>
          <span className="font-mono text-xs text-neutral-500">{roomID}</span>
        </div>
        <div className="flex items-center gap-4">
          {gameState.status === "in_progress" && (
            <span className="text-xs text-neutral-400">
              Current Drawer: {drawerName}
            </span>
          )}
          <span className="text-xs text-neutral-400">
            Ur da real: {isHost ? "host" : "player"}
          </span>
          <TimerPlaceholder
            secondsRemaining={gameState.secondsRemaining}
            status={gameState.status}
            currentRound={gameState.currentRound}
            currentRotation={gameState.currentRotation}
            totalRotations={gameState.totalRotations}
            playersPerRotation={gameState.drawOrder.length}
          />
          <ConnectionBanner isConnected={isConnected} />
        </div>
      </header>

      {/* Body */}
      <div className="flex flex-1 gap-4 p-4 min-h-0">
        {/* Left sidebar — players + scores */}
        <aside className="w-52 flex flex-col gap-4 shrink-0">
          <PlayersListPlaceholder players={gameState.players} />
          <ScoreBoardPlaceholder
            scores={gameState.scores}
            players={gameState.players}
          />

          {/* Host-only start button — visible while waiting */}
          {gameState.status === "waiting" &&
            (isHost ? (
              <button
                onClick={sendGameStart}
                className="rounded border border-yellow-600 bg-yellow-400 px-4 py-2 text-sm font-bold text-yellow-950 hover:bg-yellow-300 transition-colors"
              >
                Start Game
              </button>
            ) : (
              <div className="rounded border border-yellow-700 bg-yellow-950 px-3 py-3 flex flex-col gap-1">
                <p className="text-yellow-300 text-xs font-semibold uppercase tracking-wide">
                  Waiting
                </p>
                <p className="text-yellow-200/70 text-xs leading-snug">
                  The host will start the game soon…
                </p>
              </div>
            ))}

          {/* Drawer word — only shown to the drawer */}
          {drawerWord && (
            <div className="rounded bg-yellow-900 border border-yellow-700 px-3 py-2 text-sm">
              <span className="text-yellow-400 font-semibold">Draw: </span>
              <span className="text-yellow-200 font-bold">{drawerWord}</span>
            </div>
          )}
        </aside>

        {/* Center — canvas */}
        <div className="relative flex flex-col flex-1 gap-4 min-w-0">
          <CanvasPlaceholder
            drawerID={gameState.drawerID}
            myPlayerID={playerID}
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

        {/* Right sidebar — guesses + chat */}
        <aside className="w-64 flex flex-col gap-3 shrink-0 min-h-0">
          <GuessBox
            guesses={guessLog}
            players={gameState.players}
            isDrawer={isDrawer}
            onGuess={sendGuess}
          />
          <ChatBox
            messages={chatLog}
            players={gameState.players}
            onSend={sendChat}
          />
        </aside>
      </div>
    </main>
  );
}
