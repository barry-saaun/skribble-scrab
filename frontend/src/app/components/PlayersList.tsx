import { Player } from "~/types/game";

function PlayersListPlaceholder({ players }: { players: Player[] }) {
  return (
    <div className="border-2 border-foreground p-4 bg-card shadow-[4px_4px_0_0_hsl(var(--foreground))]">
      <p className="text-xs uppercase tracking-widest text-muted-foreground mb-3">
        {"// PLAYERS"}
      </p>
      {players.length === 0 ? (
        <p className="text-muted-foreground italic text-sm">No players yet.</p>
      ) : (
        <div className="space-y-1 font-mono text-sm">
          {players.map((player) => (
            <div key={player.id} className="flex items-center gap-2">
              <span className="text-muted-foreground text-xs">{String(players.indexOf(player) + 1).padStart(2, "0")}</span>
              <span className="text-foreground">{player.displayName}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default PlayersListPlaceholder;
