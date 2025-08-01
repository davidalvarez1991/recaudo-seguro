
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UserPlus, Eye, TrendingUp, Landmark, Users, DollarSign } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import Link from "next/link";
import { getCobradoresByProvider, getUserData, getProviderFinancialSummary, getAdminSettings } from "@/lib/actions";
import { CobradorRegistrationModal } from "@/components/proveedor/cobrador-registration-modal";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cookies } from "next/headers";
import { DailySummaryContainer } from "@/components/proveedor/daily-summary-container";
import { ClientReputationSearch } from "@/components/dashboard/client-reputation-search";

type UserData = {
    companyName?: string;
    [key: string]: any;
} | null;

const formatCurrency = (value: number) => {
    if (isNaN(value)) return "$0";
    return `$${value.toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
};

export default async function ProveedorDashboard() {
  const cookieStore = cookies();
  const userId = cookieStore.get('loggedInUser')?.value;
  
  let companyName = "Perfil de Proveedor";
  let financialSummary = { activeCapital: 0, collectedCommission: 0, uniqueClientCount: 0 };
  let adminSettings = { pricePerClient: 3500 };
  let subscriptionCost = 0;

  if (userId) {
    const userData: UserData = await getUserData(userId);
    if (userData && userData.companyName) {
      companyName = userData.companyName;
    }
    const [summary, settings] = await Promise.all([
      getProviderFinancialSummary(),
      getAdminSettings()
    ]);
    financialSummary = summary;
    adminSettings = settings;
    subscriptionCost = financialSummary.uniqueClientCount * adminSettings.pricePerClient;
  }

  const cobradores = await getCobradoresByProvider();
  const cobradoresCount = cobradores.length;
  const canCreateCobrador = cobradoresCount < 30;

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
    <div className="space-y-8">
      <Card>
        <CardHeader>
           <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card className="bg-purple-50 dark:bg-purple-900/30 border-purple-200">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-sm font-medium text-purple-800 dark:text-purple-200">Clientes Únicos</CardTitle>
                      <Users className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-purple-900 dark:text-purple-300">{financialSummary.uniqueClientCount}</div>
                    </CardContent>
                  </Card>
                  <Card className="bg-teal-50 dark:bg-teal-900/30 border-teal-200">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-sm font-medium text-teal-800 dark:text-teal-200">Suscripción Mensual</CardTitle>
                      <DollarSign className="h-5 w-5 text-teal-600 dark:text-teal-400" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-teal-900 dark:text-teal-300">{formatCurrency(subscriptionCost)}</div>
                    </CardContent>
                  </Card>
                </div>
              <div className="space-y-1">
                  <CardTitle className="text-3xl">{companyName.toUpperCase()}</CardTitle>
                  <CardDescription>Bienvenido a tu panel de gestión.</CardDescription>
              </div>
            </div>
        </CardHeader>
        <CardContent className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="bg-blue-50 dark:bg-blue-900/30 border-blue-200">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-blue-800 dark:text-blue-200">Capital Activo en la Calle</CardTitle>
                  <Landmark className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-blue-900 dark:text-blue-300">{formatCurrency(financialSummary.activeCapital)}</div>
                </CardContent>
              </Card>
              <Card className="bg-green-50 dark:bg-green-900/30 border-green-200">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-green-800 dark:text-green-200">Ganancia Total Recaudada</CardTitle>
                  <TrendingUp className="h-5 w-5 text-green-600 dark:text-green-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-green-900 dark:text-green-300">{formatCurrency(financialSummary.collectedCommission)}</div>
                </CardContent>
              </Card>
            </div>
          
          <Separator />

          <ClientReputationSearch />

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

          <Separator />
          
          <DailySummaryContainer />
          
        </CardContent>
      </Card>
    </div>
  );
}
