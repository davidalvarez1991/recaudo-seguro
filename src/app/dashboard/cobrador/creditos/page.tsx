
"use client";

import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ClipboardList, HandCoins } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { getCreditsByCobrador } from "@/lib/actions";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";

type Credito = {
  id: string;
  clienteId: string;
  clienteName?: string;
  valor: number;
  cuotas: number;
  fecha: string;
  estado: string;
  cobradorId: string;
  formattedDate?: string;
};

export default function CreditosPage() {
  const [creditos, setCreditos] = useState<Credito[]>([]);
  const [selectedCredit, setSelectedCredit] = useState<Credito | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchCredits = async () => {
    setLoading(true);
    try {
        const creditsData: Credito[] = await getCreditsByCobrador();
        const formattedCreditos = creditsData.map((c) => ({
            ...c,
            formattedDate: new Date(c.fecha).toLocaleDateString('es-CO', {
                year: 'numeric', month: 'long', day: 'numeric'
            }),
        }));
        setCreditos(formattedCreditos);
    } finally {
        setLoading(false);
    }
  }

  useEffect(() => {
    fetchCredits();
    
    const handleCreditsUpdate = () => fetchCredits();
    window.addEventListener('creditos-updated', handleCreditsUpdate);
    return () => {
      window.removeEventListener('creditos-updated', handleCreditsUpdate);
    }

  }, []);

  const handleRowClick = (credito: Credito) => {
    setSelectedCredit(credito);
    setIsModalOpen(true);
  };
  
  const handleRegisterPayment = () => {
    setIsModalOpen(false);
  };

  const installmentAmount = selectedCredit ? selectedCredit.valor / selectedCredit.cuotas : 0;

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="space-y-1">
                  <CardTitle className="text-3xl">Listado de Créditos</CardTitle>
                  <CardDescription>
                  Visualiza todos los créditos que has registrado.
                  </CardDescription>
              </div>
              <Button asChild variant="outline" className="w-full sm:w-auto">
                  <Link href="/dashboard/cobrador">
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      Volver al Panel
                  </Link>
              </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          {loading ? (
             <p>Cargando créditos...</p>
          ) : creditos.length > 0 ? (
              <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Cliente</TableHead>
                      <TableHead className="text-right">Valor del Crédito</TableHead>
                      <TableHead className="text-center">Cuotas</TableHead>
                      <TableHead>Estado</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {creditos.map((credito) => (
                      <TableRow key={credito.id} onClick={() => handleRowClick(credito)} className="cursor-pointer">
                        <TableCell>{credito.formattedDate}</TableCell>
                        <TableCell>
                          <div className="font-medium">{credito.clienteName || 'Nombre no disponible'}</div>
                          <div className="text-sm text-muted-foreground">CC: {credito.clienteId}</div>
                        </TableCell>
                        <TableCell className="text-right">
                          {`$${credito.valor.toLocaleString('es-CO')}`}
                        </TableCell>
                        <TableCell className="text-center">{credito.cuotas}</TableCell>
                        <TableCell>
                          <Badge variant={credito.estado === 'Activo' ? 'default' : 'secondary'}>
                            {credito.estado}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
          ) : (
            <div className="text-center text-muted-foreground py-8">
                <ClipboardList className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <h3 className="text-lg font-semibold">No hay créditos registrados</h3>
                <p className="text-sm">Cuando crees tu primer crédito, aparecerá aquí.</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Registrar Pago</DialogTitle>
            <DialogDescription>
              Confirma el pago de la cuota para el cliente <span className="font-semibold">{selectedCredit?.clienteName}</span>.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
             <p>Valor de la cuota: <span className="font-bold text-lg">{`$${installmentAmount.toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`}</span></p>
          </div>
          <DialogFooter>
             <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
            <Button onClick={handleRegisterPayment}>
              <HandCoins className="mr-2 h-4 w-4" />
              Registrar Pago ({`$${installmentAmount.toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`})
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
