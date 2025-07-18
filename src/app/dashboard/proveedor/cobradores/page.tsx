import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, UserCircle } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { getCobradoresByProvider } from "@/lib/actions";

type Cobrador = {
  id: string;
  name: string;
  idNumber: string;
  role: string;
  providerId: string;
  createdAt: any;
};

export default async function GestionCobradoresPage() {
  const cobradores: Cobrador[] = await getCobradoresByProvider();

  return (
    <div className="flex flex-col gap-8">
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="space-y-1">
              <h1 className="text-3xl font-bold tracking-tight">Gestión de Cobradores</h1>
              <p className="text-muted-foreground">
              Visualiza y administra las cuentas de tus cobradores.
              </p>
          </div>
          <Button asChild variant="outline">
              <Link href="/dashboard/proveedor">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Volver al Panel
              </Link>
          </Button>
        </div>
      </div>
      
      {cobradores.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {cobradores.map((cobrador) => (
            <Card key={cobrador.id} className="flex flex-col">
              <CardHeader className="flex flex-row items-center gap-4">
                  <UserCircle className="w-12 h-12 text-muted-foreground" />
                  <div className="grid gap-1">
                      <CardTitle>{cobrador.name}</CardTitle>
                      <CardDescription>ID: {cobrador.idNumber}</CardDescription>
                  </div>
              </CardHeader>
              <CardContent>
                <div>
                  <span className="text-sm text-muted-foreground">Estado</span>
                  <Badge variant={'default'} className="ml-2">
                    Activo
                  </Badge>
                </div>
              </CardContent>
              {/* Footer can be added back if actions like delete are needed */}
              {/* <CardFooter className="pt-4 border-t mt-auto">
                 <p>Acciones</p>
              </CardFooter> */}
            </Card>
          ))}
        </div>
      ) : (
        <Card>
            <CardContent className="pt-6">
                <div className="text-center text-muted-foreground py-8">
                    <UserCircle className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                    <h3 className="text-lg font-semibold">No hay cobradores registrados</h3>
                    <p className="text-sm">Crea un nuevo cobrador desde tu panel de proveedor para empezar.</p>
                </div>
            </CardContent>
        </Card>
      )}
    </div>
  );
}
