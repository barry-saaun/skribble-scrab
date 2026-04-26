import { ErrorPayload } from "./errors";

import type { components } from "~/api/v1";

type Schemas = components["schemas"];

export type Role = Schemas["Role"];

export type GameStatus = Schemas["Status"];

export type PlayerID = string;

export type Scores = Record<PlayerID, number>;

export type RoomConfig = components["schemas"]["RoomConfig"];

export interface Player {
  id: PlayerID;
  userName: string;
  displayName: string;
  role: Role;
  connected: boolean;
}

export interface GameState {
  status: GameStatus;
  players: Player[];
  scores: Scores;
  currentRound: number;
  currentRotation: number;
  totalRotations: number;
  drawOrder: PlayerID[];
  drawerID: PlayerID | null;
  wordLength: number | null;
  secondsRemaining: number | null;
  roundEndingCountdown: number | null;
  roundEndingGuesserID: PlayerID | null;
  winner: PlayerID | null;
  roundLive: boolean;

  lastError: ErrorPayload | null;
}
