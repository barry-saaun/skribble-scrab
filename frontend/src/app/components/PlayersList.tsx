function PlayersListPlaceholder({ playerCount }: { playerCount: number }) {
  return (
    <div className="rounded border border-neutral-700 bg-neutral-900 p-4 flex flex-col gap-2">
      <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wide">
        Players ({playerCount})
      </p>
      <p className="text-neutral-600 italic text-sm">PlayerList goes here</p>
    </div>
  );
}

export default PlayersListPlaceholder;
