
"use client";

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, UserCircle } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";

const cobradores = [
  { id: "1", name: "Carlos Ramirez", idNumber: "987654321", status: "Activo" },
  { id: "2", name: "Ana Torres", idNumber: "123123123", status: "Inactivo" },
  { id: "3", name: "Luis Guzman", idNumber: "456456456", status: "Activo" },
  { id: "4", name: "Sofia Castro", idNumber: "789456", status: "Activo" },
];

export default function GestionCobradoresPage() {

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
            <CardContent className="flex items-center justify-between mt-auto pt-4">
              <div>
                <span className="text-sm text-muted-foreground">Estado</span>
                <Badge variant={cobrador.status === 'Activo' ? 'default' : 'secondary'} className="ml-2">
                  {cobrador.status}
                </Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
