import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { ApiKeyDialog } from "@/components/monitor/ApiKeyDialog";
import { MonitorGrid } from "@/components/monitor/MonitorGrid";
import MagicalGradient from "@/components/MagicalGradient";
import { fetchMonitors, type UptimeRobotMonitor } from "@/lib/uptimerobot";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { RefreshCcw } from "lucide-react";

// Demo fallback data (from your reference)
const DEMO_MONITORS: UptimeRobotMonitor[] = [
  { id: 801153489, friendly_name: "charlottepilates.com/", url: "https://charlottepilates.com/", type: 1, status: 2, interval: 300, timeout: 30, create_datetime: 1755028658 },
  { id: 801153495, friendly_name: "hwpalaw.com/", url: "https://hwpalaw.com/", type: 1, status: 2, interval: 300, timeout: 30, create_datetime: 1755028706 },
  { id: 801153276, friendly_name: "sodomalaw.com/", url: "https://sodomalaw.com/", type: 1, status: 2, interval: 300, timeout: 30, create_datetime: 1755027403 },
  { id: 801153520, friendly_name: "thesodomaway.com/", url: "https://thesodomaway.com/", type: 1, status: 2, interval: 300, timeout: 30, create_datetime: 1755028870 },
  { id: 801153466, friendly_name: "www.agencyangle.com/", url: "https://www.agencyangle.com/", type: 1, status: 2, interval: 300, timeout: 30, create_datetime: 1755028488 },
  { id: 801153306, friendly_name: "www.liladene.com/", url: "https://www.liladene.com/", type: 1, status: 2, interval: 300, timeout: 30, create_datetime: 1755027601 },
  { id: 801153472, friendly_name: "www.reduxmassage.com/", url: "https://www.reduxmassage.com/", type: 1, status: 2, interval: 300, timeout: 30, create_datetime: 1755028561 },
  { id: 801153509, friendly_name: "yourncattorney.com/", url: "https://yourncattorney.com/", type: 1, status: 2, interval: 300, timeout: 30, create_datetime: 1755028786 },
];

export default function Index() {
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [useDemo, setUseDemo] = useState(false);

  useEffect(() => {
    // SEO
    document.title = "Site Monitor — Dark Uptime Dashboard";
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute("content", "Beautiful dark-mode uptime monitor dashboard. Track website status in real-time.");
  }, []);

  useEffect(() => {
    setApiKey(localStorage.getItem("uptime_api_key"));
  }, []);

  const query = useQuery({
    queryKey: ["monitors", apiKey],
    queryFn: () => fetchMonitors(apiKey!),
    enabled: !!apiKey && !useDemo,
    refetchOnWindowFocus: false,
  });

  const monitors: UptimeRobotMonitor[] = useMemo(() => {
    if (useDemo) return DEMO_MONITORS;
    return query.data || [];
  }, [query.data, useDemo]);

  const upCount = monitors.filter((m) => m.status === 2).length;
  const downCount = monitors.filter((m) => m.status === 8 || m.status === 9).length;

  const handleSavedKey = (key: string) => {
    setApiKey(key);
    setUseDemo(false);
    toast({ title: "API key saved", description: "Fetching latest monitor status..." });
    setTimeout(() => query.refetch(), 50);
  };

  const handleRefresh = async () => {
    if (!apiKey && !useDemo) {
      toast({ title: "No API key", description: "Set your UptimeRobot API key first." });
      return;
    }
    await query.refetch();
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
            <Button variant="outline" onClick={() => setUseDemo((v) => !v)}>
              {useDemo ? "Disable Demo" : "Use Demo Data"}
            </Button>
            <ApiKeyDialog initialKey={apiKey ?? ''} onSaved={handleSavedKey} />
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
          {!apiKey && !useDemo ? (
            <div className="py-16 text-center">
              <p className="text-lg text-muted-foreground mb-4">Connect your UptimeRobot API key to get started, or try demo data.</p>
              <div className="flex items-center justify-center gap-3">
                <ApiKeyDialog onSaved={handleSavedKey} />
                <Button variant="outline" onClick={() => setUseDemo(true)}>Use Demo Data</Button>
              </div>
            </div>
          ) : query.isLoading && !useDemo ? (
            <div className="py-16 text-center text-muted-foreground">Loading monitors…</div>
          ) : query.isError && !useDemo ? (
            <div className="py-16 text-center">
              <p className="text-destructive mb-3">Failed to load monitors.</p>
              <div className="flex items-center justify-center gap-3">
                <Button onClick={handleRefresh}>Retry</Button>
                <Button variant="outline" onClick={() => setUseDemo(true)}>Use Demo Data</Button>
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
