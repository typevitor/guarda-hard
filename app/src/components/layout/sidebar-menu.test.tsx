// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { SidebarMenu } from "./sidebar-menu";

vi.mock("next/link", () => ({
  default: ({ href, children, ...props }: React.ComponentProps<"a">) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

vi.mock("next/navigation", () => ({
  usePathname: vi.fn(),
}));

import { usePathname } from "next/navigation";

const expectedLinks = [
  { label: "Dashboard", href: "/" },
  { label: "Departamentos", href: "/departamentos" },
  { label: "Usuarios", href: "/usuarios" },
  { label: "Hardwares", href: "/hardwares" },
  { label: "Emprestimo", href: "/emprestimo" },
  { label: "Devolucao", href: "/devolucao" },
  { label: "Relatorios", href: "/relatorios" },
];

describe("SidebarMenu", () => {
  it("renders all Etapa 7 navigation links", () => {
    vi.mocked(usePathname).mockReturnValue("/");

    render(<SidebarMenu />);

    for (const item of expectedLinks) {
      const link = screen.getByRole("link", { name: item.label });
      expect(link.getAttribute("href")).toBe(item.href);
    }
  });

  it("highlights the active item by pathname", () => {
    vi.mocked(usePathname).mockReturnValue("/hardwares");

    render(<SidebarMenu />);

    const activeLinks = screen.getAllByRole("link", { current: "page" });
    expect(activeLinks).toHaveLength(1);
    expect(activeLinks[0]?.getAttribute("href")).toBe("/hardwares");
  });

  it("renders compact mode with compact menu class", () => {
    vi.mocked(usePathname).mockReturnValue("/usuarios");

    render(<SidebarMenu compact />);

    const nav = screen.getByRole("navigation", { name: "Menu principal" });
    expect(nav.className).toContain("menu-compact");
  });
});
