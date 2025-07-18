import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

export default function ProveedorDashboard() {
  return (
      <Card>
        <CardHeader>
          <CardTitle className="text-3xl">Perfil de Proveedor</CardTitle>
          <CardDescription>Bienvenido a tu panel de proveedor.</CardDescription>
        </CardHeader>
        <CardContent>
          <p>Gestiona tus productos, servicios y visualiza tus recaudos.</p>
        </CardContent>
      </Card>
  );
}
