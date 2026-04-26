import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { api } from "~/api/client";
import RoomClient from "./RoomClient";

export default async function RoomPage({
  params,
}: {
  params: Promise<{ roomID: string }>;
}) {
  const { roomID } = await params;
  const playerID = (await cookies()).get("playerID")?.value;

  if (!playerID) redirect("/error?code=MISSING_PLAYER_ID");

  const { data: room, error } = await api.GET("/api/rooms/{roomID}", {
    params: { path: { roomID } },
  });

  if (error || !room) redirect("/error?code=ROOM_NOT_FOUND");

  const player = room.players.find((p) => p.id === playerID);

  if (!player) redirect("/error?code=PLAYER_NOT_IN_ROOM");

  return (
    <RoomClient
      roomID={roomID}
      playerID={playerID}
      userName={player.displayName}
      config={room.config}
    />
  );
}
