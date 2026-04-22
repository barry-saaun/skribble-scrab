"use client";

interface Props {
  isConnected: boolean;
  roomID: string;
  playerCount: number;
}

export default function RoomFooter({ isConnected, roomID, playerCount }: Props) {
  return (
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
        <span>{playerCount} PLAYERS</span>
      </div>
    </footer>
  );
}
