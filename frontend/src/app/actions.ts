"use server";

import { redirect } from "next/navigation";
import { api } from "~/api/client";

// Just for MVP for now, in the future, integrate DB
export async function createRoom(formData: FormData) {
  const displayName = (formData.get("displayName") as string)?.trim();
  if (!displayName) return;

  const hostID = crypto.randomUUID();

  const { data, error } = await api.POST("/api/rooms", {
    body: { hostID, hostUsername: displayName, hostDisplayName: displayName },
  });

  if (error ?? !data) return;

  redirect(
    `/room/${data.roomID}?playerID=${encodeURIComponent(hostID)}&username=${encodeURIComponent(displayName)}`,
  );
}

export async function joinRoomAction(formData: FormData) {
  const roomCode = (formData.get("roomCode") as string)?.trim();
  const displayName = (formData.get("displayName") as string)?.trim();

  if (!roomCode || !displayName) return;

  const { error: roomError } = await api.GET("/api/rooms/{roomID}", {
    params: { path: { roomID: roomCode } },
  });

  if (roomError) {
    redirect(`/?error=ROOM_NOT_FOUND&code=${encodeURIComponent(roomCode)}`);
  }

  const playerID = crypto.randomUUID();

  const { error: joinError, response } = await api.POST(
    "/api/rooms/{roomID}/join",
    {
      params: { path: { roomID: roomCode } },
      body: {
        playerID,
        playerUsername: displayName,
        playerDisplayName: displayName,
      },
    },
  );

  if (joinError && response.status !== 409) {
    const code =
      response.status === 403
        ? "ROOM_FULL"
        : "ROOM_NOT_FOUND";
    redirect(`/?error=${code}&code=${encodeURIComponent(roomCode)}`);
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
  const { error, response } = await api.POST("/api/rooms/{roomID}/join", {
    params: { path: { roomID } },
    body: { playerID, playerUsername: username },
  });

  // 409 = already in room (host was auto-added on create) — not an error
  if (error && response.status !== 409) {
    redirect(`/?error=ROOM_NOT_FOUND&code=${encodeURIComponent(roomID)}`);
  }
}
