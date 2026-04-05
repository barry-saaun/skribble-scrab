import type { GameStatus, Player } from "./game";

// ---- Event type literals ----

export type EventType =
  // Presence
  | "room.player_list"
  | "player.joined"
  | "player.left"
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
  // Guessing
  | "guess.submit"
  | "guess.result"
  // Drawing
  | "draw.stroke"
  | "draw.clear"
  // Chat
  | "chat.message"
  // Error
  | "error";

// ---- Incoming payloads (server → client) ----

export interface PlayerListPayload {
  players: Player[];
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
  drawerId: string;
  word?: string; // only present for the drawer
  status: GameStatus;
}

export interface RoundTickPayload {
  secondsRemaining: number;
}

export interface RoundEndPayload {
  word: string;
  nextDrawerId: string;
  scores: Record<string, number>;
  rotationComplete: boolean;
}

export interface GuessResultPayload {
  correctPlayerId: string;
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
  playerId: string;
  text: string;
}

export interface GameEndPayload {
  scores: Record<string, number>;
  winner: string;
}

export interface ErrorPayload {
  code: string;
  message: string;
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
  | { type: "rotation.start"; payload: RotationStartPayload }
  | { type: "rotation.complete"; payload: RotationCompletePayload }
  | { type: "round.start"; payload: RoundStartPayload }
  | { type: "round.tick"; payload: RoundTickPayload }
  | { type: "round.end"; payload: RoundEndPayload }
  | { type: "guess.result"; payload: GuessResultPayload }
  | { type: "draw.stroke"; payload: DrawStrokePayload }
  | { type: "draw.clear"; payload: Record<string, never> }
  | { type: "chat.message"; payload: ChatMessagePayload }
  | { type: "game.end"; payload: GameEndPayload }
  | { type: "error"; payload: ErrorPayload };
