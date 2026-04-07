"use server";

import { redirect } from "next/navigation";
import { api } from "~/api/client";

export async function joinRoomAction(formData: FormData) {
  const roomCode = (formData.get("roomCode") as string)?.trim();
  const displayName = (formData.get("displayName") as string)?.trim();

  if (!roomCode || !displayName) return;

  // Validate the room exists
  const { error: roomError } = await api.GET("/api/rooms/{roomID}", {
    params: { path: { roomID: roomCode } },
  });

  if (roomError) {
    redirect(`/join?error=ROOM_NOT_FOUND&code=${encodeURIComponent(roomCode)}`);
  }

  // Join the room
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
      response.status === 409
        ? "PLAYER_ALREADY_IN_ROOM"
        : response.status === 403
          ? "ROOM_FULL"
          : "ROOM_NOT_FOUND";
    redirect(`/join?error=${code}&code=${encodeURIComponent(roomCode)}`);
  }

  redirect(
    `/room/${roomCode}?playerID=${encodeURIComponent(playerID)}&username=${encodeURIComponent(displayName)}`,
  );
}
