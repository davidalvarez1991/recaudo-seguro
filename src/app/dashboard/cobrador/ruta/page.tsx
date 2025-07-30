"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ClipboardList, HandCoins, Loader2, Map, Star, Handshake, Percent, XCircle } from "lucide-react";
import Link from "next/link";
import { getPaymentRoute, registerPayment, registerMissedPayment, registerPaymentAgreement } from "@/lib/actions";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { format, isToday, isTomorrow, isPast, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { RenewCreditForm } from "@/components/forms/renew-credit-form";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

type PaymentRouteEntry = {
  creditId: string;
  clienteId: string;
  clienteName: string;
  nextPaymentDate: string;
  installmentAmount: number;
  lateFee: number;
  totalDebt: number;
  commission: number;
  lateInterestRate?: number;
  // All fields from Credito type needed for the modal
  id: string;
  valor: number;
  cuotas: number;
  paidInstallments: number;
  paymentDates: string[];
  estado: string;
  paidAmount: number;
  agreementAmount: number;
  remainingBalance: number;
  missedPaymentDays: number;
};

type GroupedRoutes = {
  [key: string]: PaymentRouteEntry[];
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

const formatDateGroup = (dateStr: string) => {    
    const date = parseISO(dateStr);
    if (isToday(date)) return `Hoy, ${format(date, "d 'de' MMMM", { locale: es })}`;
    if (isTomorrow(date)) return `Mañana, ${format(date, "d 'de' MMMM", { locale: es })}`;
    return format(date, "EEEE, d 'de' MMMM", { locale: es });
};

export default function RutaDePagoPage() {
    const [groupedRoutes, setGroupedRoutes] = useState<GroupedRoutes>({});
    const [loading, setLoading] = useState(true);
    const [selectedCredit, setSelectedCredit] = useState<PaymentRouteEntry | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isRenewModalOpen, setIsRenewModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [paymentType, setPaymentType] = useState<PaymentType>("cuota");
    const [agreementAmount, setAgreementAmount] = useState("");
    const { toast } = useToast();

    const fetchRoute = useCallback(async () => {
        setLoading(true);
        try {
            const routes = await getPaymentRoute();
            const grouped: GroupedRoutes = routes.reduce((acc, route) => {
                const dateKey = format(parseISO(route.nextPaymentDate), 'yyyy-MM-dd');
                if (!acc[dateKey]) {
                    acc[dateKey] = [];
                }
                acc[dateKey].push(route);
                return acc;
            }, {} as GroupedRoutes);
            setGroupedRoutes(grouped);
        } catch (error) {
            toast({ title: "Error", description: "No se pudo cargar la ruta de pagos.", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    }, [toast]);

    useEffect(() => {
        fetchRoute();
    }, [fetchRoute]);

    const handleRowClick = (credit: PaymentRouteEntry) => {
        setSelectedCredit(credit);
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
        const result = await registerPayment(selectedCredit.id, getPaymentAmount(), paymentType);
        if (result.success) {
            toast({ title: "Pago Registrado", description: result.success, className: "bg-accent text-accent-foreground border-accent" });
            setIsModalOpen(false);
            fetchRoute();
        } else {
            toast({ title: "Error al registrar el pago", description: result.error, variant: "destructive" });
        }
        setIsSubmitting(false);
    };

    const handlePaymentAgreement = async () => {
        if (!selectedCredit) return;
        setIsSubmitting(true);
        const amount = agreementAmount ? parseFloat(agreementAmount.replace(/\D/g, '')) : 0;
        const result = await registerPaymentAgreement(selectedCredit.id, amount);
        if (result.success) {
            toast({ title: "Acuerdo Registrado", description: result.success, className: "bg-accent text-accent-foreground border-accent" });
            setIsModalOpen(false);
            fetchRoute();
        } else {
            toast({ title: "Error en el Acuerdo", description: result.error, variant: "destructive" });
        }
        setIsSubmitting(false);
    };

    const handleMissedPayment = async () => {
        if (!selectedCredit) return;
        setIsSubmitting(true);
        const result = await registerMissedPayment(selectedCredit.id);
        if (result.success) {
            toast({ title: "Día de Mora Registrado", description: "Se ha registrado un día de mora para este crédito.", className: "bg-accent text-accent-foreground border-accent" });
            setIsModalOpen(false);
            fetchRoute();
        } else {
            toast({ title: "Error", description: result.error, variant: "destructive" });
        }
        setIsSubmitting(false);
    };

    const getPaymentAmount = () => {
        if (!selectedCredit) return 0;
        if (paymentType === 'acuerdo') return agreementAmount ? parseFloat(agreementAmount.replace(/\D/g, '')) : 0;
        switch (paymentType) {
            case "cuota": return selectedCredit.installmentAmount + selectedCredit.lateFee;
            case "total": return selectedCredit.totalDebt;
            case "comision": return selectedCredit.commission;
            default: return 0;
        }
    };

    const canRenewCredit = (credit: PaymentRouteEntry | null) => {
        if (!credit) return false;
        return credit.paidAmount >= (credit.valor + credit.commission) / 2;
    };

    const handleRenewClick = () => {
        setIsModalOpen(false);
        setIsRenewModalOpen(true);
    };

    const hasInterestOption = (selectedCredit?.lateInterestRate ?? 0) > 0;
    const sortedGroupKeys = Object.keys(groupedRoutes).sort();
    
    return (
        <Card>
            <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="space-y-1">
                        <CardTitle className="text-3xl flex items-center gap-2">
                            <Map className="h-8 w-8 text-primary" />
                            Ruta de Pagos
                        </CardTitle>
                        <CardDescription>Clientes organizados por su próxima fecha de cobro.</CardDescription>
                    </div>
                    <Button asChild variant="outline" className="w-full sm:w-auto">
                        <Link href="/dashboard/cobrador">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Volver al Panel
                        </Link>
                    </Button>
                </div>
            </CardHeader>
            <CardContent>
                {loading ? (
                    <div className="flex justify-center items-center h-40">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                ) : sortedGroupKeys.length > 0 ? (
                    <Accordion type="multiple" defaultValue={sortedGroupKeys.map(key => `group-${key}`)} className="w-full space-y-4">
                        {sortedGroupKeys.map(dateKey => (
                            <AccordionItem key={dateKey} value={`group-${dateKey}`} className="border rounded-lg bg-card">
                                <AccordionTrigger className="px-4 py-3 hover:no-underline">
                                    <div className="flex items-center gap-4">
                                        <Badge variant={isPast(parseISO(dateKey)) && !isToday(parseISO(dateKey)) ? "destructive" : "secondary"}>
                                            {formatDateGroup(dateKey)}
                                        </Badge>
                                        <span className="text-muted-foreground text-sm">{groupedRoutes[dateKey].length} cliente(s)</span>
                                    </div>
                                </AccordionTrigger>
                                <AccordionContent className="px-1 pb-2">
                                    <div className="divide-y">
                                        {groupedRoutes[dateKey].map(route => (
                                            <div key={route.creditId} onClick={() => handleRowClick(route)} className="flex items-center justify-between p-4 hover:bg-muted/50 cursor-pointer">
                                                <div>
                                                    <p className="font-semibold">{route.clienteName}</p>
                                                    <p className="text-sm text-muted-foreground">CC: {route.clienteId}</p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="font-bold text-lg text-primary">{formatCurrency(route.installmentAmount + route.lateFee)}</p>
                                                    {route.lateFee > 0 && <p className="text-xs text-destructive">Incluye {formatCurrency(route.lateFee)} de mora</p>}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </AccordionContent>
                            </AccordionItem>
                        ))}
                    </Accordion>
                ) : (
                    <div className="text-center text-muted-foreground py-16">
                        <ClipboardList className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                        <h3 className="text-lg font-semibold">No hay cobros pendientes</h3>
                        <p className="text-sm">No hay clientes con fechas de pago próximas.</p>
                    </div>
                )}
            </CardContent>

             {/* Payment Modal */}
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Registrar Acción</DialogTitle>
                        <DialogDescription>Para el cliente <span className="font-semibold">{selectedCredit?.clienteName}</span>.</DialogDescription>
                    </DialogHeader>
                    {selectedCredit && (
                        <RadioGroup value={paymentType} onValueChange={(value: any) => setPaymentType(value)} className="gap-3 pt-4">
                            <Label htmlFor="payment-cuota" className="flex items-start gap-4 rounded-md border p-3 cursor-pointer">
                                <RadioGroupItem value="cuota" id="payment-cuota" className="mt-1" />
                                <div className="flex justify-between w-full">
                                    <p className="font-semibold">Pagar Cuota</p>
                                    <p className="font-bold">{formatCurrency(selectedCredit.installmentAmount + selectedCredit.lateFee)}</p>
                                </div>
                            </Label>
                            <Label htmlFor="payment-comision" className="flex items-start gap-4 rounded-md border p-3 cursor-pointer">
                                <RadioGroupItem value="comision" id="payment-comision" className="mt-1" />
                                <div className="flex justify-between w-full">
                                    <p className="font-semibold flex items-center gap-1.5"><Percent className="h-4 w-4" /> Comisión</p>
                                    <p className="font-bold">{formatCurrency(selectedCredit.commission)}</p>
                                </div>
                            </Label>
                            <Label htmlFor="payment-total" className="flex items-start gap-4 rounded-md border p-3 cursor-pointer">
                                <RadioGroupItem value="total" id="payment-total" className="mt-1" />
                                <div className="flex justify-between w-full">
                                    <p className="font-semibold">Pagar Total</p>
                                    <p className="font-bold">{formatCurrency(selectedCredit.totalDebt)}</p>
                                </div>
                            </Label>
                            <Label htmlFor="payment-acuerdo" className="flex flex-col gap-2 rounded-md border p-3 cursor-pointer">
                                <div className="flex items-start gap-4">
                                  <RadioGroupItem value="acuerdo" id="payment-acuerdo" className="mt-1" />
                                  <div className="flex justify-between w-full">
                                    <p className="font-semibold flex items-center gap-1.5"><Handshake className="h-4 w-4" /> Acuerdo</p>
                                    <p className="font-bold">{agreementAmount ? formatCurrency(parseFloat(agreementAmount.replace(/\D/g, ''))) : '$0'}</p>
                                  </div>
                                </div>
                                {paymentType === 'acuerdo' && (
                                    <div className="pl-8 pt-1">
                                      <Input placeholder="Valor del acuerdo..." value={agreementAmount} onChange={(e) => setAgreementAmount(formatCurrencyForInput(e.target.value))} />
                                    </div>
                                )}
                            </Label>
                        </RadioGroup>
                    )}
                    <DialogFooter className="flex-col sm:flex-row sm:justify-between gap-2 pt-4">
                        <Button variant="outline" onClick={() => setIsModalOpen(false)} disabled={isSubmitting}>Cancelar</Button>
                        <div className="flex flex-col-reverse sm:flex-row gap-2">
                            <Button variant="destructive" onClick={handleMissedPayment} disabled={isSubmitting || !hasInterestOption}><XCircle className="mr-2 h-4 w-4" />No pagó</Button>
                            <Button onClick={handleConfirmAction} disabled={isSubmitting}><HandCoins className="mr-2 h-4 w-4" />{isSubmitting ? 'Registrando...' : 'Confirmar'}</Button>
                            <Button onClick={handleRenewClick} variant="secondary" className="bg-amber-400 hover:bg-amber-500 text-amber-900" disabled={isSubmitting || !canRenewCredit(selectedCredit)}><Star className="mr-2 h-4 w-4" />Renovar</Button>
                        </div>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Renew Credit Modal */}
            <Dialog open={isRenewModalOpen} onOpenChange={setIsRenewModalOpen}>
                <DialogContent>
                    <DialogHeader><DialogTitle>Renovar Crédito</DialogTitle></DialogHeader>
                    {selectedCredit && <RenewCreditForm clienteId={selectedCredit.clienteId} oldCreditId={selectedCredit.id} remainingBalance={selectedCredit.remainingBalance} onFormSubmit={() => { setIsRenewModalOpen(false); fetchRoute(); }} />}
                </DialogContent>
            </Dialog>
        </Card>
    );
}
