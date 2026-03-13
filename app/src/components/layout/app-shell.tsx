import { PageHeader } from "./page-header";
import { SidebarMenu } from "./sidebar-menu";

type AppShellProps = {
  children: React.ReactNode;
};

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="shell-root">
      <aside className="shell-sidebar desktop-only">
        <div className="brand-block">
          <p className="brand-title">GuardaHard</p>
          <p className="brand-subtitle">Controle de ativos</p>
        </div>
        <SidebarMenu />
      </aside>

      <div className="shell-main-wrap">
        <header className="mobile-only mobile-nav">
          <SidebarMenu compact />
        </header>

        <main className="shell-main">
          <PageHeader />
          <section className="shell-content">{children}</section>
        </main>
      </div>
    </div>
  );
}
