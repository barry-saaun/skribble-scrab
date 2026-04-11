import type { Player } from "~/types/game";

function ScoreBoardPlaceholder({
  scores,
  players,
}: {
  scores: Record<string, number>;
  players: Player[];
}) {
  const allScores = players
    .map((p) => ({
      player: p,
      score: scores[p.id] ?? 0,
    }))
    .sort((a, b) => b.score - a.score);

  return (
    <div className="border-2 border-foreground p-4 bg-card shadow-[4px_4px_0_0_hsl(var(--foreground))]">
      <p className="text-xs uppercase tracking-widest text-muted-foreground mb-3">
        {"// SCORES"}
      </p>
      {allScores.length === 0 ? (
        <p className="text-muted-foreground italic text-sm">No players yet.</p>
      ) : (
        <div className="space-y-2 font-mono text-sm">
          {allScores.map(({ player, score }, idx) => (
            <div key={player.id} className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground text-xs">{String(idx + 1).padStart(2, "0")}</span>
                <span className="text-foreground">{player.userName}</span>
              </div>
              <span className="text-accent font-bold">{score}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default ScoreBoardPlaceholder;
