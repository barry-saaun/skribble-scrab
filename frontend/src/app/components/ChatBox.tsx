"use client";

import { useEffect, useRef, useState } from "react";
import type { ChatEntry } from "~/types/events";

export default function ChatBox({
  messages,
  players,
  onSend,
}: {
  messages: ChatEntry[];
  players: { id: string; userName: string }[];
  onSend: (text: string) => void;
}) {
  const [draft, setDraft] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const text = draft.trim();
    if (!text) return;
    onSend(text);
    setDraft("");
  };

  const nameOf = (id: string) =>
    players.find((p) => p.id === id)?.userName ?? id;

  return (
    <div className="rounded border border-neutral-700 bg-neutral-900 flex flex-col flex-1 min-h-0">
      <p className="px-3 pt-3 pb-2 text-xs font-semibold text-neutral-500 uppercase tracking-wide border-b border-neutral-800">
        Chat
      </p>

      <div className="flex-1 overflow-y-auto px-3 py-2 flex flex-col gap-1 min-h-0">
        {messages.length === 0 ? (
          <p className="text-neutral-600 italic text-xs mt-1">No messages yet.</p>
        ) : (
          messages.map((m, i) => (
            <div key={i} className="text-sm leading-snug">
              <span className="font-semibold text-neutral-300">{nameOf(m.playerID)}</span>
              <span className="text-neutral-500 mx-1">·</span>
              <span className="text-neutral-400">{m.text}</span>
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>

      <form
        onSubmit={handleSubmit}
        className="border-t border-neutral-800 flex"
      >
        <input
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Say something…"
          className="flex-1 bg-transparent px-3 py-2 text-sm text-neutral-200 placeholder-neutral-600 outline-none"
        />
        <button
          type="submit"
          disabled={!draft.trim()}
          className="px-3 py-2 text-xs font-semibold text-neutral-400 hover:text-neutral-100 disabled:opacity-30 transition-colors"
        >
          Send
        </button>
      </form>
    </div>
  );
}
