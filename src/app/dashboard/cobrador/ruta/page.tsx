
"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ClipboardList, HandCoins, Loader2, Map, Star, Handshake, Percent, XCircle, Calendar as CalendarIcon, X, CheckCircle2, Circle, Home, Phone, Search, Repeat } from "lucide-react";
import Link from "next/link";
import { getPaymentRoute, registerPayment, registerMissedPayment, registerPaymentAgreement } from "@/lib/actions";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { format, isToday, isTomorrow, isPast, parseISO, startOfDay } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';
import { es } from 'date-fns/locale';
import { RenewCreditForm } from "@/components/forms/renew-credit-form";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Calendar } from "@/components/ui/calendar";
import { RefinanceCreditForm } from "@/components/forms/refinance-credit-form";


type PaymentRouteEntry = {
  creditId: string;
  clienteId: string;
  clienteName: string;
  clienteAddress: string;
  clientePhone: string;
  nextPaymentDate: string;
  installmentAmount: number;
  lateFee: number;
  totalDebt: number;
  commission: number;
  lateInterestRate?: number;
  isPaidToday: boolean;
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

type PaymentType = "cuota" | "total" | "comision";

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
    const timeZone = 'America/Bogota';
    const zonedDate = toZonedTime(date, timeZone);
    if (isToday(zonedDate)) return `Hoy, ${format(zonedDate, "d 'de' MMMM", { locale: es })}`;
    if (isTomorrow(zonedDate)) return `Mañana, ${format(zonedDate, "d 'de' MMMM", { locale: es })}`;
    return format(zonedDate, "EEEE, d 'de' MMMM", { locale: es });
};

const generateWhatsAppLink = (phone: string, clientName: string) => {
    const message = encodeURIComponent(`Hola ${clientName}, ¿cómo estás? Te escribo para recordarte tu compromiso de pago del día de hoy.`);
    // Assume numbers are for Colombia, prepend 57 if not present
    const cleanPhone = phone.replace(/\s+/g, '');
    const finalPhone = cleanPhone.startsWith('57') ? cleanPhone : `57${cleanPhone}`;
    return `https://wa.me/${finalPhone}?text=${message}`;
}

export default function RutaDePagoPage() {
    const [allRoutes, setAllRoutes] = useState<PaymentRouteEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedCredit, setSelectedCredit] = useState<PaymentRouteEntry | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isAgreementModalOpen, setIsAgreementModalOpen] = useState(false);
    const [agreementStep, setAgreementStep] = useState(1);
    const [agreementAmount, setAgreementAmount] = useState("");
    const [selectedDates, setSelectedDates] = useState<Date[]>([]);
    const [isRenewModalOpen, setIsRenewModalOpen] = useState(false);
    const [isRefinanceModalOpen, setIsRefinanceModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [paymentType, setPaymentType] = useState<PaymentType>("cuota");
    const [searchTerm, setSearchTerm] = useState("");
    const { toast } = useToast();

    const fetchRoute = useCallback(async () => {
        setLoading(true);
        try {
            const routesData = await getPaymentRoute();
            setAllRoutes(routesData.routes || []);
        } catch (error) {
            toast({ title: "Error", description: "No se pudo cargar la ruta de pagos.", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    }, [toast]);

    useEffect(() => {
        fetchRoute();
        const handleCreditsUpdate = () => fetchRoute();
        window.addEventListener('creditos-updated', handleCreditsUpdate);
        return () => {
            window.removeEventListener('creditos-updated', handleCreditsUpdate);
        }
    }, [fetchRoute]);
    
    const groupedRoutes = useMemo(() => {
        const lowercasedFilter = searchTerm.toLowerCase();

        const filtered = allRoutes.filter(route => {
            if (!searchTerm) return true;
            return route.clienteName.toLowerCase().includes(lowercasedFilter) || route.clienteId.toLowerCase().includes(lowercasedFilter);
        });

        return filtered.reduce((acc, route) => {
            const dateKey = format(parseISO(route.nextPaymentDate), 'yyyy-MM-dd');
            if (!acc[dateKey]) {
                acc[dateKey] = [];
            }
            acc[dateKey].push(route);
            return acc;
        }, {} as GroupedRoutes);
    }, [allRoutes, searchTerm]);


    const handleRowClick = (credit: PaymentRouteEntry) => {
        setSelectedCredit(credit);
        setPaymentType("cuota");
        setIsModalOpen(true);
    };
    
    const handleRegisterPayment = async () => {
        if (!selectedCredit) return;
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
    
    const openAgreementModal = () => {
        setIsModalOpen(false);
        setAgreementStep(1);
        setAgreementAmount("");
        setSelectedDates([]);
        setIsAgreementModalOpen(true);
    }
    
    const handleDateSelect = (dates: Date[] | undefined) => {
        if (!dates || !selectedCredit) return;
        const remainingInstallments = selectedCredit.cuotas - selectedCredit.paidInstallments;
        if (dates.length > remainingInstallments) {
            toast({
                title: "Límite de fechas alcanzado",
                description: `Puedes seleccionar un máximo de ${remainingInstallments} fechas nuevas.`,
                variant: "destructive"
            });
            return;
        }
        setSelectedDates(dates.sort((a,b) => a.getTime() - b.getTime()));
    }
    
    const confirmAgreement = async () => {
        if (!selectedCredit) return;
        
        const remainingInstallments = selectedCredit.cuotas - selectedCredit.paidInstallments;
        if (selectedDates.length > 0 && selectedDates.length !== remainingInstallments) {
            toast({ title: "Revisa las fechas", description: `Debes seleccionar exactamente ${remainingInstallments} nuevas fechas para las cuotas restantes.`, variant: "destructive" });
            return;
        }
        
        setIsSubmitting(true);
        const amount = parseFloat(agreementAmount.replace(/\D/g, '')) || 0;
        const result = await registerPaymentAgreement(
            selectedCredit.id,
            amount,
            selectedDates.length > 0 ? selectedDates.map(d => d.toISOString()) : undefined
        );

        if (result.success) {
            toast({ title: "Acuerdo Registrado", description: result.success, className: "bg-accent text-accent-foreground border-accent" });
            setIsAgreementModalOpen(false);
            fetchRoute();
        } else {
            toast({ title: "Error", description: result.error, variant: "destructive" });
        }
        setIsSubmitting(false);
    }


    const getPaymentAmount = () => {
        if (!selectedCredit) return 0;
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

    const handleRefinanceClick = () => {
        setIsModalOpen(false);
        setIsRefinanceModalOpen(true);
    }
    
    const hasInterestOption = (selectedCredit?.lateInterestRate ?? 0) > 0;
    const sortedGroupKeys = Object.keys(groupedRoutes).sort((a,b) => new Date(a).getTime() - new Date(b).getTime());

    const defaultOpenValue = useMemo(() => {
        const timeZone = 'America/Bogota';
        const todayKey = sortedGroupKeys.find(key => isToday(toZonedTime(parseISO(key), timeZone)));
        return todayKey ? [`group-${todayKey}`] : [];
    }, [sortedGroupKeys]);
    
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
                 <div className="pt-4 flex flex-col sm:flex-row gap-2">
                     <div className="relative flex-grow">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            type="search"
                            placeholder="Buscar por nombre o cédula..."
                            className="w-full pl-8"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                {loading ? (
                    <div className="flex justify-center items-center h-40">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                ) : sortedGroupKeys.length > 0 ? (
                    <Accordion type="multiple" defaultValue={defaultOpenValue} className="w-full space-y-4">
                        {sortedGroupKeys.map(dateKey => (
                            <AccordionItem key={dateKey} value={`group-${dateKey}`} className="border rounded-lg bg-card">
                                <AccordionTrigger className="px-4 py-3 hover:no-underline">
                                    <div className="flex items-center gap-4">
                                        <Badge variant={isPast(toZonedTime(parseISO(dateKey), 'America/Bogota')) && !isToday(toZonedTime(parseISO(dateKey), 'America/Bogota')) ? "destructive" : "secondary"}>
                                            {formatDateGroup(dateKey)}
                                        </Badge>
                                        <span className="text-muted-foreground text-sm">{groupedRoutes[dateKey].length} cliente(s)</span>
                                    </div>
                                </AccordionTrigger>
                                <AccordionContent className="px-1 pb-2">
                                    <div className="divide-y">
                                        {groupedRoutes[dateKey].map(route => (
                                            <div 
                                                key={route.creditId} 
                                                onClick={() => handleRowClick(route)} 
                                                className={cn(
                                                    "flex items-start justify-between p-4 hover:bg-muted/50 cursor-pointer transition-colors",
                                                    route.isPaidToday && "bg-green-100/50 hover:bg-green-100/60"
                                                )}
                                            >
                                                <div className="flex-1 space-y-1.5">
                                                    <p className={cn("font-semibold flex items-center gap-2", route.isPaidToday && "text-muted-foreground")}>
                                                      {route.isPaidToday && <CheckCircle2 className="h-5 w-5 text-green-600" />}
                                                      {route.clienteName}
                                                    </p>
                                                    <p className={cn("text-sm text-muted-foreground", route.isPaidToday && "line-through")}>CC: {route.clienteId}</p>
                                                     <div className={cn("flex items-center gap-2 text-sm", route.isPaidToday ? "text-muted-foreground/80" : "text-muted-foreground")}>
                                                        <Home className="h-4 w-4" />
                                                        <span>{route.clienteAddress || 'Sin dirección'}</span>
                                                    </div>
                                                    <div className={cn("flex items-center gap-2 text-sm", route.isPaidToday ? "text-muted-foreground/80" : "text-muted-foreground")}>
                                                        <Phone className="h-4 w-4" />
                                                         <a 
                                                            href={generateWhatsAppLink(route.clientePhone, route.clienteName)}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            onClick={(e) => e.stopPropagation()}
                                                            className="text-primary hover:underline"
                                                          >
                                                            {route.clientePhone || 'Sin teléfono'}
                                                         </a>
                                                    </div>
                                                </div>
                                                <div className="text-right pl-4">
                                                    <p className={cn("font-bold text-lg text-primary", route.isPaidToday && "text-muted-foreground line-through")}>
                                                        {formatCurrency(route.installmentAmount + route.lateFee)}
                                                    </p>
                                                    {route.lateFee > 0 && !route.isPaidToday && <p className="text-xs text-destructive">Incluye {formatCurrency(route.lateFee)} de mora</p>}
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
                        <h3 className="text-lg font-semibold">{searchTerm ? 'No se encontraron clientes' : 'No hay cobros pendientes'}</h3>
                        <p className="text-sm">{searchTerm ? 'Intenta con otros filtros.' : 'No hay clientes con fechas de pago próximas.'}</p>
                    </div>
                )}
            </CardContent>

             {/* Payment Modal */}
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Registrar Acción de Pago</DialogTitle>
                        <DialogDescription>Para el cliente <span className="font-semibold">{selectedCredit?.clienteName}</span>.</DialogDescription>
                    </DialogHeader>
                    {selectedCredit && (
                        <div className="py-4 space-y-4">
                           <RadioGroup value={paymentType} onValueChange={(value: any) => setPaymentType(value)} className="gap-3 pt-4">
                                <Label htmlFor="payment-cuota" className="flex items-start gap-4 rounded-md border p-4 cursor-pointer hover:bg-muted/50">
                                    <RadioGroupItem value="cuota" id="payment-cuota" className="mt-1" />
                                    <div className="flex justify-between items-center w-full">
                                        <div className="flex-1">
                                            <p className="font-semibold">Pagar Cuota</p>
                                            <p className="text-xs text-muted-foreground">Registra el pago de la cuota actual, incluyendo mora si aplica.</p>
                                        </div>
                                        <p className="font-bold ml-4">{formatCurrency(selectedCredit.installmentAmount + selectedCredit.lateFee)}</p>
                                    </div>
                                </Label>
                                <Label htmlFor="payment-comision" className="flex items-start gap-4 rounded-md border p-4 cursor-pointer hover:bg-muted/50">
                                    <RadioGroupItem value="comision" id="payment-comision" className="mt-1" />
                                    <div className="flex justify-between items-center w-full">
                                        <div className="flex-1">
                                            <p className="font-semibold flex items-center gap-1.5"><Percent className="h-4 w-4" /> Pagar Comisión Total</p>
                                            <p className="text-xs text-muted-foreground">Cubre el valor total de la comisión del crédito.</p>
                                        </div>
                                        <p className="font-bold ml-4">{formatCurrency(selectedCredit.commission)}</p>
                                    </div>
                                </Label>
                                <Label htmlFor="payment-total" className="flex items-start gap-4 rounded-md border p-4 cursor-pointer hover:bg-muted/50">
                                    <RadioGroupItem value="total" id="payment-total" className="mt-1" />
                                    <div className="flex justify-between items-center w-full">
                                        <div className="flex-1">
                                            <p className="font-semibold">Pagar Saldo Total</p>
                                            <p className="text-xs text-muted-foreground">Liquida completamente la deuda pendiente del cliente.</p>
                                        </div>
                                        <p className="font-bold ml-4">{formatCurrency(selectedCredit.totalDebt)}</p>
                                    </div>
                                </Label>
                            </RadioGroup>
                        </div>
                    )}
                    <DialogFooter className="flex-col sm:flex-row sm:justify-between gap-2 pt-4">
                        <Button variant="outline" onClick={() => setIsModalOpen(false)} disabled={isSubmitting}>Cancelar</Button>
                        <div className="flex flex-col-reverse sm:flex-row gap-2">
                            <Button variant="destructive" onClick={handleMissedPayment} disabled={isSubmitting || !hasInterestOption}><XCircle className="mr-2 h-4 w-4" />No pagó</Button>
                            <Button onClick={handleRegisterPayment} disabled={isSubmitting}><HandCoins className="mr-2 h-4 w-4" />{isSubmitting ? 'Registrando...' : 'Confirmar Pago'}</Button>
                        </div>
                    </DialogFooter>
                      <Separator />
                      <div className="grid grid-cols-2 gap-2 pt-2">
                        <Button variant="secondary" className="bg-amber-400 hover:bg-amber-500 text-amber-900" onClick={handleRenewClick} disabled={isSubmitting || !canRenewCredit(selectedCredit)}>
                            <Star className="mr-2 h-4 w-4" />
                            Renovar
                        </Button>
                         <Button variant="secondary" onClick={openAgreementModal} disabled={isSubmitting}>
                            <Handshake className="mr-2 h-4 w-4" />
                            Realizar Acuerdo
                        </Button>
                      </div>
                </DialogContent>
            </Dialog>

            {/* Agreement Modal */}
            <Dialog open={isAgreementModalOpen} onOpenChange={setIsAgreementModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Acuerdo de Pago</DialogTitle>
                        <DialogDescription>
                             {agreementStep === 1 ? 'Registra un abono y/o reprograma los pagos.' : 'Selecciona las nuevas fechas de pago.'}
                        </DialogDescription>
                    </DialogHeader>
                    {agreementStep === 1 && (
                        <div className="py-4 space-y-4">
                            <Label htmlFor="agreement-amount">Abono al Saldo (Opcional)</Label>
                            <Input
                                id="agreement-amount"
                                value={agreementAmount}
                                onChange={(e) => setAgreementAmount(formatCurrencyForInput(e.target.value))}
                                placeholder="0"
                            />
                            <p className="text-sm text-muted-foreground">
                                Si necesitas reprogramar las fechas de las cuotas restantes, haz clic en Siguiente. Si solo quieres registrar el abono, haz clic en Confirmar.
                            </p>
                        </div>
                    )}
                    {agreementStep === 2 && selectedCredit && (
                        <div className="py-4 space-y-4">
                            <div className="rounded-md border flex justify-center">
                                <Calendar
                                    mode="multiple"
                                    selected={selectedDates}
                                    onSelect={handleDateSelect}
                                    fromDate={new Date()}
                                    disabled={(date) => date < startOfDay(new Date())}
                                    locale={es}
                                    footer={
                                        <p className="text-sm text-muted-foreground p-3">
                                            Selecciona {selectedCredit.cuotas - selectedCredit.paidInstallments} fechas para las cuotas restantes.
                                        </p>
                                    }
                                />
                            </div>
                        </div>
                    )}
                    <DialogFooter>
                        {agreementStep === 1 && (
                            <>
                                <Button variant="outline" onClick={() => setIsAgreementModalOpen(false)} disabled={isSubmitting}>Cancelar</Button>
                                <Button onClick={confirmAgreement} disabled={isSubmitting}>
                                    {isSubmitting ? <Loader2 className="animate-spin mr-2" /> : <CheckCircle2 className="mr-2 h-4 w-4"/>}
                                    Confirmar Abono
                                </Button>
                                <Button onClick={() => setAgreementStep(2)} disabled={isSubmitting}>
                                    Reprogramar Fechas <ArrowLeft className="h-4 w-4 ml-2 rotate-180"/>
                                </Button>
                            </>
                        )}
                         {agreementStep === 2 && (
                            <>
                                <Button variant="outline" onClick={() => setAgreementStep(1)} disabled={isSubmitting}>
                                    <ArrowLeft className="h-4 w-4 mr-2"/> Volver
                                </Button>
                                <Button onClick={confirmAgreement} disabled={isSubmitting}>
                                    {isSubmitting ? <Loader2 className="animate-spin mr-2" /> : <CheckCircle2 className="mr-2 h-4 w-4"/>}
                                    Confirmar Acuerdo
                                </Button>
                            </>
                        )}
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
                                fetchRoute();
                            }}
                        />
                    )}
                </DialogContent>
            </Dialog>
        </Card>
    );
}
