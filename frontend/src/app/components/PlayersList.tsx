import { Player } from "~/types/game";

function PlayersListPlaceholder({ players }: { players: Player[] }) {
  return (
    <div className="rounded border border-neutral-700 bg-neutral-900 p-4 flex flex-col gap-2">
      <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wide">
        total players: {players.length}
      </p>
      {players.map((player) => (
        <p key={player.id} className="text-neutral-600 italic text-sm">
          {player.displayName}
        </p>
      ))}
    </div>
  );
}

export default PlayersListPlaceholder;
