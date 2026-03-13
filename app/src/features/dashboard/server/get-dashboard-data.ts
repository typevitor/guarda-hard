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

async function loadHardwares(): Promise<DashboardHardware[]> {
  return [];
}

export async function getDashboardData(
  fetchHardwares: () => Promise<DashboardHardware[]> = loadHardwares,
): Promise<DashboardData> {
  const hardwares = await fetchHardwares();

  const disponivel = hardwares.filter((hardware) => hardware.funcionando && hardware.livre).length;
  const emprestado = hardwares.filter((hardware) => hardware.funcionando && !hardware.livre).length;
  const defeituoso = hardwares.filter((hardware) => !hardware.funcionando).length;

  return {
    cards: [
      { id: "disponivel", label: "Disponiveis", count: disponivel },
      { id: "emprestado", label: "Emprestados", count: emprestado },
      { id: "defeituoso", label: "Defeituosos", count: defeituoso },
    ],
  };
}
