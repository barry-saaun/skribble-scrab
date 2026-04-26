"use server";

import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { api } from "~/api/client";
import { ErrorCode } from "~/types/errors";
import type { CreateRoomRequest } from "~/types/server";

export type ActionResult = { error: string } | null;

export type JoinRoomInput = {
  playerID: string;
  displayName: string;
  roomCode: string;
};

export async function createRoom(
  input: CreateRoomRequest,
): Promise<ActionResult> {
  const { hostID, hostUsername } = input;

  if (!hostUsername) return { error: ErrorCode.USERNAME_INVALID };

  let data, error;
  try {
    ({ data, error } = await api.POST("/api/rooms", { body: input }));
  } catch {
    return { error: "NETWORK_ERROR" };
  }

  if (error) return { error: error.code };
  if (!data) return { error: "NETWORK_ERROR" };

  (await cookies()).set("playerID", hostID, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
  });

  redirect(`/room/${data.roomID}`);
}

export async function joinRoomAction(
  input: JoinRoomInput,
): Promise<ActionResult> {
  const { playerID, displayName, roomCode } = input;

  if (!roomCode || !displayName) return null;

  let joinError;
  try {
    ({ error: joinError } = await api.POST("/api/rooms/{roomID}/join", {
      params: { path: { roomID: roomCode } },
      body: {
        playerID,
        playerUsername: displayName,
        playerDisplayName: displayName,
      },
    }));
  } catch {
    redirect(`/error?code=ROOM_NOT_FOUND&room=${encodeURIComponent(roomCode)}`);
  }

  if (joinError?.code === ErrorCode.GAME_ALREADY_ACTIVE) {
    return { error: ErrorCode.GAME_ALREADY_ACTIVE };
  }

  if (joinError?.code === ErrorCode.ROOM_FULL) {
    return { error: ErrorCode.ROOM_FULL };
  }

  if (joinError && joinError.code !== ErrorCode.PLAYER_ALREADY_IN_ROOM) {
    redirect(`/error?code=ROOM_NOT_FOUND&room=${encodeURIComponent(roomCode)}`);
  }

  (await cookies()).set("playerID", playerID, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
  });

  redirect(`/room/${roomCode}`);
}

export async function joinRoom(
  roomID: string,
  playerID: string,
  username: string,
) {
  const { error } = await api.POST("/api/rooms/{roomID}/join", {
    params: { path: { roomID } },
    body: { playerID, playerUsername: username },
  });

  // Already in room (host was auto-added on create) — not an error
  if (error && error.code !== ErrorCode.PLAYER_ALREADY_IN_ROOM) {
    redirect(`/error?code=ROOM_NOT_FOUND&room=${encodeURIComponent(roomID)}`);
  }
}
