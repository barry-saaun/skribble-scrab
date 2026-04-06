"use server";

import { redirect } from "next/navigation";
import { api } from "~/api/client";

// Just for MVP for now, in the future, integrate DB
export async function createRoom(formData: FormData) {
  const username = (formData.get("username") as string)?.trim();
  if (!username) return;

  const hostID = crypto.randomUUID();

  const { data, error } = await api.POST("/api/rooms", {
    body: { hostID, hostUsername: username, hostDisplayName: username },
  });

  if (error ?? !data) return;

  redirect(
    `/room/${data.roomID}?playerID=${encodeURIComponent(hostID)}&username=${encodeURIComponent(username)}`,
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
    redirect("/error");
  }
}
