

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { CobradorDashboardClient } from "@/components/dashboard/cobrador-dashboard-client";
import { CreditSimulator } from "@/components/dashboard/credit-simulator";
import { getUserData, getPaymentRoute, getCobradorSelfDailySummary, getCreditsByCobrador } from "@/lib/actions";
import { Separator } from "@/components/ui/separator";
import { ClientReputationSearch } from "@/components/dashboard/client-reputation-search";
import { Target, TrendingUp, CheckCircle, Star, AlertTriangle, RefreshCw, Users, Building } from "lucide-react";
import { DailyStats } from "@/components/dashboard/daily-stats";
import { getAuthenticatedUser } from "@/lib/auth";

type CommissionTier = {
  minAmount: number;
  maxAmount: number;
  percentage: number;
  lateInterestRate?: number;
};

type UserData = {
    name: string;
    providerId?: string;
    [key: string]: any;
} | null;

type ProviderData = {
    commissionTiers?: CommissionTier[];
    isLateInterestActive?: boolean;
    companyName?: string;
    [key: string]: any;
} | null;

const formatCurrency = (value: number) => {
    if (isNaN(value)) return "$0";
    return `$${value.toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
};

export default async function CobradorDashboard() {
  const { userId } = await getAuthenticatedUser();
  
  let userName = "Cobrador";
  let companyName = "Empresa";
  let commissionTiers: CommissionTier[] = [{ minAmount: 0, maxAmount: 50000000, percentage: 20, lateInterestRate: 2 }]; // Default tier
  let isLateInterestActive = false;
  let dailyGoal = 0;
  let collectedToday = 0;
  let totalClients = 0;
  
  const dailySummary = await getCobradorSelfDailySummary();

  if (userId) {
    const userData: UserData = await getUserData(userId);
    if (userData) {
        userName = userData.name;
        if (userData.providerId) {
            const providerData: ProviderData = await getUserData(userData.providerId);
            if (providerData) {
                companyName = providerData.companyName || 'Empresa';
                if (providerData.commissionTiers && providerData.commissionTiers.length > 0) {
                    commissionTiers = providerData.commissionTiers;
                }
                isLateInterestActive = providerData.isLateInterestActive || false;
            }
        }
        
        const [paymentRouteData, creditsData] = await Promise.all([
          getPaymentRoute(),
          getCreditsByCobrador()
        ]);
        
        dailyGoal = paymentRouteData.dailyGoal;
        collectedToday = paymentRouteData.collectedToday;
        
        const clientIds = new Set(creditsData.map(c => c.clienteId));
        totalClients = clientIds.size;
    }
  }
  
  const serializableDailySummary = {
      successfulPayments: dailySummary.successfulPayments,
      renewedCredits: dailySummary.renewedCredits,
      missedPayments: dailySummary.missedPayments
  };

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row items-start justify-between gap-6">
              <div className="space-y-1 flex-1">
                  <CardTitle className="text-3xl">Bienvenido, {userName}</CardTitle>
                  <CardDescription className="flex items-center gap-2 pt-1">
                    <Building className="h-4 w-4 text-muted-foreground" />
                    {companyName}
                  </CardDescription>
              </div>
              <div className="w-full md:w-auto md:min-w-[280px] space-y-2">
                <Card className="bg-primary text-primary-foreground shadow-lg">
                    <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                        <Target className="h-10 w-10 text-primary-foreground/80"/>
                        <div>
                        <p className="text-sm font-medium text-primary-foreground/90">Meta del Día</p>
                        <p className="text-3xl font-bold">{formatCurrency(dailyGoal)}</p>
                        </div>
                    </div>
                    </CardContent>
                </Card>
                <Card className="bg-green-600 text-primary-foreground shadow-lg">
                    <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                        <TrendingUp className="h-10 w-10 text-primary-foreground/80"/>
                        <div>
                        <p className="text-sm font-medium text-primary-foreground/90">Recaudado Hoy</p>
                        <p className="text-3xl font-bold">{formatCurrency(collectedToday)}</p>
                        </div>
                    </div>
                    </CardContent>
                </Card>
                 <Card className="bg-purple-600 text-primary-foreground shadow-lg">
                    <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                        <Users className="h-10 w-10 text-primary-foreground/80"/>
                        <div>
                        <p className="text-sm font-medium text-primary-foreground/90">Total Clientes Asignados</p>
                        <p className="text-3xl font-bold">{totalClients}</p>
                        </div>
                    </div>
                    </CardContent>
                </Card>
              </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-8">
            <DailyStats initialData={serializableDailySummary} />

            <Separator />
            
            <ClientReputationSearch />

            <Separator />

            <div>
              <h3 className="text-lg font-medium">Gestión de Clientes</h3>
              <p className="text-sm text-muted-foreground">
                Desde aquí puedes registrar nuevos clientes y gestionar sus créditos.
              </p>
            </div>
            
            <CobradorDashboardClient />

            <Separator />
            
            <div>
              <h3 className="text-lg font-medium">Simulador de Créditos</h3>
              <p className="text-sm text-muted-foreground">
                Calcula rápidamente el valor de las cuotas y el total a pagar para un nuevo crédito.
              </p>
            </div>

            <CreditSimulator 
                commissionTiers={commissionTiers} 
                isLateInterestActive={isLateInterestActive}
            />
            
        </CardContent>
      </Card>
    </div>
  );
}
