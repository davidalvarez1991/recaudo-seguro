
import { AuthCard } from "@/components/auth/auth-card";
import { RegistrationForm } from "@/components/auth/registration-form";
import Link from "next/link";
import { Suspense } from 'react';

function ClientRegisterPageContent() {
    return (
        <AuthCard
        title="Registro de Cliente"
        description="Crea tu cuenta para empezar a usar nuestros servicios."
        >
        <RegistrationForm role="cliente" />
        <div className="mt-4 text-center text-sm">
            ¿Ya tienes una cuenta?{" "}
            <Link href="/login" className="font-semibold underline text-primary hover:text-primary/80">
            Inicia sesión
            </Link>
        </div>
        </AuthCard>
    );
}

export default function ClientRegisterPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ClientRegisterPageContent />
    </Suspense>
  );
}
