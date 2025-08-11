

"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Calculator, RefreshCw } from 'lucide-react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { getProviderCommissionTiers } from '@/lib/actions';
import { differenceInMonths, addMonths } from 'date-fns';


const simulatorSchema = z.object({
  amount: z.string().min(1, 'El valor es requerido.'),
  installments: z.string().min(1, 'El número de cuotas es requerido.'),
  lateDays: z.string().optional(),
});

type SimulatorFormValues = z.infer<typeof simulatorSchema>;

type CommissionTier = {
  minAmount: number;
  maxAmount: number;
  percentage: number;
  lateInterestRate?: number;
};

type CreditSimulatorProps = {
  commissionTiers: CommissionTier[];
  isLateInterestActive: boolean;
};

type SimulationResult = {
    total: number;
    installment: number;
    baseAmount: number;
    commissionAmount: number;
    lateFee: number;
    appliedCommission: number;
    appliedLateRate: number;
};

const formatCurrency = (value: number) => {
    return `$${value.toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
};

const calculateCommissionAndLateRate = (
    amount: number, 
    tiers: CommissionTier[],
    isMonthly: boolean,
    installments: number,
): { commission: number; percentage: number, lateRate: number } => {
    if (!tiers || tiers.length === 0) {
        return { commission: amount * 0.20, percentage: 20, lateRate: 2 };
    }
    const sortedTiers = [...tiers].sort((a, b) => a.minAmount - b.minAmount);
    const applicableTier = sortedTiers.find(tier => amount >= tier.minAmount && amount <= tier.maxAmount);

    const percentage = applicableTier?.percentage || 20;
    const lateRate = applicableTier?.lateInterestRate || 0;
    
    // For the simulator, approximate months based on 30 days per installment.
    const durationMonths = isMonthly ? Math.ceil(installments / 30) : 1;
    const finalMonths = Math.max(1, durationMonths);

    return { 
        commission: amount * (percentage / 100) * finalMonths,
        percentage: percentage,
        lateRate: lateRate
    };
};


export function CreditSimulator({ commissionTiers, isLateInterestActive }: CreditSimulatorProps) {
  const [result, setResult] = useState<SimulationResult | null>(null);
  const [providerSettings, setProviderSettings] = useState<{ tiers: CommissionTier[], isMonthly: boolean }>({ tiers: [], isMonthly: false });

  useEffect(() => {
    const fetchSettings = async () => {
        const settings = await getProviderCommissionTiers();
        setProviderSettings(settings);
    };
    fetchSettings();
  }, []);

  const form = useForm<SimulatorFormValues>({
    resolver: zodResolver(simulatorSchema),
    defaultValues: {
      amount: '',
      installments: '',
      lateDays: '0',
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
    const lateDays = parseInt(data.lateDays || '0', 10);

    if (isNaN(amount) || isNaN(installments) || installments <= 0) {
      setResult(null);
      return;
    }

    const { commission: commissionAmount, percentage: appliedCommission, lateRate: appliedLateRate } = calculateCommissionAndLateRate(amount, providerSettings.tiers, providerSettings.isMonthly, installments);
    const baseTotal = amount + commissionAmount;
    
    let lateFee = 0;
    if (isLateInterestActive && lateDays > 0 && appliedLateRate > 0) {
        const dailyRate = appliedLateRate / 100;
        lateFee = amount * dailyRate * lateDays;
    }
    
    const totalToPay = baseTotal + lateFee;
    const installmentAmount = totalToPay / installments;

    setResult({
      total: totalToPay,
      installment: installmentAmount,
      baseAmount: amount,
      commissionAmount: commissionAmount,
      lateFee: lateFee,
      appliedCommission: appliedCommission,
      appliedLateRate: appliedLateRate,
    });
  };

  const handleReset = () => {
    form.reset({amount: '', installments: '', lateDays: '0'});
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
                 {isLateInterestActive && (
                    <FormField
                        control={form.control}
                        name="lateDays"
                        render={({ field }) => (
                            <FormItem>
                                <Label htmlFor="sim-late-days">Días de Mora (Opcional)</Label>
                                <FormControl>
                                    <Input 
                                        id="sim-late-days" 
                                        type="number" 
                                        placeholder="0" 
                                        {...field} 
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                )}
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
                <div className={`grid grid-cols-1 ${result.lateFee > 0 ? 'sm:grid-cols-3' : 'sm:grid-cols-2'} gap-4 text-center`}>
                    <div className="p-3 bg-muted rounded-md">
                        <p className="text-sm text-muted-foreground">Valor por Cuota</p>
                        <p className="text-2xl font-bold text-primary">{formatCurrency(result.installment)}</p>
                    </div>
                     <div className="p-3 bg-muted rounded-md">
                        <p className="text-sm text-muted-foreground">Valor Total a Pagar</p>
                        <p className="text-2xl font-bold text-primary">{formatCurrency(result.total)}</p>
                    </div>
                     {result.lateFee > 0 && (
                        <div className="p-3 bg-red-100 dark:bg-red-900/50 rounded-md">
                            <p className="text-sm text-red-800 dark:text-red-200">Valor por Mora</p>
                            <p className="text-2xl font-bold text-destructive">{formatCurrency(result.lateFee)}</p>
                        </div>
                    )}
                </div>
                <div className="text-xs text-muted-foreground space-y-1 text-center border-t pt-2 mt-2">
                    <p>Desglose: {formatCurrency(result.baseAmount)} (Capital) + {formatCurrency(result.commissionAmount)} (Comisión) + {formatCurrency(result.lateFee)} (Mora)</p>
                    <p>
                        Cálculo basado en una comisión del {result.appliedCommission}%{providerSettings.isMonthly ? ' mensual' : ''} y un interés de mora del {result.appliedLateRate}% diario.
                    </p>
                </div>
            </div>
        )}

      </CardContent>
    </Card>
  );
}

    