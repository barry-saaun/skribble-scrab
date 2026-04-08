// All the errors constant lives here which mirrored the backend
export const ErrorCode = {
  // Game errors (WS)
  NOT_HOST: "NOT_HOST",
  GAME_ALREADY_ACTIVE: "GAME_ALREADY_ACTIVE",
  NOT_ENOUGH_PLAYERS: "NOT_ENOUGH_PLAYERS",
  NOT_YOUR_TURN: "NOT_YOUR_TURN",
  ALREADY_GUESSED: "ALREADY_GUESSED",

  // Room access errors (HTTP)
  ROOM_NOT_FOUND: "ROOM_NOT_FOUND",
  ROOM_FULL: "ROOM_FULL",
  PRIVATE_NO_CODE: "PRIVATE_NO_CODE",

  // General room state errors
  PLAYER_ALREADY_IN_ROOM: "PLAYER_ALREADY_IN_ROOM",
  USERNAME_INVALID: "USERNAME_INVALID",
} as const;

export type ErrorCode = (typeof ErrorCode)[keyof typeof ErrorCode];

export interface ErrorPayload {
  code: ErrorCode;
}

export const errorMessages: Partial<Record<ErrorCode, string>> = {
  // Game errors
  [ErrorCode.NOT_HOST]: "You are not host",
  [ErrorCode.GAME_ALREADY_ACTIVE]: "The game is currently active",
  [ErrorCode.NOT_ENOUGH_PLAYERS]: "Need at least 3 players to start the game.",
  [ErrorCode.NOT_YOUR_TURN]: "It's not your turn.",
  [ErrorCode.ALREADY_GUESSED]: "You have already guessed this round.",

  // Room access errors
  [ErrorCode.ROOM_NOT_FOUND]: "Room not found. Check the code and try again.",
  [ErrorCode.ROOM_FULL]: "This room is full.",
  [ErrorCode.PRIVATE_NO_CODE]: "This room is private.",

  // General room state errors
  [ErrorCode.PLAYER_ALREADY_IN_ROOM]: "You are already in this room.",
  [ErrorCode.USERNAME_INVALID]:
    "Username must be 3–20 characters and can only contain letters, numbers, underscores, or hyphens.",
};

/// ==== TOAST, yums ====
export const toastErrorCodes = [
  ErrorCode.NOT_ENOUGH_PLAYERS,
  ErrorCode.GAME_ALREADY_ACTIVE,
  ErrorCode.PLAYER_ALREADY_IN_ROOM,
  ErrorCode.NOT_HOST,
] as const;

export type ToastErrorCode = (typeof toastErrorCodes)[number];

export const toastErrorMessages = Object.fromEntries(
  toastErrorCodes.map((code) => [code, errorMessages[code]]),
) as Record<ToastErrorCode, string>;

export const toastErrorTitles: Record<ToastErrorCode, string> = {
  [ErrorCode.NOT_ENOUGH_PLAYERS]: "NOT ENOUGH PLAYERS",
  [ErrorCode.GAME_ALREADY_ACTIVE]: "GAME ALREADY ACTIVE",
  [ErrorCode.PLAYER_ALREADY_IN_ROOM]: "ALREADY IN ROOM",
  [ErrorCode.NOT_HOST]: "NOT HOST",
};

/// ==== FULL PAGE ====

export const fullPageErrorCodes = [ErrorCode.ROOM_NOT_FOUND];

export type FullPageErrorCodes = (typeof fullPageErrorCodes)[number];

export const fullPageErrorMessages = Object.fromEntries(
  fullPageErrorCodes.map((code) => [code, errorMessages[code]]),
) as Record<FullPageErrorCodes, string>;

export const fullPageErrorTitles: Record<FullPageErrorCodes, string> = {
  [ErrorCode.ROOM_NOT_FOUND]: "ROOM NOT FOUND",
};
