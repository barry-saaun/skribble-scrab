"use client";

import { useRef, useState } from "react";
import type { ChatEntry } from "~/types/events";

export default function ChatBox({
  chatLog,
  players,
  userName,
  isDrawer,
  onSend,
}: {
  chatLog: ChatEntry[];
  players: { id: string; userName: string }[];
  userName: string;
  isDrawer: boolean;
  onSend: (text: string) => void;
}) {
  const [chatInput, setChatInput] = useState("");
  const chatBottomRef = useRef<HTMLDivElement>(null);

  const handleSend = () => {
    if (!chatInput.trim()) return;
    onSend(chatInput.trim());
    setChatInput("");
  };

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <div
        className="font-mono text-xs uppercase tracking-widest text-muted-foreground px-3 py-2 shrink-0"
        style={{ borderBottom: "1.5px solid var(--border)" }}
      >
        {"//"} CHAT{" "}
        {isDrawer && (
          <span className="text-muted-foreground">(YOU ARE DRAWING)</span>
        )}
      </div>
      <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-1.5 min-h-0">
        {chatLog.length === 0 ? (
          <p className="font-mono text-xs text-muted-foreground italic">
            No messages yet.
          </p>
        ) : (
          chatLog.map((m, i) => (
            <div
              key={i}
              className="font-mono text-xs flex gap-2 leading-relaxed"
            >
              <span className="text-muted-foreground shrink-0">
                {String(Math.floor(i / 60)).padStart(2, "0")}:
                {String(i % 60).padStart(2, "0")}
              </span>
              <span
                className="font-bold shrink-0"
                style={{
                  color:
                    players.find((p) => p.id === m.playerID)?.userName ===
                    userName
                      ? "var(--primary)"
                      : "var(--foreground)",
                }}
              >
                {players.find((p) => p.id === m.playerID)?.userName}:
              </span>
              <span className="wrap-break-word min-w-0">{m.text}</span>
            </div>
          ))
        )}
        <div ref={chatBottomRef} />
      </div>

      <div
        className="p-2 flex gap-2 shrink-0"
        style={{ borderTop: "1.5px solid var(--border)" }}
      >
        <input
          className="flex-1 font-mono text-xs py-2 px-3 bg-secondary text-foreground"
          style={{ border: "1.5px solid var(--border)", outline: "none" }}
          placeholder={isDrawer ? "CHAT (YOU ARE DRAWING)..." : "CHAT..."}
          value={chatInput}
          onChange={(e) => setChatInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          onFocus={(e) => (e.target.style.borderColor = "var(--brut-ink)")}
          onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
        />
        <button
          onClick={handleSend}
          className="brut-press font-mono font-bold uppercase tracking-widest text-xs py-2 px-3 shrink-0"
          style={{
            border: "2px solid var(--primary)",
            background: "var(--primary)",
            color: "oklch(0.975 0.010 80)",
          }}
        >
          SEND
        </button>
      </div>
    </div>
  );
}
