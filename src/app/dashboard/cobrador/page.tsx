
"use client";

import { useState } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { UserPlus } from "lucide-react";
import { ClientRegistrationForm } from "@/components/forms/client-registration-form";

export default function CobradorDashboard() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-3xl">Perfil de Cobrador</CardTitle>
        <CardDescription>Bienvenido a tu panel de cobrador.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-8">
        <div>
          <h3 className="text-lg font-medium">Gestión de Clientes</h3>
          <p className="text-sm text-muted-foreground">
            Desde aquí puedes registrar nuevos clientes y gestionar sus créditos.
          </p>
        </div>
        
        <div className="flex">
          <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
            <DialogTrigger asChild>
              <Button>
                <UserPlus className="mr-2 h-4 w-4" />
                Registrar Nuevo Cliente
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[480px]">
              <DialogHeader>
                <DialogTitle>Registrar Nuevo Cliente y Crédito</DialogTitle>
                <DialogDescription>
                  Completa los datos para crear una nueva cuenta de cliente y su crédito asociado.
                </DialogDescription>
              </DialogHeader>
              <ClientRegistrationForm onFormSubmit={() => setIsModalOpen(false)} />
            </DialogContent>
          </Dialog>
        </div>
      </CardContent>
    </Card>
  );
}
