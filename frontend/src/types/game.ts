export type Role = "host" | "player" | "spectator";

export type GameStatus = "waiting" | "in_progress" | "finished";

export interface Player {
  id: string;
  userName: string;
  role: Role;
  connected: boolean;
}

export interface GameState {
  status: GameStatus;
  players: Player[];
  scores: Record<string, number>;
  currentRound: number;
  currentRotation: number;
  totalRotations: number;
  drawOrder: string[];
  drawerID: string | null;
  secondsRemaining: number | null;
  winner: string | null;
}
