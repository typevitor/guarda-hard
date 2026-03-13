import { apiClient } from "@/lib/api/client";

export type DashboardHardware = {
  id: string;
  funcionando: boolean;
  livre: boolean;
};

export type DashboardStatusId = "disponivel" | "emprestado" | "defeituoso";

export type DashboardStatusCard = {
  id: DashboardStatusId;
  label: string;
  count: number;
};

export type DashboardData = {
  cards: DashboardStatusCard[];
};

const EMPTY_DASHBOARD_DATA: DashboardData = {
  cards: [
    { id: "disponivel", label: "Disponiveis", count: 0 },
    { id: "emprestado", label: "Emprestados", count: 0 },
    { id: "defeituoso", label: "Defeituosos", count: 0 },
  ],
};

function isDashboardHardware(value: unknown): value is DashboardHardware {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Partial<DashboardHardware>;
  return (
    typeof candidate.id === "string" &&
    typeof candidate.funcionando === "boolean" &&
    typeof candidate.livre === "boolean"
  );
}

function parseHardwares(payload: unknown): DashboardHardware[] {
  if (Array.isArray(payload)) {
    return payload.filter(isDashboardHardware);
  }

  if (
    payload &&
    typeof payload === "object" &&
    "items" in payload &&
    Array.isArray((payload as { items: unknown[] }).items)
  ) {
    return (payload as { items: unknown[] }).items.filter(isDashboardHardware);
  }

  return [];
}

async function loadHardwares(): Promise<DashboardHardware[]> {
  try {
    const payload = await apiClient<unknown>({
      path: "/hardwares",
      method: "GET",
      fallbackErrorMessage: "Nao foi possivel carregar dashboard",
    });

    return parseHardwares(payload);
  } catch {
    return [];
  }
}

export async function getDashboardData(
  fetchHardwares: () => Promise<DashboardHardware[]> = loadHardwares,
): Promise<DashboardData> {
  let hardwares: DashboardHardware[] = [];

  try {
    hardwares = await fetchHardwares();
  } catch {
    return EMPTY_DASHBOARD_DATA;
  }

  const counts = hardwares.reduce(
    (acc, hardware) => {
      if (!hardware.funcionando) {
        acc.defeituoso += 1;
      } else if (hardware.livre) {
        acc.disponivel += 1;
      } else {
        acc.emprestado += 1;
      }

      return acc;
    },
    { disponivel: 0, emprestado: 0, defeituoso: 0 },
  );

  return {
    cards: [
      { id: "disponivel", label: "Disponiveis", count: counts.disponivel },
      { id: "emprestado", label: "Emprestados", count: counts.emprestado },
      { id: "defeituoso", label: "Defeituosos", count: counts.defeituoso },
    ],
  };
}
