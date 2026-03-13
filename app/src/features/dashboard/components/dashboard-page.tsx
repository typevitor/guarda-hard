import type { DashboardData } from "../server/get-dashboard-data";
import { StatusCard } from "./status-card";

type DashboardPageProps = {
  data: DashboardData;
};

export function DashboardPage({ data }: DashboardPageProps) {
  return (
    <section className="dashboard-grid" aria-label="Status de hardwares">
      {data.cards.map((card) => (
        <StatusCard key={card.id} label={card.label} count={card.count} />
      ))}
    </section>
  );
}
