

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UserPlus, Eye, TrendingUp, Landmark, Users, DollarSign, ShieldAlert, PiggyBank } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import Link from "next/link";
import { getCobradoresByProvider, getUserData, getProviderFinancialSummary, getAdminSettings } from "@/lib/actions";
import { CobradorRegistrationModal } from "@/components/proveedor/cobrador-registration-modal";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { DailySummaryContainer } from "@/components/proveedor/daily-summary-container";
import { ClientReputationSearch } from "@/components/dashboard/client-reputation-search";
import { getAuthenticatedUser } from "@/lib/auth";
import { RenewalCountdown } from "@/components/proveedor/renewal-countdown";

type UserData = {
    companyName?: string;
    idNumber?: string;
    isActive?: boolean;
    [key: string]: any;
} | null;

const formatCurrency = (value: number) => {
    if (isNaN(value)) return "$0";
    return `$${value.toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
};

const WhatsAppIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-message-circle"><path d="M12.02 2.01c-5.53 0-10.01 4.48-10.01 10.01 0 5.53 4.48 10.01 10.01 10.01 1.76 0 3.42-.46 4.88-1.28l4.11 1.28-1.28-4.11c.82-1.46 1.28-3.12 1.28-4.88.01-5.53-4.47-10.01-10-10.01Zm0 0"/></svg>
);

const InactiveProviderView = ({ companyName, idNumber }: { companyName?: string, idNumber?: string }) => {
    const activationMessage = encodeURIComponent(`Hola, por favor activa mi cuenta de proveedor. Nombre: ${companyName}, Cédula/NIT: ${idNumber}`);
    const whatsappLink = `https://wa.me/573052353554?text=${activationMessage}`;

    return (
        <Card className="border-destructive border-2 bg-destructive/5">
            <CardHeader className="text-center">
                <ShieldAlert className="w-16 h-16 mx-auto text-destructive mb-4" />
                <CardTitle className="text-2xl text-destructive">Cuenta Inactiva</CardTitle>
                <CardDescription className="text-destructive/90">
                    Comunícate con el administrador para que habilite tu cuenta y puedas acceder a todas las funciones.
                </CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center">
                <Button asChild className="bg-green-600 hover:bg-green-700 text-white">
                    <a href={whatsappLink} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2">
                        <WhatsAppIcon />
                        Contactar al Administrador
                    </a>
                </Button>
            </CardContent>
        </Card>
    );
};


export default async function ProveedorDashboard() {
  const { userId } = await getAuthenticatedUser();
  
  let companyName = "Perfil de Proveedor";
  let idNumber = "";
  let isActive = false;
  let financialSummary = { activeCapital: 0, collectedCommission: 0, uniqueClientCount: 0, myCapital: 0 };
  let adminSettings = { pricePerClient: 3500 };
  let subscriptionCost = 0;

  if (userId) {
    const userData: UserData = await getUserData(userId);
    if (userData) {
      if (userData.companyName) companyName = userData.companyName;
      if (userData.idNumber) idNumber = userData.idNumber;
      isActive = userData.isActive !== false;
    }
    
    if (isActive) {
      const [summary, settings] = await Promise.all([
        getProviderFinancialSummary(),
        getAdminSettings()
      ]);
      financialSummary = summary;
      adminSettings = settings;
      subscriptionCost = financialSummary.uniqueClientCount * adminSettings.pricePerClient;
    }
  }

  if (!isActive) {
      return <InactiveProviderView companyName={companyName} idNumber={idNumber} />;
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
              <div className="space-y-1">
                  <CardTitle className="text-3xl">{companyName.toUpperCase()}</CardTitle>
                  <CardDescription>Bienvenido a tu panel de gestión.</CardDescription>
              </div>
            </div>
        </CardHeader>
        <CardContent className="space-y-8">
          <RenewalCountdown />

          <Separator />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
             <Card className="bg-orange-50 dark:bg-orange-900/30 border-orange-200 md:col-span-2 lg:col-span-1">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-orange-800 dark:text-orange-200">Mi Capital Total</CardTitle>
                <PiggyBank className="h-5 w-5 text-orange-600 dark:text-orange-400" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-orange-900 dark:text-orange-300">{formatCurrency(financialSummary.myCapital)}</div>
              </CardContent>
            </Card>
          </div>

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
