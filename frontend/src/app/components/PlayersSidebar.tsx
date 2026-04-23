"use client";

import { useState } from "react";
import type { GameStatus, Player } from "~/types/game";

interface Props {
  players: Player[];
  scores: Record<string, number>;
  drawerID: string | null;
  username: string;
  status: GameStatus;
  isHost: boolean;
  drawerWord: string | null;
  onStartGame: () => void;
  onTransferHost: (targetPlayerID: string) => void;
}

export default function PlayersSidebar({
  players,
  scores,
  drawerID,
  username,
  status,
  isHost,
  drawerWord,
  onStartGame,
  onTransferHost,
}: Props) {
  const [transferTarget, setTransferTarget] = useState<string | null>(null);

  const handleConfirmTransfer = (playerID: string) => {
    onTransferHost(playerID);
    setTransferTarget(null);
  };

  return (
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
        {players.map((p, i) => {
          const isTransferTarget = transferTarget === p.id;
          // Show transfer button only when I'm host, lobby is open, target is not
          // the current host, and they're actually connected
          const canPromote =
            isHost && status === "waiting" && p.role !== "host" && p.connected;

          return (
            <div
              key={p.id}
              className="group flex items-center gap-2 px-3 py-2.5 min-w-35 lg:min-w-0 shrink-0"
              style={{
                borderRight: "1px solid var(--border)",
                borderBottom: "1px solid var(--border)",
                background:
                  p.userName === username ? "var(--secondary)" : "transparent",
              }}
            >
              <span className="font-mono text-[10px] text-muted-foreground w-4 shrink-0">
                {String(i + 1).padStart(2, "0")}
              </span>

              <div
                className="w-6 h-6 shrink-0 flex items-center justify-center font-mono font-bold text-[10px]"
                style={{
                  background:
                    p.id === drawerID ? "var(--primary)" : "var(--secondary)",
                  color:
                    p.id === drawerID
                      ? "oklch(0.975 0.010 80)"
                      : "var(--foreground)",
                  border:
                    p.id === drawerID ? "none" : "1px solid var(--border)",
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
                  {scores[p.id] ?? 0} PTS
                </div>
              </div>

              {/* Right-side slot: drawer pulse, HOST badge, or transfer UI */}
              {p.id === drawerID ? (
                <div
                  className="w-1.5 h-1.5 rounded-full animate-pulse shrink-0"
                  style={{ background: "var(--primary)" }}
                />
              ) : isTransferTarget ? (
                /* ── Inline transfer confirmation ── */
                <div className="flex items-center gap-1 shrink-0 confirm-leave-enter">
                  <span className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground hidden lg:inline">
                    HOST?
                  </span>
                  <button
                    onClick={() => handleConfirmTransfer(p.id)}
                    className="font-mono text-[9px] uppercase tracking-widest px-1.5 py-0.5 brut-press"
                    style={{
                      border: "1px solid var(--primary)",
                      color: "var(--primary)",
                    }}
                  >
                    YES
                  </button>
                  <button
                    onClick={() => setTransferTarget(null)}
                    className="font-mono text-[9px] uppercase tracking-widest px-1.5 py-0.5 brut-press"
                    style={{
                      border: "1px solid var(--border)",
                      color: "var(--muted-foreground)",
                    }}
                  >
                    NO
                  </button>
                </div>
              ) : p.role === "host" ? (
                /* ── HOST badge on the host's own row ── */
                <span
                  className="font-mono text-[9px] uppercase tracking-widest px-1 py-0.5 shrink-0"
                  style={{
                    border: "1px solid var(--primary)",
                    color: "var(--primary)",
                  }}
                >
                  HOST
                </span>
              ) : canPromote ? (
                /* ── Promote button (visible on hover on desktop, always on mobile) ── */
                <button
                  onClick={() => setTransferTarget(p.id)}
                  className="font-mono text-[9px] uppercase tracking-widest px-1.5 py-0.5 shrink-0 brut-press lg:opacity-0 lg:group-hover:opacity-100"
                  style={{
                    border: "1px solid var(--border)",
                    color: "var(--muted-foreground)",
                    transition:
                      "opacity 0.1s, box-shadow 0.08s ease-out, transform 0.08s ease-out",
                  }}
                >
                  → HOST
                </button>
              ) : null}
            </div>
          );
        })}
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
          {[...players]
            .sort((a, b) => (scores[b.id] ?? 0) - (scores[a.id] ?? 0))
            .slice(0, 3)
            .map((p, i) => {
              const score = scores[p.id] ?? 0;
              const maxScore = Math.max(...Object.values(scores), 1);
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

      {status === "waiting" && isHost && (
        <button
          onClick={onStartGame}
          className="brut-press m-3 font-mono font-bold uppercase tracking-widest text-xs py-2 px-3 shrink-0"
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
            background: "color-mix(in oklch, var(--primary) 10%, transparent)",
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
  );
}
