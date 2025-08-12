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

export async function fetchMonitors(apiKey: string): Promise<UptimeRobotMonitor[]> {
  const body = new URLSearchParams();
  body.set("api_key", apiKey);
  body.set("format", "json");

  const res = await fetch("https://api.uptimerobot.com/v2/getMonitors", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });

  if (!res.ok) {
    throw new Error(`UptimeRobot error: ${res.status}`);
  }

  const data = (await res.json()) as GetMonitorsResponse & { error?: { message?: string } };
  if ((data as any).error) {
    throw new Error((data as any).error?.message || "Unknown UptimeRobot error");
  }
  return data.monitors || [];
}
