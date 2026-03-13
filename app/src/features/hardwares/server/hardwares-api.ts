import { cookies } from "next/headers";

import { hardwareSchema, type HardwarePayload } from "../schemas/hardware-schema";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

export async function createHardwareServer(payload: HardwarePayload): Promise<void> {
  const parsedPayload = hardwareSchema.parse(payload);
  const cookieHeader = (await cookies()).toString();

  const response = await fetch(`${API_BASE_URL}/hardwares`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(cookieHeader ? { Cookie: cookieHeader } : {}),
    },
    body: JSON.stringify(parsedPayload),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Nao foi possivel criar hardware");
  }
}
