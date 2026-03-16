"use client";

import { useState } from "react";
import { TradingPanel } from "@/components/panels/trading-panel";
import { AIPanel } from "@/components/panels/ai-panel";
import { IndustryPanel } from "@/components/panels/industry-panel";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Home() {
  const [timeRange, setTimeRange] = useState<"1H" | "24H" | "7D">("24H");
  const [lastUpdate, setLastUpdate] = useState(new Date());

  const handleRefresh = () => {
    setLastUpdate(new Date());
    // TODO: Trigger API refresh
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      {/* Header */}
      <header className="mb-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              Market Intelligence
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Last updated: {lastUpdate.toLocaleTimeString()}
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Time Range Selector */}
            <div className="flex rounded-lg bg-card border border-border p-1">
              {(["1H", "24H", "7D"] as const).map((range) => (
                <button
                  key={range}
                  onClick={() => setTimeRange(range)}
                  className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${
                    timeRange === range
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {range}
                </button>
              ))}
            </div>

            {/* Refresh Button */}
            <Button
              variant="outline"
              size="icon"
              onClick={handleRefresh}
              className="shrink-0"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Three Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        {/* Panel 1: Trading Monitor */}
        <div className="lg:col-span-1">
          <TradingPanel timeRange={timeRange} />
        </div>

        {/* Panel 2: AI Trends */}
        <div className="lg:col-span-1">
          <AIPanel timeRange={timeRange} />
        </div>

        {/* Panel 3: Industry Trends */}
        <div className="lg:col-span-1">
          <IndustryPanel timeRange={timeRange} />
        </div>
      </div>
    </div>
  );
}
