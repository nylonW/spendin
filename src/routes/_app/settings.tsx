import { createFileRoute } from "@tanstack/react-router";
import { useAuth, CURRENCIES, type CurrencyCode } from "@/lib/auth";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Check, Copy, Link2, RefreshCw, Smartphone, Coins } from "lucide-react";

export const Route = createFileRoute("/_app/settings")({
  component: SettingsView,
});

function SettingsView() {
  const { syncCode, generateSyncCode, syncWithCode, currency, updateCurrency } = useAuth();
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const [inputCode, setInputCode] = useState("");
  const [syncError, setSyncError] = useState<string | null>(null);
  const [syncSuccess, setSyncSuccess] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleGenerateCode = async () => {
    setIsGenerating(true);
    const code = await generateSyncCode();
    setGeneratedCode(code);
    setIsGenerating(false);
  };

  const handleSync = async () => {
    if (!inputCode.trim()) return;

    setSyncError(null);
    setSyncSuccess(false);

    const result = await syncWithCode(inputCode.trim().toUpperCase());
    if (result.success) {
      setSyncSuccess(true);
      setInputCode("");
    } else {
      setSyncError(result.error || "Sync failed");
    }
  };

  const handleCopy = () => {
    if (generatedCode) {
      navigator.clipboard.writeText(generatedCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="p-3 space-y-4">
      <Card className="p-4 block">
        <div className="flex items-center gap-2 mb-3">
          <Coins className="size-4 text-primary" />
          <h3 className="text-sm font-medium">Currency</h3>
        </div>
        <p className="text-xs text-muted-foreground mb-3">
          Choose the currency to display amounts in.
        </p>
        <Select value={currency} onValueChange={(value) => updateCurrency(value as CurrencyCode)}>
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {(Object.entries(CURRENCIES) as [CurrencyCode, { symbol: string; name: string }][]).map(
              ([code, { symbol, name }]) => (
                <SelectItem key={code} value={code}>
                  {symbol} - {name} ({code})
                </SelectItem>
              )
            )}
          </SelectContent>
        </Select>
      </Card>

      {/* Device Sync */}
      <Card className="p-4 block">
        <div className="flex items-center gap-2 mb-3">
          <Smartphone className="size-4 text-primary" />
          <h3 className="text-sm font-medium">Sync Devices</h3>
        </div>
        <p className="text-xs text-muted-foreground mb-4">
          Access your data on another device or browser by generating a sync code.
        </p>

        {/* Generate Code Section */}
        <div className="space-y-3 mb-4">
          <Label className="text-xs">Share your data</Label>
          {generatedCode || syncCode ? (
            <div className="flex gap-2">
              <div className="flex-1 bg-muted rounded-md px-3 py-2 font-mono text-lg tracking-widest text-center">
                {generatedCode || syncCode}
              </div>
              <Button
                variant="outline"
                size="icon"
                onClick={handleCopy}
                className="shrink-0"
              >
                {copied ? <Check className="size-4 text-green-600" /> : <Copy className="size-4" />}
              </Button>
            </div>
          ) : (
            <Button
              variant="outline"
              className="w-full"
              onClick={handleGenerateCode}
              disabled={isGenerating}
            >
              {isGenerating ? (
                <RefreshCw className="size-4 animate-spin mr-2" />
              ) : (
                <Link2 className="size-4 mr-2" />
              )}
              Generate Sync Code
            </Button>
          )}
          {(generatedCode || syncCode) && (
            <p className="text-[10px] text-muted-foreground">
              Enter this code on your other device to sync your data.
            </p>
          )}
        </div>

        {/* Enter Code Section */}
        <div className="border-t pt-4 space-y-3">
          <Label className="text-xs">Connect to existing account</Label>
          <div className="flex gap-2">
            <Input
              placeholder="Enter sync code"
              value={inputCode}
              onChange={(e) => setInputCode(e.target.value.toUpperCase())}
              className="font-mono uppercase tracking-widest"
              maxLength={6}
            />
            <Button onClick={handleSync} disabled={!inputCode.trim()}>
              Sync
            </Button>
          </div>
          {syncError && <p className="text-xs text-destructive">{syncError}</p>}
          {syncSuccess && (
            <p className="text-xs text-green-600">Successfully synced! Your data is now connected.</p>
          )}
        </div>
      </Card>

      {/* About */}
      <Card className="p-4 block">
        <h3 className="text-sm font-medium mb-2">About spendin</h3>
        <p className="text-xs text-muted-foreground">
          A simple expense tracker to help you manage your daily spending, recurring expenses, and
          money you lend to friends.
        </p>
        <p className="text-xs text-muted-foreground mt-2">
          Your data is stored securely and linked to your device. Use sync codes to access your data
          across multiple devices.
        </p>
      </Card>
    </div>
  );
}
