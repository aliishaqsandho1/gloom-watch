export type UptimeRobotMonitor = {
  id: number;
  friendly_name: string;
  url: string;
  type: number;
  status: number; // 2=up, 9=down, others: paused/not checked
  interval?: number;
  timeout?: number;
  create_datetime?: number;
};

export type GetMonitorsResponse = {
  stat: string;
  monitors: UptimeRobotMonitor[];
};

export async function fetchMonitors(): Promise<UptimeRobotMonitor[]> {
  // Calls Supabase Edge Function that uses a stored secret for the API key
  const res = await fetch("/functions/v1/get-monitors", {
    method: "GET",
  });

  if (!res.ok) {
    throw new Error(`Edge function error: ${res.status}`);
  }

  const data = (await res.json()) as GetMonitorsResponse;
  return data.monitors || [];
}

