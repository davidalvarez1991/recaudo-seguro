"use client";

import { useState } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { UserPlus } from "lucide-react";
import { CobradorRegistrationForm } from "@/components/auth/cobrador-registration-form";

export default function ProveedorDashboard() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="grid gap-8">
      <Card>
        <CardHeader>
          <CardTitle className="text-3xl">Perfil de Proveedor</CardTitle>
          <CardDescription>Bienvenido a tu panel de proveedor.</CardDescription>
        </CardHeader>
        <CardContent>
          <p>Gestiona tus productos, servicios y visualiza tus recaudos.</p>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Gestión de Cobradores</CardTitle>
            <CardDescription>Crea nuevas cuentas para tus cobradores.</CardDescription>
          </CardHeader>
          <CardContent>
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
              <DialogTrigger asChild>
                <Button className="w-full">
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
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
