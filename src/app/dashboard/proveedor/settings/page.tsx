
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { cookies } from "next/headers";
import { SettingsForm } from "@/components/forms/settings-form";

export default function SettingsPage() {
  const cookieStore = cookies();
  const providerId = cookieStore.get('loggedInUser')?.value || null;

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="space-y-1">
            <CardTitle className="text-3xl">Configuración</CardTitle>
            <CardDescription>
              Gestiona la configuración general de tu perfil de proveedor.
            </CardDescription>
          </div>
          <Button asChild variant="outline" className="w-full md:w-auto">
            <Link href="/dashboard/proveedor">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver al Panel
            </Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {providerId ? (
          <SettingsForm providerId={providerId} />
        ) : (
          <p className="text-destructive">No se pudo identificar al proveedor. Por favor, inicie sesión de nuevo.</p>
        )}
      </CardContent>
    </Card>
  );
}
