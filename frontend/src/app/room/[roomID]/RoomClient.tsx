"use client";

import useGameSocket from "~/hooks/useGameSocket";
import PlayersListPlaceholder from "~/app/components/PlayersList";
import CanvasPlaceholder from "~/app/components/Canvas";
import ChatBoxPlaceholder from "~/app/components/ChatBox";
import TimerPlaceholder from "~/app/components/Timer";
import ScoreBoardPlaceholder from "~/app/components/ScoreBoard";

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
  const { gameState, drawerWord, isConnected, sendGameStart } = useGameSocket({
    roomID,
    playerID,
  });

  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-3 border-b border-neutral-800">
        <div className="flex items-center gap-3">
          <span className="font-bold text-lg">skribble</span>
          <span className="font-mono text-xs text-neutral-500">{roomID}</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-xs text-neutral-400">{username}</span>
          <TimerPlaceholder secondsRemaining={gameState.secondsRemaining} />
          <ConnectionBanner isConnected={isConnected} />
        </div>
      </header>

      {/* Body */}
      <div className="flex flex-1 gap-4 p-4 min-h-0">
        {/* Left sidebar — players + scores */}
        <aside className="w-52 flex flex-col gap-4 shrink-0">
          <PlayersListPlaceholder playerCount={gameState.players.length} />
          <ScoreBoardPlaceholder scores={gameState.scores} />

          {/* Host-only start button — visible while waiting */}
          {gameState.status === "waiting" && (
            <button
              onClick={sendGameStart}
              className="rounded bg-blue-700 px-4 py-2 text-sm font-semibold hover:bg-blue-600"
            >
              Start Game
            </button>
          )}

          {/* Drawer word — only shown to the drawer */}
          {drawerWord && (
            <div className="rounded bg-yellow-900 border border-yellow-700 px-3 py-2 text-sm">
              <span className="text-yellow-400 font-semibold">Draw: </span>
              <span className="text-yellow-200 font-bold">{drawerWord}</span>
            </div>
          )}
        </aside>

        {/* Center — canvas */}
        <div className="flex flex-col flex-1 gap-4 min-w-0">
          <CanvasPlaceholder
            drawerID={gameState.drawerID}
            myPlayerID={playerID}
          />
        </div>

        {/* Right sidebar — chat/guess */}
        <aside className="w-64 flex flex-col gap-4 shrink-0">
          <ChatBoxPlaceholder />
        </aside>
      </div>
    </main>
  );
}
