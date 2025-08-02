
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { AdminSettingsForm } from "@/components/forms/admin-settings-form";
import { getAuthenticatedUser } from "@/lib/auth";

export default async function SettingsPage() {
  const { userId } = await getAuthenticatedUser();

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-1">
            <CardTitle className="text-3xl">Configuración General</CardTitle>
            <CardDescription>
              Gestiona la configuración global de la aplicación.
            </CardDescription>
          </div>
          <Button asChild variant="outline" className="w-full sm:w-auto">
            <Link href="/dashboard/admin">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver al Panel
            </Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {userId ? (
          <AdminSettingsForm adminId={userId} />
        ) : (
          <p className="text-destructive">No se pudo identificar al administrador. Por favor, inicie sesión de nuevo.</p>
        )}
      </CardContent>
    </Card>
  );
}
