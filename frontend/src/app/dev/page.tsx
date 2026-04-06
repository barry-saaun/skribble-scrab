"use client";
import { useCallback, useRef, useState } from "react";
import { env } from "~/env";

type LogEntry = { dir: "in" | "out" | "info"; text: string; ts: string };

type GameState = {
  round: number;
  drawerId: string;
  word?: string;
  status: "waiting" | "in_progress" | "finished";
};

function ts() {
  return new Date().toLocaleTimeString("en-US", { hour12: false });
}

function useWsPanel() {
  const ref = useRef<WebSocket | null>(null);
  const [status, setStatus] = useState<
    "disconnected" | "connecting" | "connected"
  >("disconnected");
  const [log, setLog] = useState<LogEntry[]>([]);
  const [gameState, setGameState] = useState<GameState | null>(null);

  const push = useCallback((entry: LogEntry) => {
    setLog((prev) => [...prev, entry]);
  }, []);

  const connect = useCallback(
    (roomID: string, playerID: string) => {
      if (ref.current?.readyState === WebSocket.OPEN) return;
      setStatus("connecting");
      push({
        dir: "info",
        text: `Connecting as ${playerID} to room ${roomID}…`,
        ts: ts(),
      });

      const ws = new WebSocket(
        `${env.NEXT_PUBLIC_WS_BASE_URL}/ws?roomID=${encodeURIComponent(roomID)}&playerID=${encodeURIComponent(playerID)}`,
      );
      ref.current = ws;
      ws.onopen = () => {
        setStatus("connected");
        push({ dir: "info", text: "Connected", ts: ts() });
      };
      ws.onmessage = (e) => {
        const raw = e.data as string;
        try {
          const msg = JSON.parse(raw) as { type: string; payload: unknown };
          if (msg.type === "game.state") {
            setGameState(msg.payload as GameState);
          }
          push({ dir: "in", text: JSON.stringify(msg, null, 2), ts: ts() });
        } catch {
          push({ dir: "in", text: raw, ts: ts() });
        }
      };
      ws.onclose = () => {
        setStatus("disconnected");
        push({ dir: "info", text: "Disconnected", ts: ts() });
      };
      ws.onerror = () => {
        push({ dir: "info", text: "WebSocket error", ts: ts() });
      };
    },
    [push],
  );

  const disconnect = useCallback(() => {
    ref.current?.close();
    setGameState(null);
  }, []);

  const send = useCallback(
    (msg: string) => {
      if (ref.current?.readyState !== WebSocket.OPEN) {
        push({ dir: "info", text: "Not connected", ts: ts() });
        return;
      }
      ref.current.send(msg);
      let text = msg;
      try {
        text = JSON.stringify(JSON.parse(msg), null, 2);
      } catch {
        /* leave as-is */
      }
      push({ dir: "out", text, ts: ts() });
    },
    [push],
  );

  const clear = useCallback(() => setLog([]), []);

  return { status, log, gameState, connect, disconnect, send, clear };
}

type Panel = ReturnType<typeof useWsPanel>;

function GameStateBadge({ gs }: { gs: GameState }) {
  const statusColor =
    gs.status === "in_progress"
      ? "text-green-400"
      : gs.status === "finished"
        ? "text-neutral-400"
        : "text-yellow-400";

  return (
    <div className="rounded bg-neutral-800 border border-neutral-600 p-3 flex flex-col gap-1 font-mono text-xs">
      <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wide mb-1">
        Game State
      </p>
      <div className="flex gap-4 flex-wrap">
        <span>
          <span className="text-neutral-500">status </span>
          <span className={statusColor}>{gs.status}</span>
        </span>
        <span>
          <span className="text-neutral-500">round </span>
          <span className="text-white">{gs.round}</span>
        </span>
        <span>
          <span className="text-neutral-500">drawer </span>
          <span className="text-blue-300">{gs.drawerId}</span>
        </span>
        {gs.word ? (
          <span>
            <span className="text-neutral-500">word </span>
            <span className="text-yellow-300 font-bold">{gs.word}</span>
          </span>
        ) : (
          <span className="text-neutral-600 italic">word hidden</span>
        )}
      </div>
    </div>
  );
}

function WsPanel({
  label,
  panel,
  roomID,
  defaultPlayerID,
  isHost,
}: {
  label: string;
  panel: Panel;
  roomID: string;
  defaultPlayerID: string;
  isHost: boolean;
}) {
  const [playerID, setPlayerID] = useState(defaultPlayerID);
  const [customMsg, setCustomMsg] = useState("");
  const [guessWord, setGuessWord] = useState("cat");
  const [chatText, setChatText] = useState("hello!");

  const statusColor =
    panel.status === "connected"
      ? "text-green-400"
      : panel.status === "connecting"
        ? "text-yellow-400"
        : "text-red-400";

  return (
    <section className="flex flex-col gap-3 rounded border border-neutral-700 bg-neutral-900 p-4 min-w-0">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">{label}</h2>
        <span className={`text-sm font-mono ${statusColor}`}>
          {panel.status}
        </span>
      </div>

      {/* Player ID + connect/disconnect */}
      <div className="flex gap-2 items-end">
        <div className="flex flex-col gap-1 flex-1">
          <label className="text-xs text-neutral-400">Player ID</label>
          <input
            className="rounded bg-neutral-800 px-2 py-1 font-mono text-sm"
            value={playerID}
            onChange={(e) => setPlayerID(e.target.value)}
          />
        </div>
        <button
          onClick={() => panel.connect(roomID, playerID)}
          disabled={panel.status !== "disconnected" || !roomID}
          className="rounded bg-green-700 px-3 py-1 text-sm disabled:opacity-40"
        >
          Connect
        </button>
        <button
          onClick={panel.disconnect}
          disabled={panel.status === "disconnected"}
          className="rounded bg-red-700 px-3 py-1 text-sm disabled:opacity-40"
        >
          Disconnect
        </button>
      </div>

      {/* Game state */}
      {panel.gameState && <GameStateBadge gs={panel.gameState} />}

      {/* Quick actions */}
      <div className="flex flex-col gap-2 rounded bg-neutral-800 p-3">
        <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wide">
          Quick actions
        </p>

        {isHost && (
          <button
            onClick={() =>
              panel.send(JSON.stringify({ type: "game.start", payload: {} }))
            }
            className="self-start rounded bg-blue-700 px-3 py-1 text-sm"
          >
            game.start
          </button>
        )}

        <div className="flex gap-2 items-end">
          <div className="flex flex-col gap-1 flex-1">
            <label className="text-xs text-neutral-400">Guess word</label>
            <input
              className="rounded bg-neutral-700 px-2 py-1 font-mono text-sm"
              value={guessWord}
              onChange={(e) => setGuessWord(e.target.value)}
            />
          </div>
          <button
            onClick={() =>
              panel.send(
                JSON.stringify({
                  type: "player.guess",
                  payload: { word: guessWord },
                }),
              )
            }
            className="rounded bg-purple-700 px-3 py-1 text-sm"
          >
            player.guess
          </button>
        </div>

        <div className="flex gap-2 items-end">
          <div className="flex flex-col gap-1 flex-1">
            <label className="text-xs text-neutral-400">Chat text</label>
            <input
              className="rounded bg-neutral-700 px-2 py-1 font-mono text-sm"
              value={chatText}
              onChange={(e) => setChatText(e.target.value)}
            />
          </div>
          <button
            onClick={() =>
              panel.send(
                JSON.stringify({
                  type: "chat.message",
                  payload: { text: chatText },
                }),
              )
            }
            className="rounded bg-amber-700 px-3 py-1 text-sm"
          >
            chat.message
          </button>
        </div>
      </div>

      {/* Custom message */}
      <div className="flex flex-col gap-1">
        <label className="text-xs text-neutral-400">Custom JSON</label>
        <div className="flex gap-2">
          <textarea
            className="flex-1 rounded bg-neutral-800 px-2 py-1 font-mono text-xs"
            rows={3}
            value={customMsg}
            onChange={(e) => setCustomMsg(e.target.value)}
            placeholder='{"type":"...","payload":{}}'
          />
          <button
            onClick={() => {
              panel.send(customMsg);
              setCustomMsg("");
            }}
            className="self-end rounded bg-neutral-600 px-3 py-1 text-sm"
          >
            Send
          </button>
        </div>
      </div>

      {/* Log */}
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wide">
          Log
        </p>
        <button
          onClick={panel.clear}
          className="text-xs text-neutral-500 hover:text-neutral-300"
        >
          clear
        </button>
      </div>
      <div className="h-72 overflow-y-auto rounded bg-black p-2 font-mono text-xs flex flex-col gap-1">
        {panel.log.length === 0 && (
          <p className="text-neutral-600 italic">No messages yet</p>
        )}
        {panel.log.map((entry, i) => (
          <div key={i} className="flex gap-2">
            <span className="shrink-0 text-neutral-600">{entry.ts}</span>
            <span
              className={
                entry.dir === "in"
                  ? "text-green-400"
                  : entry.dir === "out"
                    ? "text-blue-400"
                    : "text-neutral-400"
              }
            >
              {entry.dir === "in" ? "←" : entry.dir === "out" ? "→" : "·"}
            </span>
            <pre className="whitespace-pre-wrap break-all">{entry.text}</pre>
          </div>
        ))}
      </div>
    </section>
  );
}

type HttpLog = { label: string; status: number | null; body: string };

export default function DevPage() {
  const [hostID, setHostID] = useState("host-1");
  const [hostUsername, setHostUsername] = useState("barry");
  const [roomID, setRoomID] = useState("");
  const [joinPlayerID, setJoinPlayerID] = useState("player-2");
  const [joinUsername, setJoinUsername] = useState("alice");
  const [httpLog, setHttpLog] = useState<HttpLog[]>([]);

  const hostPanel = useWsPanel();
  const playerPanel = useWsPanel();

  async function post(path: string, body: object, label: string) {
    try {
      const res = await fetch(`${env.NEXT_PUBLIC_WS_BASE_URL.replace(/^ws(s?):\/\//, "http$1://")}${path}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const text = await res.text();
      let pretty = text;
      try {
        pretty = JSON.stringify(JSON.parse(text), null, 2);
      } catch {
        /* leave as-is */
      }
      setHttpLog((prev) => [
        ...prev,
        { label, status: res.status, body: pretty },
      ]);
      return { ok: res.ok, text };
    } catch (err) {
      setHttpLog((prev) => [
        ...prev,
        { label, status: null, body: String(err) },
      ]);
      return { ok: false, text: "" };
    }
  }

  async function createRoom() {
    const { ok, text } = await post(
      "/api/rooms",
      { hostID, hostUsername },
      "POST /api/rooms",
    );
    if (ok) {
      try {
        const data = JSON.parse(text) as { roomId?: string; id?: string };
        const id = data.roomId ?? data.id ?? "";
        if (id) setRoomID(id);
      } catch {
        /* ignore */
      }
    }
  }

  async function joinRoom() {
    await post(
      `/api/rooms/${roomID}/join`,
      { playerID: joinPlayerID, playerUsername: joinUsername },
      `POST /api/rooms/${roomID}/join`,
    );
  }

  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-100 p-6 flex flex-col gap-6">
      <h1 className="text-2xl font-bold">
        Dev Harness{" "}
        <span className="text-sm font-normal text-neutral-500">/dev</span>
      </h1>

      {/* HTTP Setup */}
      <section className="rounded border border-neutral-700 bg-neutral-900 p-4 flex flex-col gap-4">
        <h2 className="text-sm font-semibold text-neutral-300 uppercase tracking-wide">
          HTTP Setup
        </h2>

        <div className="grid grid-cols-2 gap-6">
          {/* Step 1 */}
          <div className="flex flex-col gap-2">
            <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wide">
              Step 1 — Create Room
            </p>
            <div className="flex gap-2">
              <div className="flex flex-col gap-1 flex-1">
                <label className="text-xs text-neutral-400">Host ID</label>
                <input
                  className="rounded bg-neutral-800 px-2 py-1 font-mono text-sm"
                  value={hostID}
                  onChange={(e) => setHostID(e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-1 flex-1">
                <label className="text-xs text-neutral-400">
                  Host Username
                </label>
                <input
                  className="rounded bg-neutral-800 px-2 py-1 font-mono text-sm"
                  value={hostUsername}
                  onChange={(e) => setHostUsername(e.target.value)}
                />
              </div>
            </div>
            <button
              onClick={createRoom}
              className="self-start rounded bg-blue-700 px-4 py-1.5 text-sm"
            >
              Create Room
            </button>
          </div>

          {/* Step 2 */}
          <div className="flex flex-col gap-2">
            <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wide">
              Step 2 — Join Room
            </p>
            <div className="flex gap-2">
              <div className="flex flex-col gap-1 w-40">
                <label className="text-xs text-neutral-400">Room ID</label>
                <input
                  className="rounded bg-neutral-800 px-2 py-1 font-mono text-sm"
                  value={roomID}
                  onChange={(e) => setRoomID(e.target.value)}
                  placeholder="auto-filled"
                />
              </div>
              <div className="flex flex-col gap-1 flex-1">
                <label className="text-xs text-neutral-400">Player ID</label>
                <input
                  className="rounded bg-neutral-800 px-2 py-1 font-mono text-sm"
                  value={joinPlayerID}
                  onChange={(e) => setJoinPlayerID(e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-1 flex-1">
                <label className="text-xs text-neutral-400">Username</label>
                <input
                  className="rounded bg-neutral-800 px-2 py-1 font-mono text-sm"
                  value={joinUsername}
                  onChange={(e) => setJoinUsername(e.target.value)}
                />
              </div>
            </div>
            <button
              onClick={joinRoom}
              disabled={!roomID}
              className="self-start rounded bg-green-700 px-4 py-1.5 text-sm disabled:opacity-40"
            >
              Join Room
            </button>
          </div>
        </div>

        {/* HTTP log */}
        {httpLog.length > 0 && (
          <div className="flex flex-col gap-2 mt-1">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wide">
                HTTP Responses
              </p>
              <button
                onClick={() => setHttpLog([])}
                className="text-xs text-neutral-500 hover:text-neutral-300"
              >
                clear
              </button>
            </div>
            <div className="flex flex-col gap-2">
              {httpLog.map((entry, i) => (
                <div key={i} className="rounded bg-black p-2 font-mono text-xs">
                  <div className="flex gap-2 items-center mb-1">
                    <span className="text-neutral-400">{entry.label}</span>
                    <span
                      className={
                        entry.status !== null && entry.status < 300
                          ? "text-green-400"
                          : "text-red-400"
                      }
                    >
                      {entry.status ?? "error"}
                    </span>
                  </div>
                  <pre className="whitespace-pre-wrap break-all text-neutral-300">
                    {entry.body}
                  </pre>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* Active room banner */}
      {roomID && (
        <div className="rounded bg-neutral-800 px-4 py-2 font-mono text-sm">
          <span className="text-neutral-400">Active room: </span>
          <span className="text-yellow-300 font-bold">{roomID}</span>
        </div>
      )}

      {/* Step 3 — WS panels */}
      <div className="grid grid-cols-2 gap-4">
        <WsPanel
          label="Host (step 3)"
          panel={hostPanel}
          roomID={roomID}
          defaultPlayerID="host-1"
          isHost={true}
        />
        <WsPanel
          label="Player (step 3)"
          panel={playerPanel}
          roomID={roomID}
          defaultPlayerID="player-2"
          isHost={false}
        />
      </div>

      <p className="text-xs text-neutral-600">
        Backend: {env.NEXT_PUBLIC_WS_BASE_URL}
      </p>
    </main>
  );
}
