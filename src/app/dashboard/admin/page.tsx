import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

export default function AdminDashboard() {
  return (
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="space-y-1">
                <CardTitle className="text-3xl">Perfil de Administrador</CardTitle>
                <CardDescription>Bienvenido al panel de administración.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p>Aquí podrás gestionar usuarios, proveedores y cobradores.</p>
        </CardContent>
      </Card>
  );
}
