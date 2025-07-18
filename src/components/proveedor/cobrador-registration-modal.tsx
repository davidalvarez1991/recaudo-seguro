
"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { CobradorRegistrationForm } from "@/components/auth/cobrador-registration-form";

export function CobradorRegistrationModal({ children }: { children: React.ReactNode }) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
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
  );
}
