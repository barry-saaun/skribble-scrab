import type { Player } from "~/types/game";

function ScoreBoardPlaceholder({
  scores,
  players,
}: {
  scores: Record<string, number>;
  players: Player[];
}) {
  const allScores = players.map((p) => ({
    player: p,
    score: scores[p.id] ?? 0,
  }));

  return (
    <div className="rounded border border-neutral-700 bg-neutral-900 p-4 flex flex-col gap-2">
      <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wide">
        Scores
      </p>
      {allScores.length === 0 ? (
        <p className="text-neutral-600 italic text-sm">No players yet.</p>
      ) : (
        allScores.map(({ player, score }) => (
          <div key={player.id} className="flex justify-between font-mono text-sm">
            <span className="text-neutral-300">{player.userName}</span>
            <span className="text-yellow-300">{score}</span>
          </div>
        ))
      )}
    </div>
  );
}

export default ScoreBoardPlaceholder;
