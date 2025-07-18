
"use client";

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { useState, useEffect } from "react";

const initialRegistros = [
  { id: "1", cobradorId: "987654321", clienteId: "111222333", tipo: "Recaudo", valor: 50000, fecha: "2024-07-28" },
  { id: "2", cobradorId: "123123123", clienteId: "444555666", tipo: "Recaudo", valor: 75000, fecha: "2024-07-28" },
  { id: "3", cobradorId: "987654321", clienteId: "777888999", tipo: "Visita", valor: 0, fecha: "2024-07-27" },
  { id: "4", cobradorId: "456456456", clienteId: "333222111", tipo: "Recaudo", valor: 120000, fecha: "2024-07-26" },
];

export default function RegistrosPage() {
  const [registros, setRegistros] = useState(initialRegistros.map(r => ({ ...r, formattedDate: '' })));

  useEffect(() => {
    setRegistros(
      initialRegistros.map(r => ({
        ...r,
        formattedDate: new Date(r.fecha).toLocaleDateString(),
      }))
    );
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
                    <Badge variant={registro.tipo === 'Recaudo' ? 'default' : 'secondary'}>
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
      </CardContent>
    </Card>
  );
}
