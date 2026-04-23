"use server";

import { redirect } from "next/navigation";
import { api } from "~/api/client";
import { ErrorCode } from "~/types/errors";

// Just for MVP for now, in the future, integrate DB
export async function createRoom(
  _prevState: { error: string } | null,
  formData: FormData,
): Promise<{ error: string } | null> {
  const displayName = (formData.get("displayName") as string)?.trim();
  if (!displayName) return { error: ErrorCode.USERNAME_INVALID };

  const hostID = crypto.randomUUID();
  const rawVisibility = (formData.get("visibility") as string)?.trim();
  const visibility =
    rawVisibility === "private" ? "private" : ("public" as const);

  let data, error;
  try {
    ({ data, error } = await api.POST("/api/rooms", {
      body: {
        hostID,
        hostUsername: displayName,
        hostDisplayName: displayName,
        config: { visibility },
      },
    }));
  } catch {
    return { error: "NETWORK_ERROR" };
  }

  if (error) return { error: error.code };
  if (!data) return { error: "NETWORK_ERROR" };

  redirect(
    `/room/${data.roomID}?playerID=${encodeURIComponent(hostID)}&username=${encodeURIComponent(displayName)}`,
  );
}

export async function joinRoomAction(
  _prevState: { error: string } | null,
  formData: FormData,
) {
  const roomCode = (formData.get("roomCode") as string)?.trim();
  const displayName = (formData.get("displayName") as string)?.trim();

  if (!roomCode || !displayName) return null;

  const playerID = crypto.randomUUID();

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

  redirect(
    `/room/${roomCode}?playerID=${encodeURIComponent(playerID)}&username=${encodeURIComponent(displayName)}`,
  );
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
