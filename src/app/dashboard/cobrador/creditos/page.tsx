
"use client";

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { useState, useEffect, useCallback } from "react";
import { getCreditsByCobrador } from "@/lib/actions";

type Credito = {
  id: string;
  clienteId: string;
  valor: number;
  cuotas: number;
  fecha: string;
  estado: string;
  formattedDate?: string;
  cobradorId: string;
};

export default function CreditosPage() {
  const [creditos, setCreditos] = useState<Credito[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [cobradorId, setCobradorId] = useState<string | null>(null);

  const fetchCreditos = useCallback(async (id: string) => {
    setIsLoading(true);
    const fetchedCreditos = await getCreditsByCobrador(id);
    const formattedCreditos = fetchedCreditos.map((c: Credito) => ({
      ...c,
      formattedDate: new Date(c.fecha).toLocaleDateString(),
    }));
    setCreditos(formattedCreditos);
    setIsLoading(false);
  }, []);

  useEffect(() => {
     const getCookie = (name: string): string | null => {
      const value = `; ${document.cookie}`;
      const parts = value.split(`; ${name}=`);
      if (parts.length === 2) return parts.pop()?.split(';').shift() || null;
      return null;
    };
    const currentCobradorId = getCookie('loggedInUser');
    setCobradorId(currentCobradorId);

    if (currentCobradorId) {
        fetchCreditos(currentCobradorId);
    } else {
        setIsLoading(false);
    }

    const handleCreditosUpdate = () => {
        if (currentCobradorId) fetchCreditos(currentCobradorId);
    }
    window.addEventListener('creditos-updated', handleCreditosUpdate);

    return () => {
        window.removeEventListener('creditos-updated', handleCreditosUpdate);
    };
  }, [fetchCreditos]);

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
        {isLoading ? (
            <div className="flex justify-center items-center py-10">
                <Loader2 className="mr-2 h-8 w-8 animate-spin text-primary" />
                <span className="text-muted-foreground">Cargando créditos...</span>
            </div>
        ) : (
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
                  {creditos.length > 0 ? (
                    creditos.map((credito) => (
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
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground">
                        No hay créditos registrados todavía.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
        )}
      </CardContent>
    </Card>
  );
}

    