
"use client";

import { useState } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { UserPlus } from "lucide-react";
import { CobradorRegistrationForm } from "@/components/auth/cobrador-registration-form";
import { Separator } from "@/components/ui/separator";

export default function ProveedorDashboard() {
  const [isModalOpen, setIsModalOpen] = useState(false);

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
            <h3 className="text-lg font-medium">Gestión de Cobradores</h3>
            <p className="text-sm text-muted-foreground">Crea nuevas cuentas para tus cobradores.</p>
          </div>
          <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
            <DialogTrigger asChild>
              <Button className="w-full sm:w-auto">
                <UserPlus className="mr-2 h-4 w-4" />
                Crear Nuevo Cobrador
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Registrar Nuevo Cobrador</DialogTitle>
                <DialogDescription>
                  Completa los datos para crear una nueva cuenta de cobrador.
                </DialogDescription>
              </DialogHeader>
              <CobradorRegistrationForm onFormSubmit={() => setIsModalOpen(false)} />
            </DialogContent>
          </Dialog>
        </div>
      </CardContent>
    </Card>
  );
}
