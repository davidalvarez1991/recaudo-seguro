
"use client";

import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ClipboardList, HandCoins, Loader2, Info } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { getCreditsByCobrador, registerPayment } from "@/lib/actions";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";


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
  paymentDates: string[];
  lateInterestRate?: number;
  paidInstallments: number;
  paidAmount: number;
  remainingBalance: number;
  lateFee: number;
  totalDebt: number;
};

type PaymentType = "cuota" | "total" | "interes";

const formatCurrency = (value: number) => {
    return `$${value.toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
};

export default function CreditosPage() {
  const [creditos, setCreditos] = useState<Credito[]>([]);
  const [selectedCredit, setSelectedCredit] = useState<Credito | null>(null);
  const [paymentType, setPaymentType] = useState<PaymentType>("cuota");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

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
    } catch (error) {
       toast({ title: "Error", description: "No se pudieron cargar los créditos.", variant: "destructive" });
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
    if (credito.estado === 'Pagado') {
        toast({ title: "Crédito Completado", description: "Este crédito ya ha sido pagado en su totalidad." });
        return;
    }
    setSelectedCredit(credito);
    setPaymentType("cuota"); // Reset to default when opening
    setIsModalOpen(true);
  };
  
  const handleRegisterPayment = async () => {
    if (!selectedCredit) return;
    
    setIsSubmitting(true);

    const installmentAmount = (selectedCredit.valor / selectedCredit.cuotas) + selectedCredit.lateFee;

    let amountToPay = 0;
    switch (paymentType) {
        case "cuota":
            amountToPay = installmentAmount;
            break;
        case "total":
            amountToPay = selectedCredit.totalDebt;
            break;
        case "interes":
            amountToPay = selectedCredit.lateFee;
            break;
    }

    const result = await registerPayment(selectedCredit.id, amountToPay, paymentType);

    if (result.success) {
        toast({
            title: "Pago Registrado",
            description: result.success,
            className: "bg-accent text-accent-foreground border-accent",
        });
        setIsModalOpen(false);
        fetchCredits(); // Refresh the list
    } else {
        toast({
            title: "Error al registrar el pago",
            description: result.error,
            variant: "destructive",
        });
    }
    setIsSubmitting(false);
  };

  const getPaymentAmount = () => {
    if (!selectedCredit) return 0;
     const installmentAmount = (selectedCredit.valor / selectedCredit.cuotas) + selectedCredit.lateFee;
    switch (paymentType) {
        case "cuota": return installmentAmount;
        case "total": return selectedCredit.totalDebt;
        case "interes": return selectedCredit.lateFee;
        default: return 0;
    }
  }

  return (
    <TooltipProvider>
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="space-y-1">
                  <CardTitle className="text-3xl">Listado de Créditos</CardTitle>
                  <CardDescription>
                  Haz clic en un crédito para registrar un pago de cuota.
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
                      <TableRow key={credito.id} onClick={() => handleRowClick(credito)} className={`cursor-pointer ${credito.estado === 'Pagado' ? 'opacity-50 hover:bg-transparent' : ''}`}>
                        <TableCell>{credito.formattedDate}</TableCell>
                        <TableCell>
                          <div className="font-medium">{credito.clienteName || 'Nombre no disponible'}</div>
                          <div className="text-sm text-muted-foreground">CC: {credito.clienteId}</div>
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(credito.valor)}
                        </TableCell>
                        <TableCell className="text-center">{credito.paidInstallments}/{credito.cuotas}</TableCell>
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
              Selecciona una opción y confirma el pago para el cliente <span className="font-semibold">{selectedCredit?.clienteName}</span>.
            </DialogDescription>
          </DialogHeader>
          {selectedCredit && (
            <div className="py-4 space-y-4">
                <RadioGroup value={paymentType} onValueChange={(value: any) => setPaymentType(value)} className="gap-4">
                    {/* Pagar Cuota */}
                    <Label htmlFor="payment-cuota" className="flex items-start gap-4 rounded-md border p-4 hover:bg-muted/50 transition-colors cursor-pointer">
                        <RadioGroupItem value="cuota" id="payment-cuota" className="mt-0.5" />
                        <div className="grid gap-1.5 w-full">
                            <div className="flex justify-between items-center">
                                <p className="font-semibold">Pagar Cuota</p>
                                <p className="font-bold text-lg">{formatCurrency((selectedCredit.valor / selectedCredit.cuotas) + selectedCredit.lateFee)}</p>
                            </div>
                            <p className="text-sm text-muted-foreground">
                                Incluye valor a capital ({formatCurrency(selectedCredit.valor / selectedCredit.cuotas)}) + intereses por mora ({formatCurrency(selectedCredit.lateFee)}).
                            </p>
                        </div>
                    </Label>

                    {/* Pagar Total */}
                    <Label htmlFor="payment-total" className="flex items-start gap-4 rounded-md border p-4 hover:bg-muted/50 transition-colors cursor-pointer">
                        <RadioGroupItem value="total" id="payment-total" className="mt-0.5" />
                        <div className="grid gap-1.5 w-full">
                            <div className="flex justify-between items-center">
                                <p className="font-semibold">Pagar Valor Total</p>
                                 <p className="font-bold text-lg">{formatCurrency(selectedCredit.totalDebt)}</p>
                            </div>
                            <p className="text-sm text-muted-foreground">
                                Liquida completamente el crédito. Incluye capital e intereses pendientes.
                            </p>
                        </div>
                    </Label>

                     {/* Abono Interes */}
                    <Label htmlFor="payment-interes" className={`flex items-start gap-4 rounded-md border p-4 transition-colors ${selectedCredit.lateFee > 0 ? 'cursor-pointer hover:bg-muted/50' : 'opacity-50 cursor-not-allowed'}`}>
                        <RadioGroupItem value="interes" id="payment-interes" disabled={selectedCredit.lateFee <= 0} className="mt-0.5" />
                        <div className="grid gap-1.5 w-full">
                           <div className="flex justify-between items-center">
                                <p className="font-semibold flex items-center gap-1">
                                    Abono a Intereses
                                    <Tooltip>
                                        <TooltipTrigger asChild><Info className="w-4 h-4 text-muted-foreground" /></TooltipTrigger>
                                        <TooltipContent><p>Este pago no reduce el capital de la deuda.</p></TooltipContent>
                                    </Tooltip>
                                </p>
                               <p className="font-bold text-lg">{formatCurrency(selectedCredit.lateFee)}</p>
                           </div>
                           <p className="text-sm text-muted-foreground">
                                Paga únicamente los intereses generados por mora.
                           </p>
                        </div>
                    </Label>
                </RadioGroup>
            </div>
          )}
          <DialogFooter>
             <Button variant="outline" onClick={() => setIsModalOpen(false)} disabled={isSubmitting}>Cancelar</Button>
            <Button onClick={handleRegisterPayment} disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <HandCoins className="mr-2 h-4 w-4" />}
              {isSubmitting ? 'Registrando...' : `Registrar Pago (${formatCurrency(getPaymentAmount())})`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </TooltipProvider>
  );
}
