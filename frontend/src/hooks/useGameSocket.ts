"use client";
import { useEffect, useReducer, useRef, useState } from "react";
import { useToast } from "~/hooks/useToast";
import { env } from "~/env";
import type {
  ChatEntry,
  DrawStrokePayload,
  EventType,
  GuessEntry,
  ServerMessage,
} from "~/types/events";
import type { GameState } from "~/types/game";

// ---- Initial state ----

const initGameState: GameState = {
  status: "waiting",
  players: [],
  scores: {},
  currentRound: 0,
  currentRotation: 0,
  totalRotations: 0,
  drawOrder: [],
  drawerID: null,
  wordLength: null,
  secondsRemaining: null,
  roundEndingCountdown: null,
  roundEndingGuesserID: null,
  winner: null,
  roundLive: false,
  lastError: null,
};

// ---- Reducer ----

function gameReducer(state: GameState, action: ServerMessage): GameState {
  switch (action.type) {
    case "room.player_list":
      return { ...state, players: action.payload.players };

    case "rotation.start":
      return {
        ...state,
        currentRotation: action.payload.rotationNumber,
        totalRotations: action.payload.totalRotations,
        drawOrder: action.payload.drawOrder,
      };

    case "round.start":
      console.log("rotation.start received", action.payload);
      return {
        ...state,
        drawerID: action.payload.drawerID,
        wordLength: action.payload.wordLength,
        currentRound: action.payload.round,
        status: "in_progress",
        roundLive: true,
        secondsRemaining: null,
        roundEndingCountdown: null,
        roundEndingGuesserID: null,
        lastError: null,
      };

    case "round.ending":
      return {
        ...state,
        roundLive: false,
        roundEndingCountdown: action.payload.secondsRemaining,
        roundEndingGuesserID: action.payload.correctPlayerID,
      };

    case "round.tick":
      return { ...state, secondsRemaining: action.payload.secondsRemaining };

    case "round.end":
      return {
        ...state,
        roundLive: false,
        scores: action.payload.scores,
        secondsRemaining: null,
      };

    case "rotation.complete":
      return { ...state, scores: action.payload.scores };

    case "guess.result":
      return { ...state, scores: action.payload.scores };

    case "game.end":
      return {
        ...state,
        roundLive: false,
        scores: action.payload.scores,
        winner: action.payload.winner,
        status: "finished",
        secondsRemaining: null,
      };

    case "error":
      return { ...state, lastError: action.payload };

    // draw.stroke, draw.clear, chat.message are handled outside the reducer
    default:
      return state;
  }
}

// ---- Hook ----

export default function useGameSocket({
  roomID,
  playerID,
}: {
  roomID: string;
  playerID: string;
}) {
  const { info } = useToast();
  const wsRef = useRef<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [gameState, dispatch] = useReducer(gameReducer, initGameState);

  // Kept outside GameState so the word is never accidentally passed to components
  const [drawerWord, setDrawerWord] = useState<string | null>(null);

  const [chatLog, setChatLog] = useState<ChatEntry[]>([]);
  const [guessLog, setGuessLog] = useState<GuessEntry[]>([]);

  // Stable refs for values used inside the WS onmessage closure that must NOT be
  // listed as useEffect deps — doing so would recreate the WebSocket on every change.
  const playersRef = useRef(gameState.players);
  const infoRef = useRef(info);

  useEffect(() => {
    playersRef.current = gameState.players;
  });

  useEffect(() => {
    infoRef.current = info;
  });
  // Canvas drawing callbacks — registered by parent component
  const applyStrokeCallback = useRef<
    ((payload: DrawStrokePayload) => void) | null
  >(null);
  const applyClearCallback = useRef<(() => void) | null>(null);

  useEffect(() => {
    const ws = new WebSocket(
      `${env.NEXT_PUBLIC_WS_BASE_URL}/api/ws?roomID=${encodeURIComponent(roomID)}&playerID=${encodeURIComponent(playerID)}`,
    );

    wsRef.current = ws;

    ws.onopen = () => {
      if (wsRef.current !== ws) {
        ws.close();
        return;
      }
      setIsConnected(true);
    };
    ws.onclose = () => {
      if (wsRef.current === ws) {
        setIsConnected(false);
      }
    };

    ws.onmessage = (e: MessageEvent) => {
      try {
        const msg = JSON.parse(e.data as string) as ServerMessage;

        // Intercept the drawer's word before dispatching — keep it out of shared state

        if (msg.type === "player.left") {
          const leavingPlayer = playersRef.current.find(
            (p) => p.id === msg.payload.playerID,
          );
          const name = leavingPlayer?.userName ?? "A player";
          infoRef.current(`${name} has left the room`);
        }

        if (msg.type === "round.start") {
          setDrawerWord(msg.payload.word ?? null);
          // Clear logs at the start of each round
          setChatLog([]);
          setGuessLog([]);
          // Auto-clear canvas for everyone at round start
          applyClearCallback.current?.();
        }

        if (msg.type === "round.end") {
          setDrawerWord(null);
        }

        if (msg.type === "chat.message") {
          setChatLog((prev) => [
            ...prev,
            { playerID: msg.payload.playerID, text: msg.payload.text },
          ]);
        }

        if (msg.type === "guess.result") {
          setGuessLog((prev) => [
            ...prev,
            {
              playerID: msg.payload.correctPlayerID,
              word: msg.payload.word,
              correct: true,
            },
          ]);
        }

        // Handle incoming draw strokes and clears
        if (msg.type === "draw.stroke") {
          applyStrokeCallback.current?.(msg.payload);
        }

        if (msg.type === "draw.clear") {
          applyClearCallback.current?.();
        }

        dispatch(msg);
      } catch {
        // ignore malformed messages
      }
    };

    return () => {
      // Deregister this WS so the onopen handler knows it is stale.
      if (wsRef.current === ws) {
        wsRef.current = null;
      }
      // Close regardless of readyState — browsers buffer the close frame if the
      // connection is still CONNECTING and send it once the handshake completes.
      ws.close();
    };
  }, [roomID, playerID]);

  const hasUnsavedChanged = true;

  useEffect(() => {
    const controller = new AbortController();

    window.addEventListener(
      "beforeunload",
      (e) => {
        if (!hasUnsavedChanged) return;

        e.preventDefault();
      },
      { signal: controller.signal },
    );

    return () => controller.abort();
  }, [hasUnsavedChanged]);

  // ---- Draw callback registration ----

  const registerDrawCallbacks = (
    onStroke: (payload: DrawStrokePayload) => void,
    onClear: () => void,
  ) => {
    applyStrokeCallback.current = onStroke;
    applyClearCallback.current = onClear;
  };

  // ---- Send helper ----

  const send = (type: EventType, payload?: unknown) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type, payload: payload ?? {} }));
    }
  };

  // ---- Exposed send functions ----

  const sendGameStart = () => send("game.start");
  const sendGuess = (word: string) => send("guess.submit", { word });
  const sendChat = (text: string) => send("chat.message", { text });
  const sendStroke = (payload: DrawStrokePayload) =>
    send("draw.stroke", payload);
  const sendClear = () => send("draw.clear");
  const sendLeave = () => send("player.leave");

  return {
    gameState,
    drawerWord,
    isConnected,
    chatLog,
    guessLog,
    sendGameStart,
    sendGuess,
    sendChat,
    sendStroke,
    sendClear,
    sendLeave,
    registerDrawCallbacks,
  };
}
