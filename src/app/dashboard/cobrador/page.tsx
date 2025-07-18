import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

export default function CobradorDashboard() {
  return (
      <Card>
        <CardHeader>
          <CardTitle className="text-3xl">Perfil de Cobrador</CardTitle>
          <CardDescription>Bienvenido a tu panel de cobrador.</CardDescription>
        </CardHeader>
        <CardContent>
          <p>Aquí puedes ver las rutas de cobro asignadas y registrar pagos.</p>
        </CardContent>
      </Card>
  );
}
