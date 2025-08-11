
"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, Users, DollarSign, RefreshCw, Loader2, Download } from "lucide-react";
import Link from "next/link";
import { getAllProviders, getAdminSettings } from "@/lib/actions";
import { useToast } from "@/hooks/use-toast";
import * as XLSX from "xlsx";
import { format } from "date-fns";

const formatCurrency = (value: number) => {
    if (isNaN(value)) return "$0";
    return `$${value.toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
};

type ProviderData = {
  id: string;
  companyName: string;
  uniqueClientCount: number;
};

export default function SoportesIngresosPage() {
    const [providers, setProviders] = useState<ProviderData[]>([]);
    const [pricePerClient, setPricePerClient] = useState(3500);
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [providersData, settingsData] = await Promise.all([
                getAllProviders(),
                getAdminSettings()
            ]);
            setProviders(providersData);
            setPricePerClient(settingsData.pricePerClient || 3500);
        } catch (error) {
            toast({
                title: "Error",
                description: "No se pudieron cargar los datos.",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    }, [toast]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);
    
    const handleDownload = () => {
        const dataToExport = providers.map(p => ({
            "Proveedor": p.companyName,
            "Clientes Únicos": p.uniqueClientCount,
            "Suscripción a Pagar": p.uniqueClientCount * pricePerClient,
        }));
        
        const worksheet = XLSX.utils.json_to_sheet(dataToExport);
        
        // Format as currency
        worksheet['!cols'] = [{ wch: 30 }, { wch: 15 }, { wch: 20 }];
        dataToExport.forEach((_, index) => {
            const cellRef = XLSX.utils.encode_cell({c: 2, r: index + 1});
            if(worksheet[cellRef]) {
                worksheet[cellRef].t = 'n';
                worksheet[cellRef].z = '$#,##0';
            }
        });

        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Soportes de Ingresos");
        XLSX.writeFile(workbook, `Reporte_Suscripciones_${format(new Date(), "yyyy-MM-dd")}.xlsx`);
    }

    const totalProjectedIncome = providers.reduce((sum, p) => sum + (p.uniqueClientCount * pricePerClient), 0);
    const totalClients = providers.reduce((sum, p) => sum + p.uniqueClientCount, 0);
    const totalProviders = providers.length;

  return (
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div className="space-y-1 flex-1">
                <h1 className="text-3xl font-bold tracking-tight">Soportes de Ingresos</h1>
                <p className="text-muted-foreground">
                    Revisa la facturación proyectada por cada proveedor según su número de clientes.
                </p>
            </div>
             <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                <Button onClick={fetchData} variant="outline" disabled={loading}>
                    {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
                    Actualizar
                </Button>
                 <Button onClick={handleDownload} variant="outline" disabled={loading || providers.length === 0}>
                    <Download className="mr-2 h-4 w-4" />
                    Descargar Excel
                </Button>
                <Button asChild variant="outline">
                    <Link href="/dashboard/admin">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Volver al Panel
                    </Link>
                </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
             {loading ? (
                <div className="flex justify-center items-center h-40">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            ) : (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                        <Card className="bg-green-50 dark:bg-green-900/30 border-green-200">
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-green-800 dark:text-green-200">Ingreso Total Proyectado</CardTitle>
                            <DollarSign className="h-5 w-5 text-green-600 dark:text-green-400" />
                            </CardHeader>
                            <CardContent>
                            <div className="text-3xl font-bold text-green-900 dark:text-green-300">{formatCurrency(totalProjectedIncome)}</div>
                            </CardContent>
                        </Card>
                        <Card className="bg-blue-50 dark:bg-blue-900/30 border-blue-200">
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-blue-800 dark:text-blue-200">Total Proveedores</CardTitle>
                            <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                            </CardHeader>
                            <CardContent>
                            <div className="text-3xl font-bold text-blue-900 dark:text-blue-300">{totalProviders}</div>
                            </CardContent>
                        </Card>
                        <Card className="bg-indigo-50 dark:bg-indigo-900/30 border-indigo-200">
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-indigo-800 dark:text-indigo-200">Total Clientes en Plataforma</CardTitle>
                            <Users className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                            </CardHeader>
                            <CardContent>
                            <div className="text-3xl font-bold text-indigo-900 dark:text-indigo-300">{totalClients}</div>
                            </CardContent>
                        </Card>
                        <Card className="bg-purple-50 dark:bg-purple-900/30 border-purple-200">
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-purple-800 dark:text-purple-200">Precio por Cliente</CardTitle>
                            <DollarSign className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                            </CardHeader>
                            <CardContent>
                            <div className="text-3xl font-bold text-purple-900 dark:text-purple-300">{formatCurrency(pricePerClient)}</div>
                            </CardContent>
                        </Card>
                    </div>

                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Proveedor</TableHead>
                                <TableHead className="text-center">Clientes Únicos</TableHead>
                                <TableHead className="text-right">Suscripción a Pagar</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {providers.length > 0 ? (
                                providers.map((provider) => (
                                    <TableRow key={provider.id}>
                                        <TableCell className="font-medium">{provider.companyName}</TableCell>
                                        <TableCell className="text-center">{provider.uniqueClientCount}</TableCell>
                                        <TableCell className="text-right font-bold text-primary">{formatCurrency(provider.uniqueClientCount * pricePerClient)}</TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={3} className="text-center h-24 text-muted-foreground">
                                        No hay proveedores registrados.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </>
            )}
        </CardContent>
      </Card>
  );
}
