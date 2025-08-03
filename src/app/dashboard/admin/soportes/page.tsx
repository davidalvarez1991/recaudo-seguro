
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, Users, DollarSign } from "lucide-react";
import Link from "next/link";
import { getAllProviders, getAdminSettings } from "@/lib/actions";

const formatCurrency = (value: number) => {
    if (isNaN(value)) return "$0";
    return `$${value.toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
};

type ProviderData = {
  id: string;
  companyName: string;
  uniqueClientCount: number;
};

export default async function SoportesIngresosPage() {
    const [providers, settings] = await Promise.all([
        getAllProviders(),
        getAdminSettings()
    ]);
    
    const pricePerClient = settings.pricePerClient || 3500;
    const totalProjectedIncome = providers.reduce((sum, p) => sum + (p.uniqueClientCount * pricePerClient), 0);
    const totalClients = providers.reduce((sum, p) => sum + p.uniqueClientCount, 0);

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
            <Button asChild variant="outline" className="w-full sm:w-auto">
                <Link href="/dashboard/admin">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Volver al Panel
                </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
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
                      <CardTitle className="text-sm font-medium text-blue-800 dark:text-blue-200">Total Clientes en Plataforma</CardTitle>
                      <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-blue-900 dark:text-blue-300">{totalClients}</div>
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
                    {providers.map((provider) => (
                        <TableRow key={provider.id}>
                            <TableCell className="font-medium">{provider.companyName}</TableCell>
                            <TableCell className="text-center">{provider.uniqueClientCount}</TableCell>
                            <TableCell className="text-right font-bold text-primary">{formatCurrency(provider.uniqueClientCount * pricePerClient)}</TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </CardContent>
      </Card>
  );
}
