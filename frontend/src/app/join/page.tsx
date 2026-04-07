import Link from "next/link";
import { joinRoomAction } from "./actions";
import { ErrorCode, errorMessages } from "~/types/events";

export default async function JoinPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; code?: string }>;
}) {
  const { error, code } = await searchParams;

  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-100 flex items-center justify-center">
      <div className="flex flex-col gap-6 w-full max-w-sm">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-bold">Join a room</h1>
          <p className="text-neutral-400 text-sm">
            Enter the room code shared by the host.
          </p>
        </div>

        {error && (
          <p className="rounded bg-red-900 border border-red-700 px-3 py-2 text-sm text-red-300">
            {errorMessages[error as ErrorCode] ?? "Something went wrong."}
          </p>
        )}

        <form action={joinRoomAction} className="flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <label htmlFor="roomCode" className="text-sm text-neutral-300">
              Room code
            </label>
            <input
              id="roomCode"
              name="roomCode"
              type="text"
              required
              maxLength={6}
              defaultValue={code}
              placeholder="e.g. a1B2c3"
              className="rounded bg-neutral-800 border border-neutral-700 px-3 py-2 text-sm uppercase tracking-widest focus:outline-none focus:border-neutral-500"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="displayName" className="text-sm text-neutral-300">
              Your name
            </label>
            <input
              id="displayName"
              name="displayName"
              type="text"
              required
              maxLength={24}
              placeholder="Enter your name"
              className="rounded bg-neutral-800 border border-neutral-700 px-3 py-2 text-sm focus:outline-none focus:border-neutral-500"
            />
          </div>

          <button
            type="submit"
            className="rounded bg-green-700 px-4 py-2 text-sm font-semibold hover:bg-green-600 transition-colors"
          >
            Join Room
          </button>
        </form>

        <p className="text-sm text-neutral-500">
          Want to host instead?{" "}
          <Link href="/" className="text-neutral-300 hover:underline">
            Create a room
          </Link>
        </p>
      </div>
    </main>
  );
}
