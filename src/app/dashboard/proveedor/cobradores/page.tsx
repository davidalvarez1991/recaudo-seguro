"use client";

import { useState } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UserPlus } from "lucide-react";
import { CobradorRegistrationForm } from "@/components/auth/cobrador-registration-form";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export default function GestionCobradoresPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="grid gap-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-3xl">Gestión de Cobradores</CardTitle>
            <CardDescription>
              Crea y administra las cuentas para tus cobradores. Puedes registrar hasta 5.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-start gap-4 pt-6">
             <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
              <DialogTrigger asChild>
                <Button>
                  <UserPlus className="mr-2 h-4 w-4" />
                  Registrar Nuevo Cobrador
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
            
            {/* Future list of collectors will go here */}
            <div className="w-full p-4 border rounded-md mt-4">
                <p className="text-sm text-muted-foreground">Aquí se mostrará la lista de cobradores registrados.</p>
            </div>
          </CardContent>
        </Card>
    </div>
  );
}
