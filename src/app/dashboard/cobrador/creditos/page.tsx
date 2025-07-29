
"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ClipboardList, HandCoins, Loader2, Info, RefreshCcw, XCircle, CalendarDays, CheckCircle2, Circle, Star, Search, Handshake } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { getCreditsByCobrador, registerPayment, registerMissedPayment, registerPaymentAgreement } from "@/lib/actions";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { RenewCreditForm } from "@/components/forms/renew-credit-form";
import { format, isBefore, startOfToday } from 'date-fns';
import { es } from 'date-fns/locale';
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";


type Credito = {
  id: string;
  clienteId: string;
  clienteName?: string;
  valor: number;
  commission: number;
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
  missedPaymentDays: number;
};

type PaymentType = "cuota" | "total" | "acuerdo";

const formatCurrency = (value: number) => {
    if (isNaN(value)) return "$0";
    return `$${value.toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
};

const formatCurrencyForInput = (value: string): string => {
    if (!value) return "";
    const numberValue = parseInt(value.replace(/\D/g, ''), 10);
    if (isNaN(numberValue)) return "";
    return new Intl.NumberFormat('es-CO').format(numberValue);
};

export default function CreditosPage() {
  const [creditos, setCreditos] = useState<Credito[]>([]);
  const [selectedCredit, setSelectedCredit] = useState<Credito | null>(null);
  const [paymentType, setPaymentType] = useState<PaymentType>("cuota");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isRenewModalOpen, setIsRenewModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [agreementAmount, setAgreementAmount] = useState("");
  const { toast } = useToast();

  const fetchCredits = useCallback(async () => {
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
  }, [toast]);

  useEffect(() => {
    fetchCredits();
    
    const handleCreditsUpdate = () => fetchCredits();
    window.addEventListener('creditos-updated', handleCreditsUpdate);
    return () => {
      window.removeEventListener('creditos-updated', handleCreditsUpdate);
    }

  }, [fetchCredits]);

  const handleRowClick = (credito: Credito) => {
    if (credito.estado === 'Renovado' || credito.estado === 'Pagado') {
        toast({ title: `Crédito ${credito.estado}`, description: "Este crédito ya no está activo y no se pueden registrar pagos." });
        return;
    }
    
    setSelectedCredit(credito);
    setPaymentType("cuota");
    setAgreementAmount("");
    setIsModalOpen(true);
  };
  
  const handleConfirmAction = async () => {
    if (!selectedCredit) return;

    if (paymentType === 'acuerdo') {
      await handlePaymentAgreement();
    } else {
      await handleRegisterPayment();
    }
  };

  const handleRegisterPayment = async () => {
    if (!selectedCredit || paymentType === 'acuerdo') return;
    
    setIsSubmitting(true);
    
    const totalLoanAmount = selectedCredit.valor + selectedCredit.commission;
    const installmentAmount = totalLoanAmount / selectedCredit.cuotas;

    let amountToPay = 0;
    switch (paymentType) {
        case "cuota":
            amountToPay = installmentAmount + selectedCredit.lateFee;
            break;
        case "total":
            amountToPay = selectedCredit.totalDebt;
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
  
  const handlePaymentAgreement = async () => {
    if (!selectedCredit) return;
    setIsSubmitting(true);

    const amount = agreementAmount ? parseFloat(agreementAmount.replace(/\D/g, '')) : 0;
    const result = await registerPaymentAgreement(selectedCredit.id, amount);

    if (result.success) {
        toast({
            title: "Acuerdo Registrado",
            description: result.success,
            className: "bg-accent text-accent-foreground border-accent",
        });
        setIsModalOpen(false);
        fetchCredits();
    } else {
        toast({
            title: "Error en el Acuerdo",
            description: result.error,
            variant: "destructive",
        });
    }
    setIsSubmitting(false);
  };


  const handleMissedPayment = async () => {
    if (!selectedCredit) return;
    setIsSubmitting(true);
    const result = await registerMissedPayment(selectedCredit.id);
    if (result.success) {
      toast({
        title: "Día de Mora Registrado",
        description: "Se ha registrado un día de mora para este crédito.",
        className: "bg-accent text-accent-foreground border-accent",
      });
      setIsModalOpen(false);
      fetchCredits(); // Refresh list
    } else {
      toast({
        title: "Error",
        description: result.error,
        variant: "destructive",
      });
    }
    setIsSubmitting(false);
  };

  const getPaymentAmount = () => {
    if (!selectedCredit) return 0;
    
    if (paymentType === 'acuerdo') {
        return agreementAmount ? parseFloat(agreementAmount.replace(/\D/g, '')) : 0;
    }

    const totalLoanAmount = selectedCredit.valor + selectedCredit.commission;
    const installmentAmount = totalLoanAmount / selectedCredit.cuotas;
    switch (paymentType) {
        case "cuota": return installmentAmount + selectedCredit.lateFee;
        case "total": return selectedCredit.totalDebt;
        default: return 0;
    }
  }
  
  const canRenewCredit = (credit: Credito | null) => {
    if (!credit) return false;
    if (credit.estado !== 'Activo') return false;
    const totalLoanAmount = credit.valor + credit.commission;
    return credit.paidAmount >= totalLoanAmount / 2;
  }

  const handleRenewClick = () => {
    setIsModalOpen(false);
    setIsRenewModalOpen(true);
  };

  const hasInterestOption = (selectedCredit?.lateInterestRate ?? 0) > 0;
  
  const getInstallmentBreakdown = () => {
    if (!selectedCredit) return { capital: 0, commission: 0 };
    const capitalPerInstallment = selectedCredit.valor / selectedCredit.cuotas;
    const commissionPerInstallment = selectedCredit.commission / selectedCredit.cuotas;
    return { capital: capitalPerInstallment, commission: commissionPerInstallment };
  }

  const filteredCreditos = creditos.filter(credito =>
    (credito.clienteName?.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (credito.clienteId?.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <TooltipProvider>
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="space-y-1">
                  <CardTitle className="text-3xl">Listado de Créditos</CardTitle>
                  <CardDescription>
                  Haz clic en un crédito para registrar un pago o renovar.
                  </CardDescription>
              </div>
              <Button asChild variant="outline" className="w-full sm:w-auto">
                  <Link href="/dashboard/cobrador">
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      Volver al Panel
                  </Link>
              </Button>
          </div>
           <div className="mt-4 relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                type="search"
                placeholder="Buscar por nombre o cédula de cliente..."
                className="w-full pl-8 sm:w-[300px]"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
        </CardHeader>
        <CardContent className="pt-6">
          {loading ? (
             <p>Cargando créditos...</p>
          ) : filteredCreditos.length > 0 ? (
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
                    {filteredCreditos.map((credito) => (
                      <TableRow key={credito.id} onClick={() => handleRowClick(credito)} className={`cursor-pointer ${credito.estado !== 'Activo' ? 'opacity-50 hover:bg-transparent' : ''}`}>
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
                           <Badge variant={credito.estado === 'Activo' ? 'default' : credito.estado === 'Pagado' ? 'secondary' : 'outline'}>
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
                <h3 className="text-lg font-semibold">{searchTerm ? 'No se encontraron clientes' : 'No hay créditos registrados'}</h3>
                <p className="text-sm">{searchTerm ? 'Intenta con otro nombre o cédula.' : 'Cuando crees tu primer crédito, aparecerá aquí.'}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Payment Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Registrar Pago</DialogTitle>
            <DialogDescription>
              Selecciona una opción y confirma la acción para el cliente <span className="font-semibold">{selectedCredit?.clienteName}</span>.
            </DialogDescription>
          </DialogHeader>
          {selectedCredit && (
            <div className="py-4 space-y-4">
               {selectedCredit.paymentDates && selectedCredit.paymentDates.length > 0 && (
                    <div className="space-y-3">
                        <div className="flex items-center gap-2">
                           <CalendarDays className="h-5 w-5 text-muted-foreground" />
                           <h4 className="font-medium text-sm">Calendario de Pagos</h4>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-2 text-sm pl-2 max-h-24 overflow-y-auto">
                            {selectedCredit.paymentDates
                                .sort((a,b) => new Date(a).getTime() - new Date(b).getTime())
                                .map((dateStr, index) => {
                                const isPaid = index < selectedCredit.paidInstallments;
                                const isNext = index === selectedCredit.paidInstallments;
                                return (
                                <div key={index} className={cn("flex items-center gap-2", { "text-muted-foreground": isPaid, "font-bold text-primary": isNext })}>
                                    {isPaid ? <CheckCircle2 className="h-4 w-4 text-green-500"/> : <Circle className="h-4 w-4 text-muted-foreground/50"/>}
                                    <span>{format(new Date(dateStr), "d 'de' MMMM", { locale: es })}</span>
                                </div>
                                );
                            })}
                        </div>
                        <Separator className="mt-4" />
                    </div>
                )}
                <RadioGroup value={paymentType} onValueChange={(value: any) => setPaymentType(value)} className="gap-4">
                    {/* Pagar Cuota */}
                    <Label htmlFor="payment-cuota" className="flex flex-col gap-2 rounded-md border p-4 hover:bg-muted/50 transition-colors cursor-pointer">
                        <div className="flex justify-between items-start w-full">
                           <div className="flex items-center gap-4">
                               <RadioGroupItem value="cuota" id="payment-cuota" className="mt-1" />
                               <div>
                                   <p className="font-semibold">Pagar Cuota</p>
                                   <div className="text-xs text-muted-foreground flex flex-wrap gap-x-4">
                                       <span>Capital: {formatCurrency(getInstallmentBreakdown().capital)}</span>
                                       <span>Comisión: {formatCurrency(getInstallmentBreakdown().commission)}</span>
                                       <span>Mora: {formatCurrency(selectedCredit.lateFee)}</span>
                                   </div>
                               </div>
                           </div>
                           <p className="font-bold text-lg">{formatCurrency(((selectedCredit.valor + selectedCredit.commission) / selectedCredit.cuotas) + selectedCredit.lateFee)}</p>
                        </div>
                    </Label>

                    {/* Pagar Total */}
                    <Label htmlFor="payment-total" className="flex items-start gap-4 rounded-md border p-4 hover:bg-muted/50 transition-colors cursor-pointer">
                        <RadioGroupItem value="total" id="payment-total" className="mt-1" />
                        <div className="flex justify-between items-center w-full">
                            <div>
                                <p className="font-semibold">Pagar Valor Total</p>
                            </div>
                            <p className="font-bold text-lg">{formatCurrency(selectedCredit.totalDebt)}</p>
                        </div>
                    </Label>

                     {/* Acuerdo de Cuota */}
                    <Label htmlFor="payment-acuerdo" className={`flex flex-col gap-2 rounded-md border p-4 transition-colors cursor-pointer hover:bg-muted/50`}>
                        <div className="flex items-start gap-4 w-full">
                            <RadioGroupItem value="acuerdo" id="payment-acuerdo" className="mt-1" />
                            <div className="flex justify-between items-center w-full">
                               <div>
                                    <p className="font-semibold flex items-center gap-1">
                                        <Handshake className="w-4 h-4 text-muted-foreground" />
                                        Acuerdo de Cuota
                                    </p>
                                    <p className="text-xs text-muted-foreground">Registra un pago parcial y reprograma la deuda.</p>
                               </div>
                               <p className="font-bold text-lg">{agreementAmount ? formatCurrency(parseFloat(agreementAmount.replace(/\D/g, ''))) : '$0'}</p>
                            </div>
                        </div>
                         {paymentType === 'acuerdo' && (
                             <div className="pl-8 pt-2">
                                <Input 
                                    placeholder="Digita el valor del acuerdo..."
                                    value={agreementAmount}
                                    onChange={(e) => setAgreementAmount(formatCurrencyForInput(e.target.value))}
                                />
                             </div>
                         )}
                    </Label>
                </RadioGroup>
            </div>
          )}
          <DialogFooter className="flex-col sm:flex-row sm:justify-between gap-2">
             <Button variant="outline" onClick={() => setIsModalOpen(false)} disabled={isSubmitting}>Cancelar</Button>
            <div className="flex flex-col-reverse sm:flex-row gap-2">
                <Button
                    variant="destructive"
                    onClick={handleMissedPayment}
                    disabled={isSubmitting || !hasInterestOption}
                  >
                  <XCircle className="mr-2 h-4 w-4" />
                  Hoy no pagó
                </Button>
                <Button onClick={handleConfirmAction} disabled={isSubmitting}>
                  {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : (paymentType === 'acuerdo' ? <Handshake className="mr-2 h-4 w-4" /> : <HandCoins className="mr-2 h-4 w-4" />)}
                  {isSubmitting ? 'Registrando...' : (paymentType === 'acuerdo' ? 'Confirmar Acuerdo' : formatCurrency(getPaymentAmount()))}
                </Button>
                 <Button onClick={handleRenewClick} variant="secondary" className="bg-amber-400 hover:bg-amber-500 text-amber-900" disabled={isSubmitting || !canRenewCredit(selectedCredit)}>
                    <Star className="mr-2 h-4 w-4" />
                    Renovar Crédito
                 </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Renew Credit Modal */}
       <Dialog open={isRenewModalOpen} onOpenChange={setIsRenewModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Renovar Crédito</DialogTitle>
              <DialogDescription>
                Crear un nuevo crédito para el cliente <span className="font-semibold">{selectedCredit?.clienteName}</span>. El saldo pendiente del crédito actual se refinanciará en el nuevo préstamo.
              </DialogDescription>
            </DialogHeader>
            {selectedCredit && (
              <RenewCreditForm
                clienteId={selectedCredit.clienteId}
                oldCreditId={selectedCredit.id}
                remainingBalance={selectedCredit.remainingBalance}
                onFormSubmit={() => {
                  setIsRenewModalOpen(false);
                  fetchCredits();
                }}
              />
            )}
          </DialogContent>
        </Dialog>
    </TooltipProvider>
  );
}
