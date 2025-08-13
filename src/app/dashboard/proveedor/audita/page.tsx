
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, BarChartHorizontal } from "lucide-react";
import Link from "next/link";
import { FinancialCharts } from "@/components/proveedor/financial-charts";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";

export default function AuditaPage() {
  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="space-y-1">
                <CardTitle className="text-3xl flex items-center gap-2">
                    <BarChartHorizontal className="h-8 w-8 text-primary" />
                    Audita tu Negocio
                </CardTitle>
                <CardDescription>
                    Visualiza el rendimiento de tu negocio a través de gráficos interactivos.
                </CardDescription>
            </div>
            <Button asChild variant="outline" className="w-full sm:w-auto">
                <Link href="/dashboard/proveedor">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Volver al Panel
                </Link>
            </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        <Suspense fallback={
            <div className="space-y-8">
                <Skeleton className="h-80 w-full" />
                <Skeleton className="h-80 w-full" />
            </div>
        }>
            <FinancialCharts />
        </Suspense>
      </CardContent>
    </Card>
  );
}
