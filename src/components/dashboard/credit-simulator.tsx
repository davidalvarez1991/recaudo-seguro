
"use client";

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Calculator, RefreshCw } from 'lucide-react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';

const simulatorSchema = z.object({
  amount: z.string().min(1, 'El valor es requerido.'),
  installments: z.string().min(1, 'El número de cuotas es requerido.'),
});

type SimulatorFormValues = z.infer<typeof simulatorSchema>;

type CreditSimulatorProps = {
  commissionPercentage: number;
};

const formatCurrency = (value: number) => {
    return `$${value.toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
};

export function CreditSimulator({ commissionPercentage }: CreditSimulatorProps) {
  const [result, setResult] = useState<{ total: number; installment: number } | null>(null);

  const form = useForm<SimulatorFormValues>({
    resolver: zodResolver(simulatorSchema),
    defaultValues: {
      amount: '',
      installments: '',
    },
  });

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const numberValue = parseInt(value.replace(/\D/g, ''), 10);
    if (isNaN(numberValue)) {
      form.setValue('amount', '');
      return;
    }
    form.setValue('amount', new Intl.NumberFormat('es-CO').format(numberValue));
  };
  
  const onSubmit = (data: SimulatorFormValues) => {
    const amount = parseFloat(data.amount.replace(/\./g, ''));
    const installments = parseInt(data.installments, 10);

    if (isNaN(amount) || isNaN(installments) || installments <= 0) {
      setResult(null);
      return;
    }

    const totalToPay = amount * (1 + commissionPercentage / 100);
    const installmentAmount = totalToPay / installments;

    setResult({
      total: totalToPay,
      installment: installmentAmount,
    });
  };

  const handleReset = () => {
    form.reset({amount: '', installments: ''});
    setResult(null);
  }

  return (
    <Card className="bg-muted/30 border-dashed">
      <CardContent className="pt-6">
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-4">
                     <FormField
                        control={form.control}
                        name="amount"
                        render={({ field }) => (
                            <FormItem>
                                <Label htmlFor="sim-amount">Valor a Prestar</Label>
                                <FormControl>
                                    <Input 
                                        id="sim-amount" 
                                        placeholder="1.000.000" 
                                        {...field}
                                        onChange={handleAmountChange}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="installments"
                        render={({ field }) => (
                            <FormItem>
                                <Label htmlFor="sim-installments">Número de Cuotas</Label>
                                <FormControl>
                                    <Input 
                                        id="sim-installments" 
                                        type="number" 
                                        placeholder="12" 
                                        {...field} 
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                    <Button type="submit" className="w-full sm:w-auto">
                        <Calculator className="mr-2 h-4 w-4" />
                        Calcular
                    </Button>
                     <Button type="button" variant="outline" onClick={handleReset} className="w-full sm:w-auto">
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Limpiar
                    </Button>
                </div>
            </form>
        </Form>

        {result && (
            <div className="mt-6 space-y-4 rounded-lg border border-primary/20 bg-background p-4">
                 <h4 className="text-lg font-semibold text-center">Resultado de la Simulación</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-center">
                    <div className="p-3 bg-muted rounded-md">
                        <p className="text-sm text-muted-foreground">Valor por Cuota</p>
                        <p className="text-2xl font-bold text-primary">{formatCurrency(result.installment)}</p>
                    </div>
                     <div className="p-3 bg-muted rounded-md">
                        <p className="text-sm text-muted-foreground">Valor Total a Pagar</p>
                        <p className="text-2xl font-bold text-primary">{formatCurrency(result.total)}</p>
                    </div>
                </div>
                 <p className="text-xs text-center text-muted-foreground pt-2">
                    Cálculo basado en una comisión del {commissionPercentage}%. Este valor es una simulación y puede estar sujeto a otros cargos.
                </p>
            </div>
        )}

      </CardContent>
    </Card>
  );
}
