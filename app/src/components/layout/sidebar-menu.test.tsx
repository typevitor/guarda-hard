import { renderToStaticMarkup } from "react-dom/server";
import { SidebarMenu } from "./sidebar-menu";

vi.mock("next/navigation", () => ({
  usePathname: vi.fn(),
}));

import { usePathname } from "next/navigation";

describe("SidebarMenu", () => {
  it("renders all Etapa 7 navigation links", () => {
    vi.mocked(usePathname).mockReturnValue("/");

    const html = renderToStaticMarkup(<SidebarMenu />);

    expect(html).toContain("Dashboard");
    expect(html).toContain("Departamentos");
    expect(html).toContain("Usuarios");
    expect(html).toContain("Hardwares");
    expect(html).toContain("Emprestimo");
    expect(html).toContain("Devolucao");
    expect(html).toContain("Relatorios");
  });

  it("highlights the active item by pathname", () => {
    vi.mocked(usePathname).mockReturnValue("/hardwares");

    const html = renderToStaticMarkup(<SidebarMenu />);

    expect(html).toContain('href="/hardwares"');
    expect(html).toContain('aria-current="page"');
  });
});
