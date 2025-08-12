import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { MonitorGrid } from "@/components/monitor/MonitorGrid";
import MagicalGradient from "@/components/MagicalGradient";
import { fetchMonitors, type UptimeRobotMonitor } from "@/lib/uptimerobot";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { RefreshCcw } from "lucide-react";

export default function Index() {
  useEffect(() => {
    // SEO
    document.title = "Site Monitor — Dark Uptime Dashboard";
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute("content", "Beautiful dark-mode uptime monitor dashboard. Track website status in real-time.");
  }, []);

  const query = useQuery({
    queryKey: ["monitors"],
    queryFn: () => fetchMonitors(),
    refetchOnWindowFocus: false,
  });

  const monitors: UptimeRobotMonitor[] = query.data || [];
  const upCount = monitors.filter((m) => m.status === 2).length;
  const downCount = monitors.filter((m) => m.status === 8 || m.status === 9).length;

  const handleRefresh = async () => {
    await query.refetch();
    toast({ title: "Refreshed", description: "Fetched latest monitor status." });
  };

  return (
    <>
      <MagicalGradient />
      <header className="container mx-auto pt-10 pb-6">
        <nav className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
              Site Monitor — Dark Uptime Dashboard
            </h1>
            <p className="text-muted-foreground mt-2 max-w-2xl">
              Monitor website availability in real-time with a beautiful, high-contrast dark UI.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={handleRefresh} className="gap-2" aria-label="Refresh">
              <RefreshCcw className="h-4 w-4" /> Refresh
            </Button>
          </div>
        </nav>
      </header>

      <main className="container mx-auto pb-16">
        <section className="mb-6">
          <div className="flex flex-wrap items-center gap-3">
            <Badge variant="secondary">Total: {monitors.length}</Badge>
            <Badge className="bg-brand/15 text-brand">Up: {upCount}</Badge>
            <Badge className="bg-destructive/15 text-destructive">Down: {downCount}</Badge>
          </div>
          <Separator className="my-6" />
        </section>

        <section aria-label="Monitors">
          {query.isLoading ? (
            <div className="py-16 text-center text-muted-foreground">Loading monitors…</div>
          ) : query.isError ? (
            <div className="py-16 text-center">
              <p className="text-destructive mb-3">Failed to load monitors.</p>
              <div className="flex items-center justify-center gap-3">
                <Button onClick={handleRefresh}>Retry</Button>
              </div>
            </div>
          ) : (
            <MonitorGrid monitors={monitors} />
          )}
        </section>
      </main>
    </>
  );
}
