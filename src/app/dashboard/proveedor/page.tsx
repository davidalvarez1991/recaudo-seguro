
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UserPlus, Eye } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import Link from "next/link";
import { getCobradoresByProvider } from "@/lib/actions";
import { CobradorRegistrationModal } from "@/components/proveedor/cobrador-registration-modal";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";


export default async function ProveedorDashboard() {
  const cobradores = await getCobradoresByProvider();
  const cobradoresCount = cobradores.length;
  const canCreateCobrador = cobradoresCount < 5;

  const CreateButton = () => {
    if (canCreateCobrador) {
      return (
        <CobradorRegistrationModal>
          <Button className="w-full sm:w-auto">
            <UserPlus className="mr-2 h-4 w-4" />
            Crear Nuevo Cobrador
          </Button>
        </CobradorRegistrationModal>
      );
    }
    
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <span tabIndex={0} className="w-full sm:w-auto">
              <Button className="w-full sm:w-auto" disabled>
                <UserPlus className="mr-2 h-4 w-4" />
                Crear Nuevo Cobrador
              </Button>
            </span>
          </TooltipTrigger>
          <TooltipContent>
            <p>Has alcanzado el límite de 5 cobradores.</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  };


  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-3xl">Perfil de Proveedor</CardTitle>
        <CardDescription>Bienvenido a tu panel de proveedor.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-8">
        <div>
            <h3 className="text-lg font-medium">Resumen</h3>
            <p className="text-sm text-muted-foreground">
                Desde aquí puedes gestionar tus productos, servicios y visualizar tus recaudos.
            </p>
        </div>

        <Separator />
        
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-medium">Gestión de Cobradores ({cobradoresCount}/5)</h3>
            <p className="text-sm text-muted-foreground">Crea nuevas cuentas o visualiza tus cobradores existentes.</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <CreateButton />
            <Button asChild variant="outline" className="w-full sm:w-auto">
              <Link href="/dashboard/proveedor/cobradores">
                <Eye className="mr-2 h-4 w-4" />
                Ver Cobradores
              </Link>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
