function TimerPlaceholder({
  secondsRemaining,
}: {
  secondsRemaining: number | null;
}) {
  return (
    <div className="rounded border border-neutral-700 bg-neutral-900 px-4 py-2 flex items-center gap-2">
      <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wide">
        Timer
      </p>
      <span className="font-mono text-xl text-white">
        {secondsRemaining !== null ? secondsRemaining : "--"}
      </span>
    </div>
  );
}
export default TimerPlaceholder;
