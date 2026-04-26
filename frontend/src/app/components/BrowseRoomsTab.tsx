import { USERNAME_REGEX } from "~/types/events";

const PLACEHOLDER_ROOMS = [
  {
    name: "CHAOS DRAWING CLUB",
    status: "IN PROGRESS",
    players: 5,
    maxPlayers: 8,
    round: 6,
    maxRounds: 10,
    code: "rm_001",
  },
  {
    name: "SPEED ROUND HELL",
    status: "WAITING",
    players: 2,
    maxPlayers: 6,
    round: 0,
    maxRounds: 8,
    code: "rm_002",
  },
  {
    name: "SILENT ARTISTS ONLY",
    status: "IN PROGRESS",
    players: 7,
    maxPlayers: 8,
    round: 3,
    maxRounds: 6,
    code: "rm_003",
  },
  {
    name: "PICTIONARY VETERANS",
    status: "WAITING",
    players: 1,
    maxPlayers: 10,
    round: 0,
    maxRounds: 12,
    code: "rm_004",
  },
] as const;

function BrowseRoomsTab({
  defaultDisplayName,
}: {
  defaultDisplayName: string;
}) {
  const isDisabled = !USERNAME_REGEX.test(defaultDisplayName);

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <p className="text-xs uppercase tracking-widest text-muted-foreground">
          {"//"} {PLACEHOLDER_ROOMS.length} ACTIVE ROOMS
        </p>
        <button className="brut-press cursor-pointer border-2 border-foreground px-3 py-1 text-xs font-bold uppercase hover:bg-foreground hover:text-background">
          REFRESH
        </button>
      </div>

      <div className="space-y-3">
        {PLACEHOLDER_ROOMS.map((room) => (
          <div
            key={room.code}
            className="flex items-center justify-between border-2 border-foreground p-4 shadow-[4px_4px_0_0_hsl(var(--foreground))]"
          >
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-bold uppercase">{room.name}</h3>
                <span
                  className={`border px-2 py-0.5 text-xs font-bold uppercase ${
                    room.status === "WAITING"
                      ? "border-destructive text-destructive"
                      : "border-foreground text-foreground"
                  }`}
                >
                  {room.status}
                </span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                {room.players}/{room.maxPlayers} PLAYERS &nbsp;•&nbsp; ROUND{" "}
                {room.round}/{room.maxRounds} &nbsp;•&nbsp; {room.code}
              </p>
              <div className="mt-2 flex gap-1">
                {[...Array(room.maxPlayers)].map((_, i) => (
                  <div
                    key={i}
                    className={`h-2 w-4 ${
                      i < room.players ? "bg-accent" : "bg-border"
                    }`}
                  />
                ))}
              </div>
            </div>
            <button
              disabled={isDisabled}
              className={`brut-press ml-4 shrink-0 border-2 px-4 py-2 text-xs font-bold uppercase ${
                isDisabled
                  ? "cursor-not-allowed border-muted bg-muted text-muted-foreground opacity-50"
                  : "cursor-pointer border-accent bg-accent text-accent-foreground hover:opacity-90"
              }`}
            >
              {room.status === "WAITING" ? "JOIN" : "SPECTATE"}
            </button>
          </div>
        ))}
      </div>

      <div className="mt-4 flex items-center justify-between border-2 border-foreground p-4 shadow-[4px_4px_0_0_hsl(var(--foreground))]">
        <div>
          <h3 className="font-bold uppercase">QUICK PLAY</h3>
          <p className="mt-1 text-xs uppercase tracking-widest text-muted-foreground">
            DROP INTO THE BEST AVAILABLE ROOM INSTANTLY
          </p>
        </div>
        <button
          disabled={isDisabled}
          className={`brut-press ml-4 shrink-0 border-2 px-4 py-2 text-xs font-bold uppercase ${
            isDisabled
              ? "cursor-not-allowed border-muted bg-muted text-muted-foreground opacity-50"
              : "cursor-pointer border-accent bg-accent text-accent-foreground hover:opacity-90"
          }`}
        >
          QUICK PLAY
        </button>
      </div>
    </div>
  );
}

export default BrowseRoomsTab;
