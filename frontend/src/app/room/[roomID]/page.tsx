import { redirect } from "next/navigation";
import { joinRoom } from "~/app/actions";
import RoomClient from "./RoomClient";

export default async function RoomPage({
  params,
  searchParams,
}: {
  params: Promise<{ roomID: string }>;
  searchParams: Promise<{ playerID?: string; username?: string }>;
}) {
  const { roomID } = await params;
  const { playerID, username } = await searchParams;

  if (!playerID || !username) redirect("/error");

  // Registers the player in the room before the page renders.
  // 409 is fine — the host is already registered on room creation.
  await joinRoom(roomID, playerID, username);

  return <RoomClient roomID={roomID} playerID={playerID} username={username} />;
}
