
"use client";

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ClipboardList } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { useState, useEffect } from "react";

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

  useEffect(() => {
    const storedCreditosRaw = localStorage.getItem('creditos');
    let activityRecords: Registro[] = [];

    if (storedCreditosRaw) {
      const storedCreditos = JSON.parse(storedCreditosRaw);
      activityRecords = storedCreditos.map((credito: any) => ({
        id: credito.id,
        cobradorId: "Desconocido", // This would come from session in a real app
        clienteId: credito.clienteId,
        tipo: "Creación Crédito",
        valor: credito.valor,
        fecha: credito.fecha,
        formattedDate: new Date(credito.fecha).toLocaleDateString(),
      }));
    }

    setRegistros(activityRecords);
  }, []);

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
        {registros.length > 0 ? (
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
