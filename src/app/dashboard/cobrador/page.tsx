
import { useState } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { UserPlus } from "lucide-react";
import { ClientRegistrationForm } from "@/components/forms/client-registration-form";
import { getUserData } from "@/lib/actions";
import { cookies } from "next/headers";
import { CobradorDashboardClient } from "@/components/dashboard/cobrador-dashboard-client";

type UserData = {
    name: string;
    [key: string]: any;
} | null;

export default async function CobradorDashboard() {
  const cookieStore = cookies();
  const userId = cookieStore.get('loggedInUser')?.value;
  
  let userName = "Cobrador";
  if (userId) {
    const userData: UserData = await getUserData(userId);
    if (userData && userData.name) {
      userName = userData.name;
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-3xl">Bienvenido, {userName}</CardTitle>
        <CardDescription>Este es tu panel de gestión de clientes.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-8">
        <div>
          <h3 className="text-lg font-medium">Gestión de Clientes</h3>
          <p className="text-sm text-muted-foreground">
            Desde aquí puedes registrar nuevos clientes y gestionar sus créditos.
          </p>
        </div>
        
        <CobradorDashboardClient />
        
      </CardContent>
    </Card>
  );
}
