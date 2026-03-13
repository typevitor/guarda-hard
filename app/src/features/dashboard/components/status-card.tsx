type StatusCardProps = {
  label: string;
  count: number;
};

export function StatusCard({ label, count }: StatusCardProps) {
  return (
    <article className="status-card">
      <p className="status-card-label">{label}</p>
      <p className="status-card-value">{count}</p>
    </article>
  );
}
