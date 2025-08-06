
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Loader2, DollarSign, Save, CalendarIcon, RefreshCw, CheckCircle2, ShieldCheck } from "lucide-react";
import { NewCreditSchema } from "@/lib/schemas";
import { createNewCreditForClient, savePaymentSchedule, getContractForAcceptance, acceptContract } from "@/lib/actions";
import { useRouter } from "next/navigation";
import { Calendar } from "@/components/ui/calendar";
import { Label } from "@/components/ui/label";
import { startOfDay, format } from 'date-fns';
import { es } from 'date-fns/locale';
import { ScrollArea } from "../ui/scroll-area";

type NewCreditFormProps = {
  clienteId: string;
  onFormSubmit: () => void;
};

const formatCurrency = (value: string): string => {
    if (!value) return "";
    const numberValue = parseInt(value.replace(/\D/g, ''), 10);
    if (isNaN(numberValue)) return "";
    return new Intl.NumberFormat('es-CO').format(numberValue);
};

export function NewCreditForm({ clienteId, onFormSubmit }: NewCreditFormProps) {
  const [step, setStep] = useState(1);
  const [isPending, setIsPending] = useState(false);
  const [newCreditId, setNewCreditId] = useState<string | null>(null);
  const [contractText, setContractText] = useState<string | null>(null);
  const [selectedDates, setSelectedDates] = useState<Date[]>([]);
  const [month, setMonth] = useState(new Date());

  const { toast } = useToast();
  const router = useRouter();

  const form = useForm<z.infer<typeof NewCreditSchema>>({
    resolver: zodResolver(NewCreditSchema),
    defaultValues: {
      clienteId,
      creditAmount: "",
      installments: "",
    },
  });
  
  const handleCurrencyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    form.setValue('creditAmount', formatCurrency(value));
  };

  const handleNextStep = async () => {
    const isValid = await form.trigger();
    if (!isValid) return;

    setIsPending(true);
    const result = await createNewCreditForClient(form.getValues());
    
    if (result.success && result.newCreditId) {
      setNewCreditId(result.newCreditId);
      setStep(2);
    } else {
      toast({
        title: "Error al crear crédito",
        description: result.error || "No se pudo crear el nuevo crédito.",
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
              description: `No puedes seleccionar más de ${installments} fechas.`,
              variant: "destructive",
          });
          setSelectedDates(prevDates => prevDates);
          return;
      }
      setSelectedDates(validDates.sort((a,b) => a.getTime() - b.getTime()));
  };

  const handleResetDates = () => {
    setSelectedDates([]);
    toast({ title: "Selección reiniciada" });
  }

  const handleSaveSchedule = async () => {
      const validDates = selectedDates.filter(d => d instanceof Date && !isNaN(d.getTime()));

      if (!newCreditId || validDates.length === 0) {
           toast({ title: "Información incompleta", description: "Debes seleccionar las fechas de pago.", variant: "destructive" });
           return;
      }
      
      const installments = parseInt(form.getValues('installments') || '0', 10);
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
              toast({ title: "Crédito Creado", description: "El nuevo crédito y su calendario han sido creados.", className: "bg-accent text-accent-foreground border-accent" });
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
        title: "Crédito Finalizado",
        description: "El contrato fue aceptado y el crédito está activo.",
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
          <FormField
              control={form.control}
              name="creditAmount"
              render={({ field }) => (
              <FormItem>
                  <FormLabel>Valor del Nuevo Crédito</FormLabel>
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
                  <FormLabel>Cuotas a Diferir</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="12" {...field} disabled={isPending} />
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
                        <p className="text-sm text-muted-foreground">Establece el nuevo cronograma.</p>
                    </div>
                     <Button variant="ghost" size="icon" onClick={handleResetDates} disabled={isPending}>
                        <RefreshCw className="h-4 w-4" />
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
                        footer={<p className="text-sm text-muted-foreground px-3 pt-2">Has seleccionado {selectedDates.length} de {form.getValues('installments') || 0} cuotas.</p>}
                        modifiers={{ selected: selectedDates }}
                        modifiersClassNames={{ selected: 'bg-primary text-primary-foreground hover:bg-primary/90' }}
                    />
                </div>
                 {selectedDates.length > 0 && (
                    <div className="rounded-md border p-4 mt-2 h-24 overflow-y-auto">
                         <Label>Fechas Seleccionadas</Label>
                         <div className="space-y-1 text-sm mt-2 text-[#0B025E]">
                            {selectedDates.filter(d => d instanceof Date && !isNaN(d.getTime())).map(d => <div key={d.toISOString()}>{format(d, "dd 'de' MMMM", {locale: es})}</div>)}
                        </div>
                    </div>
                )}
            </div>
             <div className="flex gap-2 mt-6">
                <Button type="button" variant="outline" onClick={() => setStep(1)} disabled={isPending}>
                    Volver
                </Button>
                <Button type="button" onClick={handleSaveSchedule} className="w-full bg-accent hover:bg-accent/90" disabled={isPending || selectedDates.length === 0}>
                    {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
                    {isPending ? 'Guardando...' : 'Finalizar Creación'}
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
          <Button type="button" onClick={handleAcceptContract} className="w-full bg-accent hover:bg-accent/90" disabled={isPending || !contractText}>
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
