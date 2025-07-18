"use client";

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const cobradores = [
  { id: "1", idNumber: "987654321", status: "Activo" },
  { id: "2", idNumber: "123123123", status: "Inactivo" },
  { id: "3", idNumber: "456456456", status: "Activo" },
];

export default function GestionCobradoresPage() {

  return (
    <div className="grid gap-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-3xl">Gestión de Cobradores</CardTitle>
            <CardDescription>
              Visualiza y administra las cuentas de tus cobradores.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <Card>
              <TableHeader>
                <TableRow>
                  <TableHead>#</TableHead>
                  <TableHead>Número de Identificación</TableHead>
                  <TableHead>Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cobradores.map((cobrador, index) => (
                  <TableRow key={cobrador.id}>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell>{cobrador.idNumber}</TableCell>
                    <TableCell>{cobrador.status}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Card>
          </CardContent>
        </Card>
    </div>
  );
}
