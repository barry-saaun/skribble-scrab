// All the errors constant lives here which mirrored the backend
export const ErrorCode = {
  // Game errors (WS)
  NOT_HOST: "NOT_HOST",
  GAME_ALREADY_ACTIVE: "GAME_ALREADY_ACTIVE",
  NOT_ENOUGH_PLAYERS: "NOT_ENOUGH_PLAYERS",
  NOT_YOUR_TURN_TO_DRAW: "NOT_YOUR_TURN",
  GUESS_COOLDOWN: "GUESS_COOLDOWN",

  // Room access errors (HTTP)
  ROOM_NOT_FOUND: "ROOM_NOT_FOUND",
  ROOM_FULL: "ROOM_FULL",
  PRIVATE_NO_CODE: "PRIVATE_NO_CODE",
  CANNOT_LEAVE_MID_ROUND: "CANNOT_LEAVE_MID_ROUND",

  // General room state errors
  PLAYER_ALREADY_IN_ROOM: "PLAYER_ALREADY_IN_ROOM",
  USERNAME_INVALID: "USERNAME_INVALID",

  // Host transfer errors
  INVALID_TARGET: "INVALID_TARGET",
} as const;

export type TErrorCode = (typeof ErrorCode)[keyof typeof ErrorCode];

export interface ErrorPayload<TCode extends TErrorCode = TErrorCode> {
  code: TCode;
}

export const errorMessages: Partial<Record<TErrorCode, string>> = {
  // Game errors
  [ErrorCode.NOT_HOST]: "You are not host",
  [ErrorCode.GAME_ALREADY_ACTIVE]: "The game is currently active",
  [ErrorCode.NOT_ENOUGH_PLAYERS]: "Need at least 3 players to start the game.",
  [ErrorCode.NOT_YOUR_TURN_TO_DRAW]: "Only the drawer can draw.",
  [ErrorCode.GUESS_COOLDOWN]: "Please wait a moment before guessing again.",

  // Room access errors
  [ErrorCode.ROOM_NOT_FOUND]: "Room not found. Check the code and try again.",
  [ErrorCode.ROOM_FULL]: "The maximum players of this room has been reached.",
  [ErrorCode.PRIVATE_NO_CODE]: "This room is private.",
  [ErrorCode.CANNOT_LEAVE_MID_ROUND]: "Cannot leave the room mid round..",

  // General room state errors
  [ErrorCode.PLAYER_ALREADY_IN_ROOM]: "You are already in this room.",
  [ErrorCode.USERNAME_INVALID]:
    "Username must be 3–20 characters and can only contain letters, numbers, underscores, or hyphens.",
  [ErrorCode.INVALID_TARGET]: "That player is no longer in the room.",
};

/// ==== TOAST, yums ====
export const toastErrorCodes = [
  ErrorCode.NOT_ENOUGH_PLAYERS,
  ErrorCode.GAME_ALREADY_ACTIVE,
  ErrorCode.PLAYER_ALREADY_IN_ROOM,
  ErrorCode.NOT_HOST,
  ErrorCode.ROOM_FULL,
  ErrorCode.INVALID_TARGET,
] as const;

export type ToastErrorCode = (typeof toastErrorCodes)[number];
export type ToastErrorPaylaod = ErrorPayload<ToastErrorCode>;

export const toastErrorMessages = Object.fromEntries(
  toastErrorCodes.map((code) => [code, errorMessages[code]]),
) as Record<ToastErrorCode, string>;

export const toastErrorTitles: Record<ToastErrorCode, string> = {
  [ErrorCode.NOT_ENOUGH_PLAYERS]: "NOT ENOUGH PLAYERS",
  [ErrorCode.GAME_ALREADY_ACTIVE]: "GAME ALREADY ACTIVE",
  [ErrorCode.PLAYER_ALREADY_IN_ROOM]: "ALREADY IN ROOM",
  [ErrorCode.NOT_HOST]: "NOT HOST",
  [ErrorCode.ROOM_FULL]: "ROOM IS FULL",
  [ErrorCode.INVALID_TARGET]: "INVALID TARGET",
};

export function isToastErrorCode(code: TErrorCode): code is ToastErrorCode {
  return (toastErrorCodes as readonly TErrorCode[]).includes(code);
}

/// ==== FULL PAGE ====

export const fullPageErrorCodes = [ErrorCode.ROOM_NOT_FOUND] as const;

export type FullPageErrorCodes = (typeof fullPageErrorCodes)[number];
export type FullPageErrorPayload = ErrorPayload<FullPageErrorCodes>;

export const fullPageErrorMessages = Object.fromEntries(
  fullPageErrorCodes.map((code) => [code, errorMessages[code]]),
) as Record<FullPageErrorCodes, string>;

export const fullPageErrorTitles: Record<FullPageErrorCodes, string> = {
  [ErrorCode.ROOM_NOT_FOUND]: "ROOM NOT FOUND",
};

//// === IN-LINE ====
export const inlineErrorCodes = [ErrorCode.GUESS_COOLDOWN] as const;

export type InlineErrorCodes = (typeof inlineErrorCodes)[number];
export type InlineErrorPayload = ErrorPayload<InlineErrorCodes>;

export const inlineErrorMessages = Object.fromEntries(
  inlineErrorCodes.map((code) => [code, errorMessages[code]]),
) as Record<InlineErrorCodes, string>;

export function isInlineErrorCode(code: TErrorCode): code is InlineErrorCodes {
  return (inlineErrorCodes as readonly TErrorCode[]).includes(code);
}
