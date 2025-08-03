
import { AuthCard } from "@/components/auth/auth-card";
import { LoginForm } from "@/components/auth/login-form";
import Link from "next/link";
import { Suspense } from "react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

const WhatsAppIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-message-circle"><path d="M12.02 2.01c-5.53 0-10.01 4.48-10.01 10.01 0 5.53 4.48 10.01 10.01 10.01 1.76 0 3.42-.46 4.88-1.28l4.11 1.28-1.28-4.11c.82-1.46 1.28-3.12 1.28-4.88.01-5.53-4.47-10.01-10-10.01Zm0 0"/></svg>
);


export default function LoginPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <main className="flex min-h-screen flex-col items-center justify-center p-4">
        <AuthCard
          title="Bienvenido de nuevo"
          description="Ingresa tus credenciales para acceder a tu cuenta."
        >
          <LoginForm />
          <Separator className="my-6" />
          <div className="space-y-4 text-center">
            <p className="text-sm text-muted-foreground">¿No tienes una cuenta de proveedor?</p>
            <Button asChild variant="outline" className="w-full">
              <Link href="/register/proveedor">
                Regístrate como Proveedor
              </Link>
            </Button>
            <Button asChild className="w-full bg-accent hover:bg-accent/90">
                 <a href="https://wa.me/573052353554" target="_blank" rel="noopener noreferrer" className="flex items-center justify-center">
                    <WhatsAppIcon />
                    Vinculación por WhatsApp
                </a>
            </Button>
            <p className="text-[11px] leading-relaxed text-muted-foreground mt-4 px-2">
                Recaudo Seguro es una herramienta de gestión de información. Su único propósito es ayudar a los usuarios a organizar datos de cobros, pagos y estados de cuenta en tiempo real. La aplicación <i>no participa en operaciones financieras</i>, no presta dinero ni se involucra en actividades de cobranza o transacciones.
            </p>
          </div>
        </AuthCard>
      </main>
    </Suspense>
  );
}
