interface Props {
  label: string;
  value: string | number;
  delta?: string;
}

export function StatTile({ label, value, delta }: Props) {
  return (
    <div className="stat-tile">
      <div className="label">{label}</div>
      <div className="value">{value}</div>
      {delta && <div className="delta">{delta}</div>}
    </div>
  );
}
