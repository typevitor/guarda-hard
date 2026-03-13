import { HardwaresPage } from "@/features/hardwares/components/hardwares-page";
import type { HardwarePayload } from "@/features/hardwares/schemas/hardware-schema";
import { createHardwareServer } from "@/features/hardwares/server/hardwares-api";

async function submitHardware(values: HardwarePayload): Promise<void> {
  "use server";

  await createHardwareServer(values);
}

export default function HardwaresRoutePage() {
  return <HardwaresPage onSubmit={submitHardware} />;
}
