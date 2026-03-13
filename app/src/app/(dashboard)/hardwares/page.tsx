import { HardwaresPage } from "@/features/hardwares/components/hardwares-page";
import { hardwaresListQuerySchema } from "@/features/hardwares/schemas/hardwares-list-query-schema";
import type { HardwarePayload } from "@/features/hardwares/schemas/hardware-schema";
import { createHardwareServer } from "@/features/hardwares/server/hardwares-api";
import { listHardwaresServer } from "@/features/hardwares/server/hardwares-list-api";

async function submitHardware(values: HardwarePayload): Promise<void> {
  "use server";

  await createHardwareServer(values);
}

type HardwaresRoutePageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function HardwaresRoutePage({ searchParams }: HardwaresRoutePageProps) {
  const rawSearchParams = searchParams ? await searchParams : undefined;
  const query = hardwaresListQuerySchema.parse({
    page: rawSearchParams?.page,
    search: rawSearchParams?.search,
  });
  const list = await listHardwaresServer(query);

  return <HardwaresPage onSubmit={submitHardware} list={list} query={query} />;
}
