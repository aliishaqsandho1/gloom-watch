import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Globe, CheckCircle2, AlertTriangle, Clock } from "lucide-react";
import type { UptimeRobotMonitor } from "@/lib/uptimerobot";

function statusInfo(status: number) {
  switch (status) {
    case 2:
      return { label: "Up", color: "text-brand", badge: "bg-brand/15 text-brand" };
    case 0:
      return { label: "Paused", color: "text-muted-foreground", badge: "bg-muted text-foreground" };
    case 1:
      return { label: "Pending", color: "text-muted-foreground", badge: "bg-muted text-foreground" };
    case 8:
      return { label: "Seems Down", color: "text-destructive", badge: "bg-destructive/15 text-destructive" };
    case 9:
      return { label: "Down", color: "text-destructive", badge: "bg-destructive/15 text-destructive" };
    default:
      return { label: "Unknown", color: "text-muted-foreground", badge: "bg-muted text-foreground" };
  }
}

function formatDate(ts?: number) {
  if (!ts) return "—";
  try {
    return new Date(ts * 1000).toLocaleString();
  } catch {
    return "—";
  }
}

interface MonitorCardProps {
  monitor: UptimeRobotMonitor;
}

export function MonitorCard({ monitor }: MonitorCardProps) {
  const info = statusInfo(monitor.status);
  const isUp = monitor.status === 2;

  return (
    <Card className={cn("group relative overflow-hidden border-border/60 bg-card backdrop-blur", "hover:shadow-[0_0_0_1px_hsl(var(--brand)/0.2),0_12px_40px_-12px_hsl(var(--brand)/0.2)] transition-shadow duration-300")}> 
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Globe className={cn("h-5 w-5", info.color)} />
            <span className="truncate max-w-[18rem]">{monitor.friendly_name}</span>
          </CardTitle>
          <span className={cn("px-2.5 py-1 rounded-full text-xs font-medium", info.badge)}>
            {info.label}
          </span>
        </div>
      </CardHeader>
      <CardContent className="grid gap-3 text-sm animate-enter">
        <div className="flex items-center gap-2 text-muted-foreground">
          {isUp ? (
            <CheckCircle2 className="h-4 w-4 text-brand" />
          ) : (
            <AlertTriangle className="h-4 w-4 text-destructive" />
          )}
          <a href={monitor.url} className="story-link truncate" target="_blank" rel="noreferrer">
            {monitor.url}
          </a>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
          <Clock className="h-4 w-4" />
          <span>Created: {formatDate(monitor.create_datetime)}</span>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
          <span>Interval: {monitor.interval ? `${Math.round((monitor.interval || 0) / 60)} min` : '—'}</span>
          <span className="mx-2">•</span>
          <span>Timeout: {monitor.timeout ? `${monitor.timeout}s` : '—'}</span>
        </div>
      </CardContent>
    </Card>
  );
}
