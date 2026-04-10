type EmitRealtimeEventInput = {
  event: string;
  payload?: unknown;
  rooms?: string[];
};

export const emitRealtimeEvent = async ({ event, payload, rooms }: EmitRealtimeEventInput) => {
  const realtimeServerUrl = process.env.REALTIME_SERVER_URL;

  if (!realtimeServerUrl) {
    return;
  }

  try {
    await fetch(`${realtimeServerUrl}/emit`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-realtime-secret": process.env.REALTIME_EMIT_SECRET || "",
      },
      body: JSON.stringify({ event, payload, rooms }),
      cache: "no-store",
    });
  } catch (error) {
    console.error("[REALTIME_EMIT_ERROR]", error);
  }
};
