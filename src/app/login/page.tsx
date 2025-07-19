
import { AuthCard } from "@/components/auth/auth-card";
import { LoginForm } from "@/components/auth/login-form";
import Link from "next/link";
import { Suspense } from "react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

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
          </div>
        </AuthCard>
      </main>
    </Suspense>
  );
}
