
"use client";

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { useState, useEffect } from "react";

type Credito = {
  id: string;
  clienteId: string;
  valor: number;
  cuotas: number;
  fecha: string;
  estado: string;
  formattedDate?: string;
};

const initialCreditos: Credito[] = [
  { id: "1", clienteId: "111222333", valor: 500000, cuotas: 12, fecha: new Date().toISOString(), estado: "Activo" },
  { id: "2", clienteId: "444555666", valor: 1200000, cuotas: 24, fecha: new Date(Date.now() - 86400000).toISOString(), estado: "Activo" },
  { id: "3", clienteId: "777888999", valor: 800000, cuotas: 18, fecha: new Date(Date.now() - 2 * 86400000).toISOString(), estado: "Pagado" },
];

export default function CreditosPage() {
  const [creditos, setCreditos] = useState<Credito[]>([]);

  useEffect(() => {
    // This code runs only on the client
    const storedCreditosRaw = localStorage.getItem('creditos');
    let allCreditos: Credito[];

    if (storedCreditosRaw) {
      allCreditos = JSON.parse(storedCreditosRaw);
    } else {
      allCreditos = initialCreditos;
      localStorage.setItem('creditos', JSON.stringify(initialCreditos));
    }

    const formattedCreditos = allCreditos.map(c => ({
      ...c,
      formattedDate: new Date(c.fecha).toLocaleDateString(),
    }));
    
    setCreditos(formattedCreditos);
  }, []);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
            <div className="space-y-1">
                <CardTitle className="text-3xl">Listado de Créditos</CardTitle>
                <CardDescription>
                Visualiza todos los créditos que has registrado.
                </CardDescription>
            </div>
            <Button asChild variant="outline">
                <Link href="/dashboard/cobrador">
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
                <TableHead>ID Cliente</TableHead>
                <TableHead className="text-right">Valor del Crédito</TableHead>
                <TableHead className="text-center">Cuotas</TableHead>
                <TableHead>Estado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {creditos.map((credito) => (
                <TableRow key={credito.id}>
                  <TableCell>{credito.formattedDate}</TableCell>
                  <TableCell>{credito.clienteId}</TableCell>
                  <TableCell className="text-right">
                    {`$${credito.valor.toLocaleString('es-CO')}`}
                  </TableCell>
                   <TableCell className="text-center">{credito.cuotas}</TableCell>
                  <TableCell>
                    <Badge variant={credito.estado === 'Activo' ? 'default' : 'secondary'}>
                      {credito.estado}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
      </CardContent>
    </Card>
  );
}
