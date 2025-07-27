
"use client";

import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getHistoricalCreditsByCliente } from "@/lib/actions";
import { Loader2, History, ArrowLeft, ClipboardList } from "lucide-react";
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Button } from "@/components/ui/button";

type HistoricalCredit = {
  id: string;
  fecha: string;
  valor: number;
  estado: string;
  providerName: string;
};

const formatCurrency = (value: number) => {
  if (isNaN(value)) return "$0";
  return `$${value.toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
};

export default function HistorialClientePage() {
  const [credits, setCredits] = useState<HistoricalCredit[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        setLoading(true);
        const data = await getHistoricalCreditsByCliente();
        setCredits(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, []);

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="space-y-1">
                <CardTitle className="text-3xl flex items-center gap-2">
                    <History className="h-8 w-8 text-primary" />
                    Historial de Créditos
                </CardTitle>
                <CardDescription>
                    Aquí puedes ver todos tus créditos anteriores.
                </CardDescription>
            </div>
            <Button asChild variant="outline" className="w-full sm:w-auto">
                <Link href="/dashboard/cliente">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Volver a Créditos Activos
                </Link>
            </Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center items-center h-40">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="ml-4 text-muted-foreground">Cargando tu historial...</p>
          </div>
        ) : credits.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fecha de Inicio</TableHead>
                <TableHead>Proveedor</TableHead>
                <TableHead>Valor Solicitado</TableHead>
                <TableHead>Estado Final</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {credits.map((credit) => (
                <TableRow key={credit.id}>
                  <TableCell>{format(new Date(credit.fecha), "d 'de' MMMM, yyyy", { locale: es })}</TableCell>
                  <TableCell>{credit.providerName}</TableCell>
                  <TableCell>{formatCurrency(credit.valor)}</TableCell>
                  <TableCell>
                    <Badge variant={credit.estado === 'Pagado' ? 'secondary' : 'outline'}>{credit.estado}</Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="text-center text-muted-foreground py-16">
            <ClipboardList className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-semibold">No tienes historial de créditos</h3>
            <p className="text-sm">Tus créditos pagados o renovados aparecerán aquí.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
