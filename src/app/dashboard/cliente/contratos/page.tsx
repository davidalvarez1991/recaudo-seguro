import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { FileText, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function ContratosPage() {
  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="space-y-1">
                <CardTitle className="text-3xl flex items-center gap-2">
                    <FileText className="h-8 w-8 text-primary" />
                    Contratos y Documentos
                </CardTitle>
                <CardDescription>
                    Aquí podrás ver y descargar todos los documentos de tus créditos.
                </CardDescription>
            </div>
            <Button asChild variant="outline" className="w-full sm:w-auto">
                <Link href="/dashboard/cliente">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Volver a Mis Créditos
                </Link>
            </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-center text-muted-foreground py-16">
            <FileText className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-semibold">Función en desarrollo</h3>
            <p className="text-sm">Próximamente podrás visualizar todos tus contratos aquí.</p>
        </div>
      </CardContent>
    </Card>
  );
}
