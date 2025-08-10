
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Loader2, DollarSign, Save, CheckCircle2, BadgeInfo, ShieldCheck, Repeat } from "lucide-react";
import { RefinanceCreditSchema } from "@/lib/schemas";
import { refinanceCredit, savePaymentSchedule, getContractForAcceptance, acceptContract } from "@/lib/actions";
import { useRouter } from "next/navigation";
import { Calendar } from "@/components/ui/calendar";
import { Label } from "@/components/ui/label";
import { startOfDay, format } from 'date-fns';
import { es } from 'date-fns/locale';
import { ScrollArea } from "../ui/scroll-area";

type RefinanceCreditFormProps = {
  clienteId: string;
  oldCreditId: string;
  totalDebt: number;
  onFormSubmit: () => void;
};

const formatCurrency = (value: number) => {
    if (isNaN(value)) return "$0";
    return `$${value.toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
};

export function RefinanceCreditForm({ clienteId, oldCreditId, totalDebt, onFormSubmit }: RefinanceCreditFormProps) {
  const [step, setStep] = useState(1);
  const [isPending, setIsPending] = useState(false);
  const [newCreditId, setNewCreditId] = useState<string | null>(null);
  const [contractText, setContractText] = useState<string | null>(null);
  const [selectedDates, setSelectedDates] = useState<Date[]>([]);
  const [month, setMonth] = useState(new Date());

  const { toast } = useToast();
  const router = useRouter();

  const form = useForm<z.infer<typeof RefinanceCreditSchema>>({
    resolver: zodResolver(RefinanceCreditSchema),
    defaultValues: {
      clienteId,
      oldCreditId,
      installments: "",
    },
  });
  
  const handleNextStep = async () => {
    const isValid = await form.trigger();
    if (!isValid) return;

    setIsPending(true);
    const result = await refinanceCredit(form.getValues());
    
    if (result.success && result.newCreditId) {
      setNewCreditId(result.newCreditId);
      setStep(2);
    } else {
      toast({
        title: "Error en la refinanciación",
        description: result.error || "No se pudo refinanciar el crédito.",
        variant: "destructive",
      });
    }
    setIsPending(false);
  };

  const handleDateSelect = (dates: Date[] | undefined) => {
      if (!dates) return;
      
      const today = startOfDay(new Date());
      const validDates = dates.filter(date => date && date >= today);
      const installmentsValue = form.getValues('installments');
      if (!installmentsValue) return;
      const installments = parseInt(installmentsValue, 10);

      if (installments > 0 && validDates.length > installments) {
          toast({
              title: "Límite de cuotas alcanzado",
              description: `No puedes seleccionar más de ${installments} fechas.`,
              variant: "destructive",
          });
          setSelectedDates(prevDates => prevDates);
          return;
      }

      setSelectedDates(validDates.sort((a,b) => a.getTime() - b.getTime()));
  };

  const handleSaveSchedule = async () => {
      const validDates = selectedDates.filter(d => d instanceof Date && !isNaN(d.getTime()));

      if (!newCreditId || validDates.length === 0) {
           toast({ title: "Información incompleta", description: "Debes seleccionar las fechas de pago.", variant: "destructive" });
           return;
      }
      
      const installmentsValue = form.getValues('installments');
      if (!installmentsValue) return;
      const installments = parseInt(installmentsValue, 10);

      if (validDates.length !== installments) {
           toast({ title: "Fechas no coinciden", description: `Debes seleccionar exactamente ${installments} fechas.`, variant: "destructive" });
           return;
      }

      setIsPending(true);
      const result = await savePaymentSchedule({ creditId: newCreditId, paymentDates: validDates.map(d => d.toISOString()) });
      
      if (result.success) {
          const contractData = await getContractForAcceptance(newCreditId);
          if (contractData.contractText) {
              setContractText(contractData.contractText);
              setStep(3);
          } else {
              toast({ 
                  title: "Crédito Refinanciado", 
                  description: "El nuevo crédito y su calendario de pagos se han creado.",
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
                title: "Refinanciación Finalizada",
                description: "El contrato fue aceptado y el crédito está activo.",
                variant: "default",
                className: "bg-accent text-accent-foreground border-accent",
            });
            if (typeof window !== 'undefined') {
                window.dispatchEvent(new CustomEvent('creditos-updated'));
            }
            onFormSubmit();
        } else {
            toast({ title: "Error", description: result.error, variant: "destructive" });
        }
        setIsPending(false);
    }

  const renderStepContent = () => {
    if (step === 1) {
      return (
        <>
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 text-center space-y-1 mb-4">
              <div className="text-sm font-medium text-red-700 dark:text-red-300 flex items-center justify-center gap-1.5">
                  <BadgeInfo className="h-4 w-4"/> Deuda Total a Refinanciar
              </div>
              <div className="text-2xl font-bold text-red-600 dark:text-red-400 tracking-tight">
                  {formatCurrency(totalDebt)}
              </div>
          </div>
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
                  {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Repeat className="mr-2 h-4 w-4" />}
                  Refinanciar
              </Button>
          </div>
        </>
      );
    }

    if (step === 2) {
      const installmentsValue = form.getValues('installments');
      const installments = installmentsValue ? parseInt(installmentsValue, 10) : 0;
      return (
         <>
            <div className="space-y-4">
                 <Label>Seleccionar Nuevas Fechas de Pago</Label>
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
                        footer={<p className="text-sm text-muted-foreground px-3 pt-2">Has seleccionado {selectedDates.length} de {installments || 0} cuotas.</p>}
                        modifiers={{ selected: selectedDates }}
                        modifiersClassNames={{ selected: 'bg-primary text-primary-foreground hover:bg-primary/90' }}
                    />
                </div>
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
                 <Label>Revisión y Aceptación del Contrato de Refinanciación</Label>
                 <ScrollArea className="h-80 w-full rounded-md border p-4 whitespace-pre-wrap font-mono text-xs">
                    {isPending && !contractText ? <Loader2 className="animate-spin mx-auto" /> : contractText}
                </ScrollArea>
                <Button type="button" onClick={handleAcceptContract} className="w-full bg-accent hover:bg-accent/90" disabled={isPending || !contractText}>
                    {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ShieldCheck className="mr-2 h-4 w-4" />}
                    Aceptar y Finalizar
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
