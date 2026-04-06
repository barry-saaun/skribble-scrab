function ScoreBoardPlaceholder({ scores }: { scores: Record<string, number> }) {
  return (
    <div className="rounded border border-neutral-700 bg-neutral-900 p-4 flex flex-col gap-2">
      <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wide">
        Scores
      </p>
      {Object.keys(scores).length === 0 ? (
        <p className="text-neutral-600 italic text-sm">ScoreBoard goes here</p>
      ) : (
        Object.entries(scores).map(([id, score]) => (
          <div key={id} className="flex justify-between font-mono text-sm">
            <span className="text-neutral-300">{id}</span>
            <span className="text-yellow-300">{score}</span>
          </div>
        ))
      )}
    </div>
  );
}

export default ScoreBoardPlaceholder;
