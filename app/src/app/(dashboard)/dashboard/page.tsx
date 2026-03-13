import { DashboardPage } from "@/features/dashboard/components/dashboard-page";
import { getDashboardData } from "@/features/dashboard/server/get-dashboard-data";

export default async function DashboardRoutePage() {
  const data = await getDashboardData();

  return <DashboardPage data={data} />;
}
