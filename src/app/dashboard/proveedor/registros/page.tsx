
"use client";

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ClipboardList, Loader2 } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { useState, useEffect, useCallback } from "react";
import { getCreditsByProvider } from "@/lib/actions";

type Registro = {
  id: string;
  cobradorId: string;
  clienteId: string;
  tipo: string;
  valor: number;
  fecha: string;
  formattedDate?: string;
};

export default function RegistrosPage() {
  const [registros, setRegistros] = useState<Registro[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchAllData = useCallback(async () => {
    setIsLoading(true);
    const allActivityRecords = await getCreditsByProvider();

    const formattedRecords = allActivityRecords.map((credito: any) => ({
      id: credito.id,
      cobradorId: credito.cobradorId,
      clienteId: credito.clienteId,
      tipo: "Creación Crédito",
      valor: credito.valor,
      fecha: credito.fecha,
      formattedDate: new Date(credito.fecha).toLocaleDateString(),
    }));

    // Sort records by date (most recent first)
    formattedRecords.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
    
    setRegistros(formattedRecords);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchAllData();

    // Listen for updates to refresh data
    const handleUpdate = () => fetchAllData();
    window.addEventListener('creditos-updated', handleUpdate);
    window.addEventListener('cobradores-updated', handleUpdate); // For future activities

    return () => {
        window.removeEventListener('creditos-updated', handleUpdate);
        window.removeEventListener('cobradores-updated', handleUpdate);
    };
  }, [fetchAllData]);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
            <div className="space-y-1">
                <CardTitle className="text-3xl">Registro de Actividad</CardTitle>
                <CardDescription>
                Visualiza todas las acciones registradas por tus cobradores.
                </CardDescription>
            </div>
            <Button asChild variant="outline">
                <Link href="/dashboard/proveedor">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Volver al Panel
                </Link>
            </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        {isLoading ? (
             <div className="flex justify-center items-center py-10">
                <Loader2 className="mr-2 h-8 w-8 animate-spin text-primary" />
                <span className="text-muted-foreground">Cargando registros...</span>
            </div>
        ) : registros.length > 0 ? (
          <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>ID Cobrador</TableHead>
                  <TableHead>ID Cliente</TableHead>
                  <TableHead>Tipo de Registro</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {registros.map((registro) => (
                  <TableRow key={registro.id}>
                    <TableCell>{registro.formattedDate}</TableCell>
                    <TableCell>{registro.cobradorId}</TableCell>
                    <TableCell>{registro.clienteId}</TableCell>
                    <TableCell>
                      <Badge variant={'default'}>
                        {registro.tipo}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {registro.valor > 0 ? `$${registro.valor.toLocaleString('es-CO')}` : '-'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
        ) : (
            <div className="text-center text-muted-foreground py-8">
                <ClipboardList className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <h3 className="text-lg font-semibold">No hay actividad registrada</h3>
                <p className="text-sm">Cuando un cobrador cree un crédito, aparecerá aquí.</p>
            </div>
        )}
      </CardContent>
    </Card>
  );
}
