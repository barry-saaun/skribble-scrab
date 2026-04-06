import { createRoom } from "./actions";

export default function Home() {
  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-100 flex items-center justify-center">
      <div className="flex flex-col gap-6 w-full max-w-sm">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-bold">skribble</h1>
          <p className="text-neutral-400 text-sm">
            A real-time multiplayer drawing game
          </p>
        </div>

        <form action={createRoom} className="flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <label htmlFor="username" className="text-sm text-neutral-300">
              Your name
            </label>
            <input
              id="username"
              name="username"
              type="text"
              required
              maxLength={24}
              placeholder="Enter your name"
              className="rounded bg-neutral-800 border border-neutral-700 px-3 py-2 text-sm focus:outline-none focus:border-neutral-500"
            />
          </div>

          <button
            type="submit"
            className="rounded bg-blue-700 px-4 py-2 text-sm font-semibold hover:bg-blue-600 transition-colors"
          >
            Create Room
          </button>
        </form>
      </div>
    </main>
  );
}
