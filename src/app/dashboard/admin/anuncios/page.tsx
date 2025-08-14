
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Megaphone } from "lucide-react";
import Link from "next/link";
import { AnnouncementForm } from "@/components/forms/announcement-form";

export default function AnunciosPage() {
  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-1">
            <CardTitle className="text-3xl flex items-center gap-2">
                <Megaphone className="h-8 w-8 text-primary"/>
                Enviar Anuncio a Proveedores
            </CardTitle>
            <CardDescription>
              Escribe un mensaje que será visible para todos los proveedores en su panel principal.
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
      <CardContent className="pt-6">
        <AnnouncementForm />
      </CardContent>
    </Card>
  );
}
