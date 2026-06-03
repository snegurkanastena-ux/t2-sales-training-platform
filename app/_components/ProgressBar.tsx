interface Props {
  value: number; // 0..1
  ariaLabel?: string;
}

export function ProgressBar({ value, ariaLabel }: Props) {
  const pct = Math.max(0, Math.min(1, value)) * 100;
  return (
    <div
      className="progress-track"
      role="progressbar"
      aria-valuenow={Math.round(pct)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={ariaLabel}
    >
      <div className="progress-fill" style={{ width: `${pct}%` }} />
    </div>
  );
}
