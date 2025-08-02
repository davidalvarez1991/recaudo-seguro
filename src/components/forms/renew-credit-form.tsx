
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Loader2, DollarSign, Save, CalendarIcon, RefreshCw, CheckCircle2, BadgeInfo, ShieldCheck } from "lucide-react";
import { RenewCreditSchema } from "@/lib/schemas";
import { renewCredit, savePaymentSchedule, getContractForAcceptance, acceptContract } from "@/lib/actions";
import { useRouter } from "next/navigation";
import { Calendar } from "@/components/ui/calendar";
import { Label } from "@/components/ui/label";
import { startOfDay, format } from 'date-fns';
import { es } from 'date-fns/locale';
import { ScrollArea } from "../ui/scroll-area";

type RenewCreditFormProps = {
  clienteId: string;
  oldCreditId: string;
  remainingBalance: number;
  onFormSubmit: () => void;
};

const formatCurrency = (value: number) => {
    if (isNaN(value)) return "$0";
    return `$${value.toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
};

export function RenewCreditForm({ clienteId, oldCreditId, remainingBalance, onFormSubmit }: RenewCreditFormProps) {
  const [step, setStep] = useState(1);
  const [isPending, setIsPending] = useState(false);
  const [newCreditId, setNewCreditId] = useState<string | null>(null);
  const [contractText, setContractText] = useState<string | null>(null);
  const [selectedDates, setSelectedDates] = useState<Date[]>([]);
  const [month, setMonth] = useState(new Date());

  const { toast } = useToast();
  const router = useRouter();

  const form = useForm<z.infer<typeof RenewCreditSchema>>({
    resolver: zodResolver(RenewCreditSchema),
    defaultValues: {
      clienteId,
      oldCreditId,
      additionalAmount: "",
      installments: "",
    },
  });

  const handleCurrencyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (!value) {
      form.setValue('additionalAmount', "");
      return;
    }
    const numberValue = parseInt(value.replace(/\D/g, ""), 10);
    if (isNaN(numberValue)) {
      form.setValue('additionalAmount', "");
      return;
    }
    const formattedValue = new Intl.NumberFormat('es-CO').format(numberValue);
    form.setValue('additionalAmount', formattedValue);
  };
  
  const handleNextStep = async () => {
    const isValid = await form.trigger();
    if (!isValid) return;

    setIsPending(true);
    const result = await renewCredit(form.getValues());
    
    if (result.success && result.newCreditId) {
      setNewCreditId(result.newCreditId);
      setStep(2);
    } else {
      toast({
        title: "Error en la renovación",
        description: result.error || "No se pudo renovar el crédito.",
        variant: "destructive",
      });
    }
    setIsPending(false);
  };

  const handleDateSelect = (dates: Date[] | undefined) => {
      if (!dates) return;
      
      const today = startOfDay(new Date());
      const validDates = dates.filter(date => date && date >= today);

      const installments = parseInt(form.getValues('installments') || '0', 10);
      if (installments > 0 && validDates.length > installments) {
          toast({
              title: "Límite de cuotas alcanzado",
              description: `No puedes seleccionar más de ${installments} fechas de pago.`,
              variant: "destructive",
          });
          setSelectedDates(prevDates => prevDates);
          return;
      }

      setSelectedDates(validDates.sort((a,b) => a.getTime() - b.getTime()));
  };

  const handleResetDates = () => {
    setSelectedDates([]);
    toast({
      title: "Selección reiniciada",
      description: "Puedes volver a elegir las fechas de pago.",
    });
  }

  const handleSaveSchedule = async () => {
      const validDates = selectedDates.filter(d => d instanceof Date && !isNaN(d.getTime()));

      if (!newCreditId || validDates.length === 0) {
           toast({
              title: "Información incompleta",
              description: "Debes seleccionar las fechas de pago.",
              variant: "destructive"
          });
          return;
      }
      
      const installments = parseInt(form.getValues('installments') || '0', 10);
      if (validDates.length !== installments) {
           toast({
              title: "Fechas no coinciden",
              description: `Debes seleccionar exactamente ${installments} fechas. Has seleccionado ${validDates.length}.`,
              variant: "destructive"
          });
          return;
      }

      setIsPending(true);
      const result = await savePaymentSchedule({
          creditId: newCreditId,
          paymentDates: validDates.map(d => d.toISOString())
      });
      
      if (result.success) {
          const contractData = await getContractForAcceptance(newCreditId);
          if (contractData.contractText) {
              setContractText(contractData.contractText);
              setStep(3);
          } else {
              toast({ 
                  title: "Crédito Renovado", 
                  description: "El nuevo crédito y su calendario de pagos se han creado exitosamente.",
                  className: "bg-accent text-accent-foreground border-accent",
              });
              if (typeof window !== 'undefined') {
                window.dispatchEvent(new CustomEvent('creditos-updated'));
              }
              onFormSubmit();
              router.refresh();
          }
      } else {
          toast({ title: "Error", description: result.error, variant: "destructive" });
      }
      setIsPending(false);
  };
  
   const handleAcceptContract = async () => {
        if (!newCreditId) return;
        
        setIsPending(true);
        const result = await acceptContract(newCreditId);

        if (result.success) {
            toast({
                title: "Renovación Finalizada",
                description: "El contrato fue aceptado y el crédito renovado está activo.",
                variant: "default",
                className: "bg-accent text-accent-foreground border-accent",
            });
            if (typeof window !== 'undefined') {
                window.dispatchEvent(new CustomEvent('creditos-updated'));
            }
            onFormSubmit();
        } else {
            toast({
                title: "Error",
                description: result.error || "No se pudo aceptar el contrato.",
                variant: "destructive",
            });
        }
        setIsPending(false);
    }


  const renderStepContent = () => {
    if (step === 1) {
      return (
        <>
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 text-center space-y-1 mb-4">
              <div className="text-sm font-medium text-blue-700 dark:text-blue-300 flex items-center justify-center gap-1.5">
                  <BadgeInfo className="h-4 w-4"/> Saldo Anterior a Refinanciar
              </div>
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400 tracking-tight">
                  {formatCurrency(remainingBalance)}
              </div>
          </div>
          <FormField
              control={form.control}
              name="additionalAmount"
              render={({ field }) => (
              <FormItem>
                  <FormLabel>Valor Adicional a Entregar</FormLabel>
                  <div className="relative">
                      <DollarSign className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <FormControl>
                          <Input
                              {...field}
                              type="text"
                              placeholder="1.000.000" 
                              disabled={isPending} 
                              className="pl-8"
                              onChange={handleCurrencyChange}
                          />
                      </FormControl>
                  </div>
                  <FormMessage />
              </FormItem>
              )}
          />
          <FormField
              control={form.control}
              name="installments"
              render={({ field }) => (
              <FormItem>
                  <FormLabel>Nuevas Cuotas a Diferir</FormLabel>
                  <FormControl>
                  <Input 
                      {...field}
                      type="number" 
                      placeholder="12" 
                      disabled={isPending}
                  />
                  </FormControl>
                  <FormMessage />
              </FormItem>
              )}
          />
          <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={onFormSubmit} disabled={isPending}>
                  Cancelar
              </Button>
              <Button type="button" onClick={handleNextStep} className="bg-accent hover:bg-accent/90" disabled={isPending}>
                  {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                  Siguiente
              </Button>
          </div>
        </>
      );
    }

    if (step === 2) {
      return (
         <>
            <div className="space-y-4">
                <div className="flex justify-between items-center">
                    <div className="space-y-1">
                        <Label>Seleccionar Fechas de Pago</Label>
                        <p className="text-sm text-muted-foreground">
                            Establece el nuevo cronograma.
                        </p>
                    </div>
                     <Button variant="ghost" size="icon" onClick={handleResetDates} disabled={isPending}>
                        <RefreshCw className="h-4 w-4" />
                        <span className="sr-only">Refrescar Selección</span>
                     </Button>
                </div>
                <div className="rounded-md border flex justify-center">
                    <Calendar
                        mode="multiple"
                        selected={selectedDates}
                        onSelect={handleDateSelect as any}
                        month={month}
                        onMonthChange={setMonth}
                        fromDate={new Date()}
                        disabled={(date) => date < startOfDay(new Date())}
                        locale={es}
                        footer={
                            <p className="text-sm text-muted-foreground px-3 pt-2">
                                Has seleccionado {selectedDates.length} de {form.getValues('installments') || 0} cuotas.
                            </p>
                        }
                        modifiers={{
                            selected: selectedDates,
                        }}
                        modifiersClassNames={{
                            selected: 'bg-primary text-primary-foreground hover:bg-primary/90 focus:bg-primary/90',
                        }}
                    />
                </div>
                 {selectedDates.length > 0 && (
                    <div className="rounded-md border p-4 mt-2 h-24 overflow-y-auto">
                         <Label>Fechas Seleccionadas</Label>
                         <div className="space-y-1 text-sm mt-2 text-[#0B025E]">
                            {selectedDates
                                .filter(date => date instanceof Date && !isNaN(date.getTime()))
                                .map(date => (
                                    <div key={date.toISOString()}>
                                        {format(date, "dd 'de' MMMM", {locale: es})}
                                    </div>
                                ))
                            }
                        </div>
                    </div>
                )}
            </div>
             <div className="flex justify-end gap-2 mt-6">
                <Button type="button" variant="outline" onClick={() => setStep(1)} disabled={isPending}>
                    Volver
                </Button>
                <Button type="button" onClick={handleSaveSchedule} className="w-full" disabled={isPending || selectedDates.length === 0}>
                    {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
                    {isPending ? 'Guardando...' : 'Siguiente'}
                </Button>
            </div>
        </>
      );
    }
     if (step === 3) {
        return (
            <div className="space-y-4">
                 <div className="space-y-1">
                    <Label>Revisión y Aceptación del Contrato</Label>
                    <p className="text-sm text-muted-foreground">
                        El cliente debe leer y aceptar los términos para finalizar.
                    </p>
                </div>
                 <ScrollArea className="h-80 w-full rounded-md border p-4 whitespace-pre-wrap font-mono text-xs">
                    {isPending && !contractText ? <Loader2 className="animate-spin mx-auto" /> : contractText}
                </ScrollArea>
                <Button type="button" onClick={handleAcceptContract} className="w-full bg-accent hover:bg-accent/90" disabled={isPending}>
                    {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ShieldCheck className="mr-2 h-4 w-4" />}
                    {isPending ? "Procesando..." : "Aceptar y Finalizar Contrato"}
                </Button>
            </div>
        )
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={(e) => e.preventDefault()} className="space-y-6 pt-4">
        {renderStepContent()}
      </form>
    </Form>
  );
}
