
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ClipboardList } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { getCreditsByCobrador } from "@/lib/actions";

type Credito = {
  id: string;
  clienteId: string;
  valor: number;
  cuotas: number;
  fecha: string;
  estado: string;
  cobradorId: string;
};

export default async function CreditosPage() {
  const creditos: Credito[] = await getCreditsByCobrador();

  const formattedCreditos = creditos.map((c) => ({
    ...c,
    formattedDate: new Date(c.fecha).toLocaleDateString('es-CO', {
        year: 'numeric', month: 'long', day: 'numeric'
    }),
  }));

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
        {formattedCreditos.length > 0 ? (
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
                  {formattedCreditos.map((credito) => (
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
        ) : (
          <div className="text-center text-muted-foreground py-8">
              <ClipboardList className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-semibold">No hay créditos registrados</h3>
              <p className="text-sm">Cuando crees tu primer crédito, aparecerá aquí.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
