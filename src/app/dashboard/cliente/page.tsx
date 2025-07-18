import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

export default function ClienteDashboard() {
  return (
      <Card>
        <CardHeader>
          <CardTitle className="text-3xl">Perfil de Cliente</CardTitle>
          <CardDescription>Bienvenido a tu portal de cliente.</CardDescription>
        </CardHeader>
        <CardContent>
          <p>Consulta tu historial de pagos, facturas pendientes y realiza pagos en línea.</p>
        </CardContent>
      </Card>
  );
}
