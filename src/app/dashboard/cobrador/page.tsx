
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { CobradorDashboardClient } from "@/components/dashboard/cobrador-dashboard-client";
import { CreditSimulator } from "@/components/dashboard/credit-simulator";
import { getUserData } from "@/lib/actions";
import { cookies } from "next/headers";
import { Separator } from "@/components/ui/separator";

type UserData = {
    name: string;
    providerId?: string;
    [key: string]: any;
} | null;

type ProviderData = {
    commissionPercentage?: number;
    [key: string]: any;
} | null;

export default async function CobradorDashboard() {
  const cookieStore = cookies();
  const userId = cookieStore.get('loggedInUser')?.value;
  
  let userName = "Cobrador";
  let commissionPercentage = 20; // Default value

  if (userId) {
    const userData: UserData = await getUserData(userId);
    if (userData) {
        userName = userData.name;
        if (userData.providerId) {
            const providerData: ProviderData = await getUserData(userData.providerId);
            if (providerData && providerData.commissionPercentage) {
                commissionPercentage = providerData.commissionPercentage;
            }
        }
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="space-y-1">
                <CardTitle className="text-3xl">Bienvenido, {userName}</CardTitle>
                <CardDescription>Este es tu panel de gestión de clientes y créditos.</CardDescription>
            </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-8">
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

        <CreditSimulator commissionPercentage={commissionPercentage} />
        
      </CardContent>
    </Card>
  );
}
