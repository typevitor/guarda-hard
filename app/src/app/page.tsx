import { AppShell } from "../components/layout/app-shell";

export default function Home() {
  return (
    <AppShell>
      <div className="panel-card">
        <h2 className="panel-title">Dashboard</h2>
        <p className="panel-text">Bem-vindo ao painel do GuardaHard.</p>
      </div>
    </AppShell>
  );
}
