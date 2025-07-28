
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Loader2, DollarSign, Save, CalendarIcon, RefreshCw, CheckCircle2 } from "lucide-react";
import { RenewCreditSchema } from "@/lib/schemas";
import { renewCredit, savePaymentSchedule } from "@/lib/actions";
import { useRouter } from "next/navigation";
import { Calendar } from "@/components/ui/calendar";
import { Label } from "@/components/ui/label";
import { startOfDay, format } from 'date-fns';
import { es } from 'date-fns/locale';

type RenewCreditFormProps = {
  clienteId: string;
  oldCreditId: string;
  onFormSubmit: () => void;
};

export function RenewCreditForm({ clienteId, oldCreditId, onFormSubmit }: RenewCreditFormProps) {
  const [step, setStep] = useState(1);
  const [isPending, setIsPending] = useState(false);
  const [newCreditId, setNewCreditId] = useState<string | null>(null);
  const [selectedDates, setSelectedDates] = useState<Date[]>([]);
  const [month, setMonth] = useState(new Date());

  const { toast } = useToast();
  const router = useRouter();

  const form = useForm<z.infer<typeof RenewCreditSchema>>({
    resolver: zodResolver(RenewCreditSchema),
    defaultValues: {
      clienteId,
      oldCreditId,
      creditAmount: "",
      installments: "",
    },
  });

  const handleCurrencyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (!value) {
      form.setValue('creditAmount', "");
      return;
    }
    const numberValue = parseInt(value.replace(/\D/g, ""), 10);
    if (isNaN(numberValue)) {
      form.setValue('creditAmount', "");
      return;
    }
    const formattedValue = new Intl.NumberFormat('es-CO').format(numberValue);
    form.setValue('creditAmount', formattedValue);
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
      } else {
          toast({ title: "Error", description: result.error, variant: "destructive" });
      }
      setIsPending(false);
  };


  const renderStepContent = () => {
    if (step === 1) {
      return (
        <>
          <FormField
              control={form.control}
              name="creditAmount"
              render={({ field }) => (
              <FormItem>
                  <FormLabel>Nuevo Valor del Crédito</FormLabel>
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
                <Button type="button" onClick={handleSaveSchedule} className="w-full bg-accent hover:bg-accent/90" disabled={isPending || selectedDates.length === 0}>
                    {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
                    {isPending ? 'Guardando...' : 'Finalizar Renovación'}
                </Button>
            </div>
        </>
      );
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
