"use client";
import { useEffect, useReducer, useRef, useState } from "react";
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
  secondsRemaining: null,
  winner: null,
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
        currentRound: action.payload.round,
        status: "in_progress",
        secondsRemaining: null,
        lastError: null,
      };

    case "round.tick":
      return { ...state, secondsRemaining: action.payload.secondsRemaining };

    case "round.end":
      return {
        ...state,
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
  const wsRef = useRef<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [gameState, dispatch] = useReducer(gameReducer, initGameState);

  // Kept outside GameState so the word is never accidentally passed to components
  const [drawerWord, setDrawerWord] = useState<string | null>(null);

  const [chatLog, setChatLog] = useState<ChatEntry[]>([]);
  const [guessLog, setGuessLog] = useState<GuessEntry[]>([]);

  useEffect(() => {
    const ws = new WebSocket(
      `${env.NEXT_PUBLIC_WS_BASE_URL}/ws?roomID=${encodeURIComponent(roomID)}&playerID=${encodeURIComponent(playerID)}`,
    );

    wsRef.current = ws;

    ws.onopen = () => setIsConnected(true);
    ws.onclose = () => setIsConnected(false);

    ws.onmessage = (e: MessageEvent) => {
      try {
        const msg = JSON.parse(e.data as string) as ServerMessage;

        // Intercept the drawer's word before dispatching — keep it out of shared state
        if (msg.type === "round.start") {
          setDrawerWord(msg.payload.word ?? null);
          // Clear logs at the start of each round
          setChatLog([]);
          setGuessLog([]);
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

        dispatch(msg);
      } catch {
        // ignore malformed messages
      }
    };

    return () => ws.close();
  }, [roomID, playerID]);

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
  };
}
