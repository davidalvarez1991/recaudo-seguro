
"use client";

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";


const cobradores = [
  { id: "1", name: "Carlos Ramirez", idNumber: "987654321", status: "Activo" },
  { id: "2", name: "Ana Torres", idNumber: "123123123", status: "Inactivo" },
  { id: "3", name: "Luis Guzman", idNumber: "456456456", status: "Activo" },
  { id: "4", name: "Sofia Castro", idNumber: "789456", status: "Activo" },
];

export default function GestionCobradoresPage() {

  return (
    <div className="grid gap-8">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
                <div className="space-y-1">
                    <CardTitle className="text-3xl">Gestión de Cobradores</CardTitle>
                    <CardDescription>
                    Visualiza y administra las cuentas de tus cobradores.
                    </CardDescription>
                </div>
                <Button asChild variant="outline">
                    <Link href="/dashboard/proveedor">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Volver
                    </Link>
                </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre del Cobrador</TableHead>
                    <TableHead>Número de Identificación</TableHead>
                    <TableHead>Estado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {cobradores.map((cobrador) => (
                    <TableRow key={cobrador.id}>
                      <TableCell>{cobrador.name}</TableCell>
                      <TableCell>{cobrador.idNumber}</TableCell>
                      <TableCell>{cobrador.status}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
          </CardContent>
        </Card>
    </div>
  );
}
