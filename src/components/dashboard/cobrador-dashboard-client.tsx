
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { UserPlus } from "lucide-react";
import { ClientRegistrationForm } from "@/components/forms/client-registration-form";

export function CobradorDashboardClient() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
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
  );
}
