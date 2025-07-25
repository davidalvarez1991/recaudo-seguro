
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Loader2, DollarSign, Save } from "lucide-react";
import { RenewCreditSchema } from "@/lib/schemas";
import { renewCredit } from "@/lib/actions";
import { useRouter } from "next/navigation";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

type RenewCreditFormProps = {
  clienteId: string;
  oldCreditId: string;
  onFormSubmit: () => void;
};

type PaymentFrequency = 'diario' | 'semanal' | 'quincenal' | 'mensual';


export function RenewCreditForm({ clienteId, oldCreditId, onFormSubmit }: RenewCreditFormProps) {
  const [isPending, setIsPending] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const form = useForm<z.infer<typeof RenewCreditSchema>>({
    resolver: zodResolver(RenewCreditSchema),
    defaultValues: {
      clienteId,
      oldCreditId,
      creditAmount: "",
      installments: "",
      paymentFrequency: "diario",
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
  
  const onSubmit = async (values: z.infer<typeof RenewCreditSchema>) => {
    setIsPending(true);
    const result = await renewCredit(values);
    
    if (result.success) {
      toast({
        title: "Crédito Renovado",
        description: "El nuevo crédito ha sido creado exitosamente.",
        className: "bg-accent text-accent-foreground border-accent",
      });
       if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('creditos-updated'));
      }
      onFormSubmit();
      router.refresh();
    } else {
      toast({
        title: "Error en la renovación",
        description: result.error || "No se pudo renovar el crédito.",
        variant: "destructive",
      });
    }
    setIsPending(false);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 pt-4">
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
        <FormField
          control={form.control}
          name="paymentFrequency"
          render={({ field }) => (
            <FormItem className="space-y-3">
              <FormLabel>Frecuencia de Pago</FormLabel>
              <FormControl>
                <RadioGroup
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  className="grid grid-cols-2 md:grid-cols-4 gap-4"
                  disabled={isPending}
                >
                  {(['diario', 'semanal', 'quincenal', 'mensual'] as PaymentFrequency[]).map((freq) => (
                    <FormItem key={freq} className="flex items-center space-x-3 space-y-0">
                      <FormControl>
                        <RadioGroupItem value={freq} />
                      </FormControl>
                      <FormLabel className="font-normal capitalize">
                        {freq}
                      </FormLabel>
                    </FormItem>
                  ))}
                </RadioGroup>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onFormSubmit} disabled={isPending}>
                Cancelar
            </Button>
            <Button type="submit" className="bg-accent hover:bg-accent/90" disabled={isPending}>
                {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                Renovar Crédito
            </Button>
        </div>
      </form>
    </Form>
  );
}
