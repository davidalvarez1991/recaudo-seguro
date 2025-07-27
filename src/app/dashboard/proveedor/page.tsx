
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UserPlus, Eye } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import Link from "next/link";
import { getCobradoresByProvider, getUserData, getDailyCollectionSummary } from "@/lib/actions";
import { CobradorRegistrationModal } from "@/components/proveedor/cobrador-registration-modal";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cookies } from "next/headers";
import { DailySummary } from "@/components/proveedor/daily-summary";

type UserData = {
    companyName?: string;
    [key: string]: any;
} | null;

export default async function ProveedorDashboard() {
  const cookieStore = cookies();
  const userId = cookieStore.get('loggedInUser')?.value;
  
  let companyName = "Perfil de Proveedor";
  if (userId) {
    const userData: UserData = await getUserData(userId);
    if (userData && userData.companyName) {
      companyName = userData.companyName;
    }
  }

  const cobradores = await getCobradoresByProvider();
  const cobradoresCount = cobradores.length;
  const canCreateCobrador = cobradoresCount < 30;

  const dailySummaryData = await getDailyCollectionSummary();

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
            <p>Has alcanzado el límite de 30 cobradores.</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  };


  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="space-y-1">
                <CardTitle className="text-3xl">{companyName}</CardTitle>
                <CardDescription>Bienvenido a tu panel de gestión.</CardDescription>
            </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-8">
        <div>
            <h3 className="text-lg font-medium">Resumen del Día</h3>
            <p className="text-sm text-muted-foreground">
                Visualiza el total recaudado hoy por tus cobradores en tiempo real.
            </p>
        </div>

        <DailySummary summary={dailySummaryData.summary} total={dailySummaryData.totalCollected} />

        <Separator />
        
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-medium">Gestión de Cobradores ({cobradoresCount}/30)</h3>
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
