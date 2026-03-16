import { HardwaresPage } from "@/features/hardwares/components/hardwares-page";
import { hardwaresListQuerySchema } from "@/features/hardwares/schemas/hardwares-list-query-schema";
import type { HardwarePayload } from "@/features/hardwares/schemas/hardware-schema";
import { createHardwareServer } from "@/features/hardwares/server/hardwares-api";
import { listHardwaresServer } from "@/features/hardwares/server/hardwares-list-api";
import { ApiError } from "@/lib/api/errors";

async function submitHardware(
  values: HardwarePayload,
): Promise<{ ok: true } | { ok: false; status?: number; message: string }> {
  "use server";

  try {
    await createHardwareServer(values);
    return { ok: true };
  } catch (error) {
    if (error instanceof ApiError) {
      return {
        ok: false,
        status: error.status,
        message: error.message,
      };
    }

    return {
      ok: false,
      message: "Nao foi possivel criar hardware",
    };
  }
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
