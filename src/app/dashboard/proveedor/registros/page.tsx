
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ClipboardList } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { getCreditsByProvider } from "@/lib/actions";

type Registro = {
  id: string;
  cobradorId: string;
  cobradorName?: string;
  clienteId: string;
  clienteName?: string;
  tipo: string;
  valor: number;
  fecha: string;
  formattedDate?: string;
};

export default async function RegistrosPage() {
  const allActivityRecords: Registro[] = await getCreditsByProvider();

  const formattedRecords = allActivityRecords
    .map((credito) => ({
      ...credito,
      tipo: "Creación Crédito",
      formattedDate: new Date(credito.fecha).toLocaleDateString('es-CO', {
        year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
      }),
    }))
    .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="space-y-1">
                <CardTitle className="text-3xl">Registro de Actividad</CardTitle>
                <CardDescription>
                Visualiza todas las acciones registradas por tus cobradores.
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
      <CardContent className="pt-6">
        {formattedRecords.length > 0 ? (
          <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Cobrador</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Tipo de Registro</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {formattedRecords.map((registro) => (
                  <TableRow key={registro.id}>
                    <TableCell>{registro.formattedDate}</TableCell>
                    <TableCell>
                        <div className="font-medium">{registro.cobradorName || 'Nombre no disponible'}</div>
                        <div className="text-sm text-muted-foreground">ID: {registro.cobradorId}</div>
                    </TableCell>
                    <TableCell>
                        <div className="font-medium">{registro.clienteName || 'Nombre no disponible'}</div>
                        <div className="text-sm text-muted-foreground">CC: {registro.clienteId}</div>
                    </TableCell>
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
