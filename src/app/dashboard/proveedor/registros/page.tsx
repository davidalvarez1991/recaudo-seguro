
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

type Cobrador = {
    id: string;
    name: string;
    idNumber: string;
    status: string;
    providerId: string;
};

export default function RegistrosPage() {
  const [registros, setRegistros] = useState<Registro[]>([]);
  const [providerId, setProviderId] = useState<string | null>(null);

  useEffect(() => {
    const getCookie = (name: string): string | null => {
      const value = `; ${document.cookie}`;
      const parts = value.split(`; ${name}=`);
      if (parts.length === 2) return parts.pop()?.split(';').shift() || null;
      return null;
    };
    const currentProviderId = getCookie('loggedInUser');
    setProviderId(currentProviderId);

    const fetchAllData = () => {
        if (!currentProviderId) return;

        // 1. Get all cobradores for the current provider
        const cobradoresKey = `cobradores_${currentProviderId}`;
        const storedCobradoresRaw = localStorage.getItem(cobradoresKey);
        const providerCobradores: Cobrador[] = storedCobradoresRaw ? JSON.parse(storedCobradoresRaw) : [];
        const cobradorIds = providerCobradores.map(c => c.idNumber);

        // 2. Iterate through each cobrador to get their credits
        let allActivityRecords: Registro[] = [];
        cobradorIds.forEach(cobradorId => {
            const creditosKey = `creditos_${cobradorId}`;
            const storedCreditosRaw = localStorage.getItem(creditosKey);
            if (storedCreditosRaw) {
                const storedCreditos = JSON.parse(storedCreditosRaw);
                const records = storedCreditos.map((credito: any) => ({
                    id: `${credito.id}-${cobradorId}`, // Create a unique ID for the table row
                    cobradorId: cobradorId,
                    clienteId: credito.clienteId,
                    tipo: "Creación Crédito",
                    valor: credito.valor,
                    fecha: credito.fecha,
                    formattedDate: new Date(credito.fecha).toLocaleDateString(),
                }));
                allActivityRecords.push(...records);
            }
        });

        // 3. Sort records by date (most recent first)
        allActivityRecords.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
        
        setRegistros(allActivityRecords);
    };

    fetchAllData();

    // Listen for updates to refresh data
    const handleUpdate = () => fetchAllData();
    window.addEventListener('cobradores-updated', handleUpdate);
    window.addEventListener('creditos-updated', handleUpdate);

    return () => {
        window.removeEventListener('cobradores-updated', handleUpdate);
        window.removeEventListener('creditos-updated', handleUpdate);
    };
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
