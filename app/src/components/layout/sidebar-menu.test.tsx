// @vitest-environment jsdom
import { renderToStaticMarkup } from "react-dom/server";
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
  { label: "Dashboard", href: "/dashboard" },
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

    const html = renderToStaticMarkup(<SidebarMenu />);
    const document = new DOMParser().parseFromString(html, "text/html");

    for (const item of expectedLinks) {
      const link = Array.from(document.querySelectorAll("a")).find(
        (candidate) => candidate.textContent?.trim() === item.label,
      );

      expect(link).toBeDefined();
      expect(link?.getAttribute("href")).toBe(item.href);
    }
  });

  it("highlights the active item by pathname", () => {
    vi.mocked(usePathname).mockReturnValue("/hardwares");

    const html = renderToStaticMarkup(<SidebarMenu />);
    const document = new DOMParser().parseFromString(html, "text/html");
    const activeLinks = Array.from(
      document.querySelectorAll('a[aria-current="page"]'),
    );

    expect(activeLinks).toHaveLength(1);
    expect(activeLinks[0]?.getAttribute("href")).toBe("/hardwares");
  });

  it("renders compact mode with compact menu class", () => {
    vi.mocked(usePathname).mockReturnValue("/usuarios");

    const html = renderToStaticMarkup(<SidebarMenu compact />);
    const document = new DOMParser().parseFromString(html, "text/html");
    const nav = document.querySelector('nav[aria-label="Menu principal"]');

    expect(nav).toBeDefined();
    expect(nav?.className).toContain("menu-compact");
  });
});
