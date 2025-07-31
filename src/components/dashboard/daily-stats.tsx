
"use client";

import { useState, useEffect, useCallback } from "react";
import { getCobradorSelfDailySummary } from "@/lib/actions";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, RefreshCw, CheckCircle, Star, AlertTriangle } from "lucide-react";

type DailySummary = {
  successfulPayments: number;
  renewedCredits: number;
  missedPayments: number;
};

type DailyStatsProps = {
    initialData: DailySummary;
}

export function DailyStats({ initialData }: DailyStatsProps) {
  const [data, setData] = useState<DailySummary>(initialData);
  const [loading, setLoading] = useState(false);

  const fetchSummary = useCallback(async () => {
    setLoading(true);
    try {
      const summaryData = await getCobradorSelfDailySummary();
      setData(summaryData);
    } catch (error) {
      console.error("Failed to fetch daily summary:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  return (
     <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">Resumen de tu Gestión Diaria</h3>
          <p className="text-sm text-muted-foreground">
            Tu rendimiento de hoy en tiempo real.
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

       <div className="grid gap-4 md:grid-cols-3">
          <Card className="bg-background">
              <CardContent className="p-4 flex items-center gap-4">
                  <p className="text-4xl font-bold text-green-600">{data.successfulPayments}</p>
                  <div className="text-sm text-muted-foreground flex items-center gap-2">
                      <CheckCircle className="h-4 w-4"/>
                      <span>Pagos</span>
                  </div>
              </CardContent>
          </Card>
           <Card className="bg-background">
              <CardContent className="p-4 flex items-center gap-4">
                  <p className="text-4xl font-bold text-amber-600">{data.renewedCredits}</p>
                  <div className="text-sm text-muted-foreground flex items-center gap-2">
                      <Star className="h-4 w-4"/>
                      <span>Renovados</span>
                  </div>
              </CardContent>
          </Card>
          <Card className="bg-background">
              <CardContent className="p-4 flex items-center gap-4">
                  <p className="text-4xl font-bold text-red-600">{data.missedPayments}</p>
                   <div className="text-sm text-muted-foreground flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4"/>
                      <span>En Mora</span>
                  </div>
              </CardContent>
          </Card>
      </div>
     </div>
  );
}
