
import { AuthCard } from "@/components/auth/auth-card";
import { RegistrationForm } from "@/components/auth/registration-form";
import Link from "next/link";
import { Suspense } from 'react';

function ProveedorRegisterPageContent() {
  return (
    <AuthCard
      title="Registro de Proveedor"
      description="Únete a nuestra red de proveedores."
    >
      <RegistrationForm role="proveedor" />
       <div className="mt-4 text-center text-sm">
        ¿Ya tienes una cuenta?{" "}
        <Link href="/login" className="font-semibold underline text-primary hover:text-primary/80">
          Inicia sesión
        </Link>
      </div>
    </AuthCard>
  );
}

export default function ProveedorRegisterPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <ProveedorRegisterPageContent />
        </Suspense>
    );
}
