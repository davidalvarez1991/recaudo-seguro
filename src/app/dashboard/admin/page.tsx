import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

export default function AdminDashboard() {
  return (
      <Card>
        <CardHeader>
          <CardTitle className="text-3xl">Perfil de Administrador</CardTitle>
          <CardDescription>Bienvenido al panel de administración.</CardDescription>
        </CardHeader>
        <CardContent>
          <p>Aquí podrás gestionar usuarios, proveedores y cobradores.</p>
        </CardContent>
      </Card>
  );
}
