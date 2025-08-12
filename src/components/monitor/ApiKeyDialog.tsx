import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

interface ApiKeyDialogProps {
  initialKey?: string;
  onSaved?: (key: string) => void;
}

export function ApiKeyDialog({ initialKey = "", onSaved }: ApiKeyDialogProps) {
  const [apiKey, setApiKey] = useState(initialKey);

  const handleSave = () => {
    localStorage.setItem("uptime_api_key", apiKey.trim());
    onSaved?.(apiKey.trim());
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="glow">Set API Key</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Connect UptimeRobot</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          <div className="grid gap-2">
            <Label htmlFor="apiKey">API Key</Label>
            <Input
              id="apiKey"
              type="password"
              placeholder="uXXXXXXXX-XXXXXXXXXXXX..."
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              autoFocus
            />
            <p className="text-sm text-muted-foreground">
              Your key is stored locally in this browser only.
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleSave}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
