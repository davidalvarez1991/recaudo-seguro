import { AuthCard } from "@/components/auth/auth-card";
import { LoginForm } from "@/components/auth/login-form";
import Link from "next/link";
import { Suspense } from "react";

function LoginPageContent() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4">
      <AuthCard
        title="Bienvenido de nuevo"
        description="Ingresa tus credenciales para acceder a tu cuenta."
      >
        <LoginForm />
        <div className="mt-6 space-y-2 text-center text-sm">
          <p>¿Eres un cliente nuevo?{" "}
            <Link href="/register/client" className="font-semibold underline text-primary hover:text-primary/80">
               Regístrate aquí
            </Link>
          </p>
          <p>¿Quieres ser proveedor?{" "}
            <Link href="/register/proveedor" className="font-semibold underline text-primary hover:text-primary/80">
              Regístrate aquí
            </Link>
          </p>
        </div>
      </AuthCard>
    </main>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LoginPageContent />
    </Suspense>
  );
}
