import type { GameStatus, Player } from "./game";
import type { ErrorPayload } from "./errors";

// Must mirror backend: ^[a-zA-Z0-9][a-zA-Z0-9_-]{1,18}[a-zA-Z0-9]$
export const USERNAME_REGEX = /^[a-zA-Z0-9][a-zA-Z0-9_-]{1,18}[a-zA-Z0-9]$/;

// ---- Event type literals ----

export type EventType =
  // Presence
  | "room.player_list"
  | "player.joined"
  | "player.leave"
  | "player.left"
  // Host migration
  | "host.transfer" // client → server: host picks a successor (Mode B)
  | "host.transfer.done" // server → client: host changed (Mode A or B)
  // Game lifecycle
  | "game.start"
  | "game.end"
  // Rotation lifecycle
  | "rotation.start"
  | "rotation.complete"
  // Round lifecycle
  | "round.start"
  | "round.tick"
  | "round.end"
  | "round.ending"
  // Guessing
  | "guess.submit"
  | "guess.result"
  // Drawing
  | "draw.stroke"
  | "draw.clear"
  // Chat
  | "chat.message"
  | "chat.history"
  // Error
  | "error";

// ---- Incoming payloads (server → client) ----

export interface PlayerListPayload {
  players: Player[];
}

export interface PlayerLeftPayload {
  playerID: string;
}

export interface RotationStartPayload {
  rotationNumber: number;
  totalRotations: number;
  drawOrder: string[];
}

export interface RotationCompletePayload {
  rotationNumber: number;
  scores: Record<string, number>;
  rotationsRemaining: number;
}

export interface RoundStartPayload {
  round: number;
  drawerID: string;
  word?: string; // only present for the drawer
  wordLength: number;
  status: GameStatus;
}

export interface RoundTickPayload {
  secondsRemaining: number;
}

export interface RoundEndPayload {
  word: string;
  nextDrawerID: string;
  scores: Record<string, number>;
  rotationComplete: boolean;
}

export interface GuessResultPayload {
  correctPlayerID: string;
  word: string;
  scores: Record<string, number>;
}

export interface DrawStrokePayload {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
  color: string;
  width: number;
}

export interface ChatMessagePayload {
  playerID: string;
  text: string;
  timestamp: string; // ISO 8601 from server
}

export interface ChatHistoryPayload {
  messages: ChatMessagePayload[];
}

// ---- Client-side log entry types ----

export interface ChatEntry {
  playerID: string;
  text: string;
  timestamp: Date;
}

export interface GuessEntry {
  playerID: string;
  word: string;
  correct: boolean;
}

export interface RoundEndingPayload {
  secondsRemaining: number;
  correctPlayerID: string;
}

export interface GameEndPayload {
  scores: Record<string, number>;
  winner: string;
}

export interface HostTransferredPayload {
  newHostID: string;
  newHostUsername: string;
  newHostDisplayName: string;
}

// ---- Canvas imperative handle ----

export interface CanvasHandle {
  applyStroke: (payload: DrawStrokePayload) => void;
  clearCanvas: () => void;
}

// ---- Outgoing payloads (client → server) ----

export interface GuessSubmitPayload {
  word: string;
}

export interface ChatSendPayload {
  text: string;
}

// ---- Discriminated union of all server → client messages ----

export type ServerMessage =
  | { type: "room.player_list"; payload: PlayerListPayload }
  | { type: "player.left"; payload: PlayerLeftPayload }
  | { type: "host.transfer.done"; payload: HostTransferredPayload }
  | { type: "rotation.start"; payload: RotationStartPayload }
  | { type: "rotation.complete"; payload: RotationCompletePayload }
  | { type: "round.start"; payload: RoundStartPayload }
  | { type: "round.tick"; payload: RoundTickPayload }
  | { type: "round.end"; payload: RoundEndPayload }
  | { type: "guess.result"; payload: GuessResultPayload }
  | { type: "draw.stroke"; payload: DrawStrokePayload }
  | { type: "draw.clear"; payload: Record<string, never> }
  | { type: "chat.message"; payload: ChatMessagePayload }
  | { type: "chat.history"; payload: ChatHistoryPayload }
  | { type: "round.ending"; payload: RoundEndingPayload }
  | { type: "game.end"; payload: GameEndPayload }
  | { type: "error"; payload: ErrorPayload };
