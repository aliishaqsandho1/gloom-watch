import type { UptimeRobotMonitor } from "@/lib/uptimerobot";
import { MonitorCard } from "./MonitorCard";

interface MonitorGridProps {
  monitors: UptimeRobotMonitor[];
}

export function MonitorGrid({ monitors }: MonitorGridProps) {
  if (!monitors?.length) {
    return (
      <div className="text-center text-muted-foreground py-10">No monitors found.</div>
    );
  }
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {monitors.map((m) => (
        <MonitorCard key={m.id} monitor={m} />
      ))}
    </div>
  );
}
