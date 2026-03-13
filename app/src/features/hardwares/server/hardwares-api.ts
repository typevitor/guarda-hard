import { apiClient } from "@/lib/api/client";

import { hardwareSchema, type HardwarePayload } from "../schemas/hardware-schema";

export async function createHardwareServer(payload: HardwarePayload): Promise<void> {
  const parsedPayload = hardwareSchema.parse(payload);

  await apiClient({
    path: "/hardwares",
    method: "POST",
    body: parsedPayload,
    responseType: "void",
    fallbackErrorMessage: "Nao foi possivel criar hardware",
  });
}
