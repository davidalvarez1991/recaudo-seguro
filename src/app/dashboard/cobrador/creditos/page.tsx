
"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ClipboardList, HandCoins, Loader2, Info, RefreshCcw, XCircle, CalendarDays, CheckCircle2, Circle, Star, Search, Handshake, Percent, Sparkles, Filter, X, Repeat } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { getCreditsByCobrador, registerPayment, registerMissedPayment, registerPaymentAgreement } from "@/lib/actions";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { RenewCreditForm } from "@/components/forms/renew-credit-form";
import { NewCreditForm } from "@/components/forms/new-credit-form";
import { format, isBefore, startOfToday, isWithinInterval } from 'date-fns';
import { es } from 'date-fns/locale';
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { DateRange } from "react-day-picker";
import { RefinanceCreditForm } from "@/components/forms/refinance-credit-form";


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
  agreementAmount: number;
  remainingBalance: number;
  lateFee: number;
  totalDebt: number;
};

type PaymentType = "cuota" | "total" | "acuerdo" | "comision";

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
  const [isRefinanceModalOpen, setIsRefinanceModalOpen] = useState(false);
  const [isNewCreditModalOpen, setIsNewCreditModalOpen] = useState(false);
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
    if (credito.estado === 'Pagado') {
        setSelectedCredit(credito);
        setIsNewCreditModalOpen(true);
        return;
    }

    if (credito.estado === 'Renovado' || credito.estado === 'Refinanciado') {
        toast({ title: `Crédito ${credito.estado}`, description: "Este crédito ya fue procesado y no admite más acciones." });
        return;
    }
    
    setSelectedCredit(credito);
    setIsModalOpen(true);
  };

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
  
  const handleRefinanceClick = () => {
    setIsModalOpen(false);
    setIsRefinanceModalOpen(true);
  }
  
  const getInstallmentBreakdown = () => {
    if (!selectedCredit) return { capital: 0, commission: 0 };
    const capitalPerInstallment = selectedCredit.valor / selectedCredit.cuotas;
    const commissionPerInstallment = selectedCredit.commission / selectedCredit.cuotas;
    return { capital: capitalPerInstallment, commission: commissionPerInstallment };
  }

  const filteredCreditos = useMemo(() => {
    const lowercasedFilter = searchTerm.toLowerCase();
    return creditos.filter(credito => {
        if (!searchTerm) return true;

        const nameMatch = credito.clienteName?.toLowerCase().includes(lowercasedFilter);
        const idMatch = credito.clienteId?.toLowerCase().includes(lowercasedFilter);
        const stateMatch = credito.estado.toLowerCase().includes(lowercasedFilter);

        return nameMatch || idMatch || stateMatch;
    });
  }, [creditos, searchTerm]);

  return (
    <TooltipProvider>
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="space-y-1">
                  <CardTitle className="text-3xl">Historial de Créditos</CardTitle>
                  <CardDescription>
                  Consulta todos los créditos y gestiona los que estén activos.
                  </CardDescription>
              </div>
              <Button asChild variant="outline" className="w-full sm:w-auto">
                  <Link href="/dashboard/cobrador">
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      Volver al Panel
                  </Link>
              </Button>
          </div>
           <div className="mt-4 flex flex-col sm:flex-row gap-2">
                <div className="relative flex-grow">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                    type="search"
                    placeholder="Buscar por nombre, cédula o estado (Ej: Pagado)..."
                    className="w-full pl-8"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>
        </CardHeader>
        <CardContent className="pt-6">
          {loading ? (
             <div className="flex justify-center items-center h-40">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
             </div>
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
                      <TableRow key={credito.id} onClick={() => handleRowClick(credito)} className={`cursor-pointer ${credito.estado !== 'Activo' && credito.estado !== 'Pagado' ? 'opacity-50 hover:bg-transparent' : ''}`}>
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
                           <Badge variant={credito.estado === 'Activo' ? 'default' : (credito.estado === 'Pagado' ? 'secondary' : (credito.estado === 'Refinanciado' || credito.estado === 'Renovado' ? 'outline' : 'destructive'))}>
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
                <h3 className="text-lg font-semibold">{searchTerm ? 'No se encontraron créditos' : 'No hay créditos registrados'}</h3>
                <p className="text-sm">{searchTerm ? 'Intenta con otros filtros.' : 'Cuando crees tu primer crédito, aparecerá aquí.'}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Details/Renew/Refinance Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Detalle del Crédito</DialogTitle>
            <DialogDescription>
              Cliente: <span className="font-semibold">{selectedCredit?.clienteName}</span>.
            </DialogDescription>
          </DialogHeader>
          {selectedCredit && (
            <div className="py-4 space-y-4">
               <div className="space-y-2">
                 <div className="flex justify-between items-center rounded-md border p-4 bg-muted/50">
                    <div>
                        <p className="font-semibold">Valor de la Cuota</p>
                        <div className="text-xs text-muted-foreground">
                            <span>Capital: {formatCurrency(getInstallmentBreakdown().capital)}</span>
                            <span className="mx-1">|</span>
                            <span>Comisión: {formatCurrency(getInstallmentBreakdown().commission)}</span>
                        </div>
                    </div>
                    <p className="font-bold text-lg text-primary">{formatCurrency(((selectedCredit.valor + selectedCredit.commission) / selectedCredit.cuotas))}</p>
                 </div>
                 <div className="flex justify-between items-center rounded-md border p-4 bg-muted/50">
                    <div>
                        <p className="font-semibold">Deuda Total Actual</p>
                        <p className="text-xs text-muted-foreground">Incluye saldo pendiente y mora</p>
                    </div>
                    <p className="font-bold text-lg text-destructive">{formatCurrency(selectedCredit.totalDebt)}</p>
                 </div>
               </div>

                <Accordion type="single" collapsible className="w-full">
                  <AccordionItem value="item-1">
                      <AccordionTrigger className="text-sm font-medium hover:no-underline">
                          <div className="flex items-center gap-2">
                              <CalendarDays className="h-5 w-5 text-muted-foreground" />
                              <span>Ver Calendario de Pagos</span>
                          </div>
                      </AccordionTrigger>
                      <AccordionContent>
                          {selectedCredit.paymentDates && selectedCredit.paymentDates.length > 0 ? (
                              <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-2 text-sm pl-2 max-h-24 overflow-y-auto">
                                  {selectedCredit.paymentDates
                                      .sort((a,b) => new Date(a).getTime() - new Date(b).getTime())
                                      .map((dateStr, index) => {
                                      const isPaid = index < selectedCredit.paidInstallments;
                                      const isNext = index === selectedCredit.paidInstallments;
                                      return (
                                      <div key={index} className={cn("flex items-center gap-2", { "text-muted-foreground": isPaid, "font-bold text-primary": isNext })}>
                                          {isPaid ? <CheckCircle2 className="h-4 w-4 text-green-500"/> : <Circle className="h-4 w-4 text-muted-foreground/50"/>}
                                          <span>{format(new Date(dateStr), "d 'de' MMM", { locale: es })}</span>
                                      </div>
                                      );
                                  })}
                              </div>
                          ) : (
                              <p className="text-sm text-muted-foreground text-center py-4">No hay un calendario de pagos definido.</p>
                          )}
                      </AccordionContent>
                  </AccordionItem>
              </Accordion>
            </div>
          )}
          <DialogFooter className="flex-col sm:flex-row sm:justify-between gap-2">
            <Button variant="destructive-outline" onClick={handleRefinanceClick} disabled={!selectedCredit}>
                <Repeat className="mr-2 h-4 w-4" />
                Refinanciar Deuda
            </Button>
            <div className="flex flex-col sm:flex-row gap-2">
             <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cerrar</Button>
             <Button onClick={handleRenewClick} variant="secondary" className="bg-amber-400 hover:bg-amber-500 text-amber-900" disabled={!canRenewCredit(selectedCredit)}>
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
        
      {/* Refinance Credit Modal */}
       <Dialog open={isRefinanceModalOpen} onOpenChange={setIsRefinanceModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Refinanciar Deuda</DialogTitle>
              <DialogDescription>
                Crear un nuevo crédito para <span className="font-semibold">{selectedCredit?.clienteName}</span> basado en su deuda total actual.
              </DialogDescription>
            </DialogHeader>
            {selectedCredit && (
              <RefinanceCreditForm
                clienteId={selectedCredit.clienteId}
                oldCreditId={selectedCredit.id}
                totalDebt={selectedCredit.totalDebt}
                onFormSubmit={() => {
                  setIsRefinanceModalOpen(false);
                  fetchCredits();
                }}
              />
            )}
          </DialogContent>
        </Dialog>
        
        {/* New Credit for Paid Client Modal */}
        <Dialog open={isNewCreditModalOpen} onOpenChange={setIsNewCreditModalOpen}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Sparkles className="h-5 w-5 text-amber-500"/>
                        Habilitar Nuevo Crédito
                    </DialogTitle>
                    <DialogDescription>
                        Crear un nuevo crédito para el cliente recurrente <span className="font-semibold">{selectedCredit?.clienteName}</span>.
                    </DialogDescription>
                </DialogHeader>
                {selectedCredit && (
                    <NewCreditForm
                        clienteId={selectedCredit.clienteId}
                        onFormSubmit={() => {
                            setIsNewCreditModalOpen(false);
                            fetchCredits();
                        }}
                    />
                )}
            </DialogContent>
        </Dialog>
    </TooltipProvider>
  );
}
