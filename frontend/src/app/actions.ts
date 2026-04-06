"use server";

import { redirect } from "next/navigation";
import { env } from "~/env";

// Just for MVP for now, in the future, integrate DB
export async function createRoom(formData: FormData) {
  const username = (formData.get("username") as string)?.trim();
  if (!username) return;

  const hostID = crypto.randomUUID();

  const res = await fetch(`${env.BACKEND_URL}/api/rooms`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ hostID, hostUsername: username }),
  });

  if (!res.ok) return;

  const data = (await res.json()) as { roomID: string };
  redirect(`/room/${data.roomID}?playerID=${encodeURIComponent(hostID)}`);
}
