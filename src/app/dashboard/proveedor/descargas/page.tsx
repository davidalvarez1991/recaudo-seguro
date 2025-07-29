
"use client";

import { useState } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, Calendar as CalendarIcon, Loader2, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { DateRange } from "react-day-picker";
import { format, endOfDay } from "date-fns";
import { es } from "date-fns/locale";
import { getCreditsByProvider } from "@/lib/actions";
import * as XLSX from "xlsx";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

type Registro = {
  id: string;
  cobradorId: string;
  cobradorName?: string;
  clienteId: string;
  clienteName?: string;
  estado: string; 
  valor: number;
  commission: number;
  fecha: string;
  cuotas: number;
  lateFee: number;
  endDate?: string;
  dailyCollectedAmount?: number;
  agreementAmount?: number;
};

export default function DescargasPage() {
    const [dateRange, setDateRange] = useState<DateRange | undefined>();
    const [loading, setLoading] = useState(false);
    const { toast } = useToast();

    const formatCurrency = (value: number) => {
        if (isNaN(value)) return "$0";
        return `$${value.toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
    };

    const handleDownload = async () => {
        if (!dateRange || !dateRange.from) {
            toast({
                title: "Seleccione un rango",
                description: "Debe seleccionar un rango de fechas para descargar el reporte.",
                variant: "destructive",
            });
            return;
        }

        setLoading(true);
        try {
            const allRecords: Registro[] = await getCreditsByProvider();
            
            const fromDate = dateRange.from;
            const toDate = dateRange.to ? endOfDay(dateRange.to) : endOfDay(dateRange.from);
            
            const filteredRecords = allRecords.filter(record => {
                const recordDate = new Date(record.fecha);
                return recordDate >= fromDate && recordDate <= toDate;
            });

            if (filteredRecords.length === 0) {
                 toast({
                    title: "No hay registros",
                    description: "No se encontraron créditos en el rango de fechas seleccionado.",
                    variant: "default",
                });
                setLoading(false);
                return;
            }

            const dataToExport = filteredRecords.map(r => ({
                "Nombre Cliente": r.clienteName,
                "Cédula Cliente": r.clienteId,
                "Fecha Crédito": format(new Date(r.fecha), "dd/MM/yyyy HH:mm"),
                "Fecha Fin de Crédito": r.endDate ? format(new Date(r.endDate), "dd/MM/yyyy") : 'N/A',
                "Cuotas": r.cuotas,
                "Valor Crédito": r.valor,
                "Ganancia (Comisión)": r.commission,
                "Recaudo del Día": r.dailyCollectedAmount || 0,
                "Valor Acuerdos": r.agreementAmount || 0,
                "Valor Mora": r.lateFee,
                "Nombre Cobrador": r.cobradorName,
                "Cédula Cobrador": r.cobradorId,
            }));

            const worksheet = XLSX.utils.json_to_sheet(dataToExport);
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, "Registros");
            XLSX.writeFile(workbook, `Reporte_RecaudoSeguro_${format(new Date(), "yyyy-MM-dd")}.xlsx`);

            toast({
                title: "Descarga Exitosa",
                description: `Se ha generado un reporte con ${filteredRecords.length} registros.`,
                variant: "default",
                className: "bg-accent text-accent-foreground border-accent",
            });

        } catch (error) {
            toast({
                title: "Error",
                description: "No se pudo generar el reporte. Intente de nuevo.",
                variant: "destructive",
            });
            console.error(error);
        } finally {
            setLoading(false);
        }
    }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="space-y-1">
                <CardTitle className="text-3xl">Descargar Reportes</CardTitle>
                <CardDescription>
                Selecciona un rango de fechas para descargar los registros de créditos en formato Excel.
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
      <CardContent className="pt-6 space-y-6">
        <div className="flex flex-col sm:flex-row gap-4">
            <Popover>
                <PopoverTrigger asChild>
                    <Button
                        id="date"
                        variant={"outline"}
                        className={cn(
                        "w-full sm:w-[300px] justify-start text-left font-normal",
                        !dateRange && "text-muted-foreground"
                        )}
                    >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {dateRange?.from ? (
                            dateRange.to ? (
                                <>
                                {format(dateRange.from, "LLL dd, y", { locale: es })} -{" "}
                                {format(dateRange.to, "LLL dd, y", { locale: es })}
                                </>
                            ) : (
                                format(dateRange.from, "LLL dd, y", { locale: es })
                            )
                        ) : (
                            <span>Selecciona un rango de fechas</span>
                        )}
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                        initialFocus
                        mode="range"
                        defaultMonth={dateRange?.from}
                        selected={dateRange}
                        onSelect={setDateRange}
                        numberOfMonths={2}
                        locale={es}
                    />
                </PopoverContent>
            </Popover>

            <Button onClick={handleDownload} disabled={loading || !dateRange?.from}>
                {loading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                    <Download className="mr-2 h-4 w-4" />
                )}
                {loading ? "Generando..." : "Descargar Reporte"}
            </Button>
        </div>
      </CardContent>
    </Card>
  );
}
