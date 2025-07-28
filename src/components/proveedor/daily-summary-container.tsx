
"use client";

import { useState, useEffect, useCallback } from "react";
import { getDailyCollectionSummary } from "@/lib/actions";
import { DailySummary } from "@/components/proveedor/daily-summary";
import { Button } from "@/components/ui/button";
import { Loader2, RefreshCw } from "lucide-react";

type SummaryData = {
  summary: {
    cobradorId: string;
    cobradorName: string;
    collectedAmount: number;
  }[];
  totalCollected: number;
};

export function DailySummaryContainer() {
  const [data, setData] = useState<SummaryData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchSummary = useCallback(async () => {
    setLoading(true);
    try {
      const summaryData = await getDailyCollectionSummary();
      setData(summaryData);
    } catch (error) {
      console.error("Failed to fetch daily summary:", error);
      // Optionally show a toast or error message
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">Resumen del Día</h3>
          <p className="text-sm text-muted-foreground">
            Visualiza el total recaudado hoy por tus cobradores en tiempo real.
          </p>
        </div>
        <Button onClick={fetchSummary} variant="outline" size="icon" disabled={loading}>
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
          <span className="sr-only">Actualizar resumen</span>
        </Button>
      </div>
      
      {loading && !data ? (
        <div className="flex justify-center items-center h-24 text-muted-foreground">
          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          <span>Cargando resumen...</span>
        </div>
      ) : data ? (
        <DailySummary summary={data.summary} total={data.totalCollected} />
      ) : (
         <p className="text-center text-muted-foreground py-8 border-2 border-dashed rounded-lg">No se pudieron cargar los datos.</p>
      )}
    </div>
  );
}
