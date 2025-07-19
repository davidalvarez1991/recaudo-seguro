import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

export default function ClienteDashboard() {
  return (
      <Card>
        <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="space-y-1">
                    <CardTitle className="text-3xl">Perfil de Cliente</CardTitle>
                    <CardDescription>Bienvenido a tu portal de cliente.</CardDescription>
                </div>
            </div>
        </CardHeader>
        <CardContent>
          <p>Consulta tu historial de pagos, facturas pendientes y realiza pagos en línea.</p>
        </CardContent>
      </Card>
  );
}
