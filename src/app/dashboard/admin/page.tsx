

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, DollarSign, Users as UsersIcon, Megaphone } from "lucide-react";
import Link from "next/link";
import { Separator } from "@/components/ui/separator";
import { CollectionCountdown } from "@/components/admin/collection-countdown";
import { getAllProviders, getAdminSettings } from "@/lib/actions";

const formatCurrency = (value: number) => {
    if (isNaN(value)) return "$0";
    return `$${value.toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
};

export default async function AdminDashboard() {
  const [providersData, settingsData] = await Promise.all([
    getAllProviders(),
    getAdminSettings(),
  ]);

  const pricePerClient = settingsData?.pricePerClient || 3500;

  const totalProjectedIncome = providersData.reduce((sum, p) => sum + (p.uniqueClientCount * pricePerClient), 0);
  const totalClients = providersData.reduce((sum, p) => sum + p.uniqueClientCount, 0);
  const totalProviders = providersData.length;

  return (
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="space-y-1">
                <CardTitle className="text-3xl">Perfil de Administrador</CardTitle>
                <CardDescription>Bienvenido al panel de administración general.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                    <CardTitle className="text-sm font-medium text-blue-800 dark:text-blue-200">Total Proveedores</CardTitle>
                    <UsersIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    </CardHeader>
                    <CardContent>
                    <div className="text-3xl font-bold text-blue-900 dark:text-blue-300">{totalProviders}</div>
                    </CardContent>
                </Card>
                <Card className="bg-purple-50 dark:bg-purple-900/30 border-purple-200">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-purple-800 dark:text-purple-200">Total Clientes</CardTitle>
                    <UsersIcon className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                    </CardHeader>
                    <CardContent>
                    <div className="text-3xl font-bold text-purple-900 dark:text-purple-300">{totalClients}</div>
                    </CardContent>
                </Card>
            </div>
            
            <Separator />
            
            <div className="space-y-2">
                <h3 className="text-lg font-medium">Gestión de Proveedores</h3>
                <p className="text-sm text-muted-foreground">
                    Administra las cuentas, suscripciones y permisos de todos los proveedores en la plataforma.
                </p>
            </div>
             <Button asChild>
                <Link href="/dashboard/admin/proveedores">
                    <Users className="mr-2 h-4 w-4" />
                    Gestionar Proveedores
                </Link>
            </Button>
            
            <Separator />

            <div className="space-y-2">
                <h3 className="text-lg font-medium">Comunicados a Proveedores</h3>
                <p className="text-sm text-muted-foreground">
                   Envía notificaciones y anuncios importantes que serán visibles para todos tus proveedores.
                </p>
            </div>
             <Button asChild variant="outline">
                <Link href="/dashboard/admin/anuncios">
                    <Megaphone className="mr-2 h-4 w-4" />
                    Enviar Anuncio
                </Link>
            </Button>
            
            <Separator />
            
            <CollectionCountdown />
            
            <Separator />

             <div className="space-y-2">
                <h3 className="text-lg font-medium">Otras Acciones</h3>
                <p className="text-sm text-muted-foreground">
                    Accede a otras áreas de configuración y mantenimiento del sistema.
                </p>
            </div>
        </CardContent>
      </Card>
  );
}
