import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users } from "lucide-react";
import Link from "next/link";
import { Separator } from "@/components/ui/separator";
import { CollectionCountdown } from "@/components/admin/collection-countdown";

export default function AdminDashboard() {
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
