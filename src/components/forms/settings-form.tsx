

"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Save, Percent, Trash2, PlusCircle, DollarSign, Loader2, Type, FileText, PiggyBank, TrendingUp, RefreshCcw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { getUserData, saveProviderSettings, getProviderFinancialSummary, reinvestCommission } from "@/lib/actions";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useRouter } from "next/navigation";

const defaultContractTemplate = `CONTRATO DE PRÉSTAMO CON GARANTÍA DE EMBARGO DE BIENES MUEBLES
Entre los suscritos a saber:

1. PRESTAMISTA: “NOMBRE DE LA EMPRESA”, quien en adelante se denominará EL ACREEDOR.

2. DEUDOR: “NOMBRE DEL CLIENTE” mayor de edad, identificado con cédula de ciudadanía No. “CEDULA DEL CLIENTE” de “CIUDAD”, quien en adelante se denominará EL DEUDOR.

Se celebra el presente contrato de préstamo, el cual se regirá por las siguientes cláusulas:

PRIMERA - Objeto del contrato

EL ACREEDOR entrega en calidad de préstamo la suma de “VALOR PRESTAMO” pesos colombianos a EL DEUDOR, quien se obliga a pagar dicha suma en los términos y condiciones establecidos en este contrato.

SEGUNDA - Plazo y forma de pago

EL DEUDOR se compromete a pagar el préstamo en un plazo de “CUOTAS DEL CREDITO” cuotas a partir del día “DIA DONDE EL COBRADOR SELECIONA EL PAGO DE LA CUOTA”, mediante pagos “DIAS DEL RECAUDO” de $ “VALOR DE LA CUOTA”, hasta completar el capital más los intereses pactados.

TERCERA - Intereses

El préstamo generará un interés mensual del “INTERES”%, que será sumado al capital al momento del cálculo de la deuda total. El interés se calcula de forma [simple/compuesta] y debe ser cancelado dentro del mismo calendario pactado.

CUARTA - Mora

En caso de incumplimiento en los pagos, EL DEUDOR incurrirá en mora, sin necesidad de requerimiento judicial o extrajudicial. A partir de ese momento, la totalidad del préstamo se considerará vencido y exigible.

QUINTA - Garantía y embargo

EL DEUDOR autoriza expresamente a EL ACREEDOR a realizar el embargo de uno o varios bienes muebles de su propiedad, los cuales cubrirán el valor total de la deuda, incluyendo el capital, los intereses ordinarios y moratorios, y cualquier otro gasto derivado del cobro.

Los bienes susceptibles de embargo podrán ser muebles como electrodomésticos, motocicletas, celulares, herramientas u otros que, según avaluación razonable, suplan el valor de la deuda.

EL DEUDOR se compromete a permitir el ingreso del ACREEDOR o su representante a su domicilio para el retiro de dichos bienes si se presenta incumplimiento mayor a “15” días.

SEXTA - Aceptación y firma

Las partes declaran haber leído y comprendido todas las cláusulas del presente contrato, aceptándolo en su integridad.`;


type CommissionTier = {
  minAmount: number | undefined;
  maxAmount: number | undefined;
  percentage: number | undefined;
  lateInterestRate: number | undefined;
};

type SettingsFormProps = {
  providerId: string;
};

const formatCurrencyForInput = (value: number | string | undefined): string => {
    if (value === undefined || value === null || value === "") return "";
    if (typeof value === 'number') {
        value = value.toString();
    }
    const numberValue = parseInt(value.replace(/\D/g, ''), 10);
    if (isNaN(numberValue)) return "";
    return new Intl.NumberFormat('es-CO', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(numberValue);
};

export function SettingsForm({ providerId }: SettingsFormProps) {
  const [baseCapital, setBaseCapital] = useState("");
  const [collectedCommission, setCollectedCommission] = useState(0);
  const [commissionTiers, setCommissionTiers] = useState<CommissionTier[] | null>(null);
  const [isLateInterestActive, setIsLateInterestActive] = useState(false);
  const [isMonthlyInterest, setIsMonthlyInterest] = useState(false);
  const [isContractGenerationActive, setIsContractGenerationActive] = useState(false);
  const [contractTemplate, setContractTemplate] = useState(defaultContractTemplate);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isReinvesting, setIsReinvesting] = useState(false);
  const [reinvestAmount, setReinvestAmount] = useState("");
  const router = useRouter();

  const { toast } = useToast();

  const fetchProviderData = async () => {
      if (!providerId) return;
      setIsLoading(true);
      try {
        const [userData, financialSummary] = await Promise.all([
            getUserData(providerId),
            getProviderFinancialSummary()
        ]);
        
        if (userData) {
          setBaseCapital(formatCurrencyForInput(userData.baseCapital || 0));
          setIsLateInterestActive(userData.isLateInterestActive || false);
          setIsMonthlyInterest(userData.isMonthlyInterest || false);
          setIsContractGenerationActive(userData.isContractGenerationActive || false);
          setContractTemplate(userData.contractTemplate || defaultContractTemplate);
          
          if (userData.commissionTiers && userData.commissionTiers.length > 0) {
              setCommissionTiers(userData.commissionTiers);
          } else {
              setCommissionTiers([{ minAmount: undefined, maxAmount: undefined, percentage: undefined, lateInterestRate: undefined }]);
          }
        }
        
        if (financialSummary) {
            setCollectedCommission(financialSummary.collectedCommission);
        }

      } catch (error) {
        toast({ title: "Error", description: "No se pudieron cargar los datos de configuración.", variant: "destructive" });
      } finally {
        setIsLoading(false);
      }
    };

  useEffect(() => {
    fetchProviderData();
  }, [providerId]);
  

  const handleCommissionTierChange = (index: number, field: keyof CommissionTier, value: string) => {
    if (!commissionTiers) return;
    const numericValue = parseFloat(value.replace(/,/g, '.').replace(/[^\d.-]/g, ''));
    
    const newTiers = [...commissionTiers];
    newTiers[index] = { ...newTiers[index], [field]: isNaN(numericValue) ? undefined : numericValue };
    setCommissionTiers(newTiers);
  };

  const handleCurrencyTierChange = (index: number, field: 'minAmount' | 'maxAmount', value: string) => {
    if (!commissionTiers) return;
    const formattedValue = formatCurrencyForInput(value);
    const numericValue = parseInt(formattedValue.replace(/\D/g, ''), 10);
    
    const newTiers = [...commissionTiers];
    newTiers[index] = { ...newTiers[index], [field]: isNaN(numericValue) ? undefined : numericValue };
    setCommissionTiers(newTiers);
  }

  const addCommissionTier = () => {
    if (!commissionTiers) return;
    if (commissionTiers.length < 4) {
      setCommissionTiers([...commissionTiers, { minAmount: undefined, maxAmount: undefined, percentage: undefined, lateInterestRate: undefined }]);
    } else {
      toast({ title: "Límite alcanzado", description: "Puedes configurar un máximo de 4 tramos de comisión.", variant: "destructive" });
    }
  };

  const removeCommissionTier = (index: number) => {
    if (!commissionTiers) return;
    if (commissionTiers.length > 1) {
        const newTiers = commissionTiers.filter((_, i) => i !== index);
        setCommissionTiers(newTiers);
    } else {
        toast({ title: "Acción no permitida", description: "Debe haber al menos un tramo de comisión.", variant: "destructive" });
    }
  };
  
  const handleSaveAllSettings = async () => {
    if (!commissionTiers) return;
    setIsSaving(true);
    try {
        for (const tier of commissionTiers) {
            if ((tier.minAmount ?? 0) >= (tier.maxAmount ?? Infinity) && (tier.maxAmount !== 0 && tier.maxAmount !== undefined)) {
                toast({ title: "Error de validación", description: `En un tramo, el monto mínimo (${formatCurrencyForInput(tier.minAmount)}) debe ser menor que el máximo (${formatCurrencyForInput(tier.maxAmount)}).`, variant: "destructive" });
                return;
            }
            if (tier.percentage === undefined || tier.percentage <= 0 || tier.percentage > 100) {
                toast({ title: "Error de validación", description: `El porcentaje de comisión (${tier.percentage}%) debe estar entre 1 y 100.`, variant: "destructive" });
                return;
            }
             if (isLateInterestActive && (tier.lateInterestRate === undefined || tier.lateInterestRate < 0 || tier.lateInterestRate > 100)) {
                toast({ title: "Error de validación", description: `El interés de mora (${tier.lateInterestRate}%) debe estar entre 0 y 100.`, variant: "destructive" });
                return;
            }
        }

        const numericBaseCapital = parseInt(baseCapital.replace(/\D/g, ''), 10) || 0;
    
        const settingsToSave = {
            baseCapital: numericBaseCapital,
            commissionTiers: commissionTiers.map(tier => ({...tier, lateInterestRate: isLateInterestActive ? tier.lateInterestRate : 0 })),
            isLateInterestActive,
            isMonthlyInterest,
            isContractGenerationActive,
            contractTemplate
        };

        const result = await saveProviderSettings(providerId, settingsToSave);
        if (result.success) {
          toast({
            title: "Configuración Guardada",
            description: "Tus ajustes se han guardado correctamente.",
            variant: "default",
            className: "bg-accent text-accent-foreground border-accent",
          });
          router.refresh();
        } else {
           toast({ title: "Error", description: result.error, variant: "destructive" });
        }
    } finally {
        setIsSaving(false);
    }
  };
  
  const handleReinvest = async () => {
      const amountToReinvest = parseFloat(reinvestAmount.replace(/\D/g, '')) || 0;

      if (amountToReinvest <= 0) {
          toast({ title: "Monto inválido", description: "Ingresa un monto válido para reinvertir.", variant: "destructive" });
          return;
      }
      
      if (amountToReinvest > collectedCommission) {
           toast({ title: "Monto excede lo disponible", description: `No puedes reinvertir más de ${formatCurrencyForInput(collectedCommission)}.`, variant: "destructive" });
           return;
      }

      setIsReinvesting(true);
      try {
        const result = await reinvestCommission(amountToReinvest);
        if (result.success) {
             toast({
                title: "Reinversión Exitosa",
                description: `${formatCurrencyForInput(result.reinvestedAmount)} han sido añadidos a tu capital base.`,
                className: "bg-accent text-accent-foreground border-accent",
            });
            await fetchProviderData(); // Refresh all data on the page
            setReinvestAmount(""); // Clear input
            router.refresh();
        } else {
            toast({ title: "Error", description: result.error, variant: "destructive" });
        }

      } catch(e) {
          toast({ title: "Error del servidor", description: "No se pudo completar la reinversión.", variant: "destructive" });
      } finally {
        setIsReinvesting(false);
      }
  }


  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-48">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8 pt-6">
      
      <Card className="border-dashed">
        <CardHeader>
          <CardTitle>Gestión de Capital</CardTitle>
          <CardDescription>
            Establece el monto total de tu capital para prestar. Este valor será la base para el contador "Mi Capital Total" en tu panel principal.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="base-capital">Capital Base para Prestar</Label>
            <div className="relative">
              <PiggyBank className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="base-capital"
                value={baseCapital}
                onChange={(e) => setBaseCapital(formatCurrencyForInput(e.target.value))}
                className="pl-8"
                placeholder="10.000.000"
                disabled={isSaving}
              />
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card className="border-dashed">
        <CardHeader>
          <CardTitle>Reinvertir Ganancias</CardTitle>
          <CardDescription>
            Añade las ganancias de tus comisiones recaudadas a tu capital base para aumentar tu capacidad de préstamo.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
            <div className="space-y-2">
                 <Label>Ganancia de Comisión Disponible</Label>
                 <div className="flex items-center gap-2 p-3 rounded-md bg-green-50 dark:bg-green-900/30 border border-green-200">
                    <TrendingUp className="h-6 w-6 text-green-600"/>
                    <p className="text-2xl font-bold text-green-700">{formatCurrencyForInput(collectedCommission)}</p>
                 </div>
            </div>
            <div className="space-y-2">
                <Label htmlFor="reinvest-amount">Monto a Reinvertir</Label>
                <div className="relative">
                    <DollarSign className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        id="reinvest-amount"
                        value={reinvestAmount}
                        onChange={(e) => setReinvestAmount(formatCurrencyForInput(e.target.value))}
                        className="pl-8"
                        placeholder="Ej: 50.000"
                        disabled={isReinvesting || collectedCommission <= 0}
                    />
                </div>
            </div>
             <Button onClick={handleReinvest} disabled={isReinvesting || collectedCommission <= 0}>
                {isReinvesting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <PlusCircle className="mr-2 h-4 w-4" />}
                Añadir Ganancias al Capital
             </Button>
        </CardContent>
      </Card>

      <Separator />

      <Card className="border-dashed">
        <CardHeader>
          <CardTitle>Fórmula de Comisión por Tramos</CardTitle>
          <CardDescription>
            Define hasta 4 rangos de comisión diferentes según el monto del préstamo.
            El sistema aplicará automáticamente el porcentaje correspondiente. <b className="text-destructive">Recuerda no sobrepasar la tasa de usura definido por nuestro país.</b>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
            <div className="flex items-center justify-between rounded-lg border p-4 my-4">
              <div className="space-y-0.5">
                <Label htmlFor="monthly-interest-switch" className="text-base font-semibold">Activar Interés Mensual</Label>
                <p className="text-sm text-muted-foreground">
                  Calcula la comisión por cada mes de duración del crédito.
                </p>
              </div>
              <Switch
                id="monthly-interest-switch"
                checked={isMonthlyInterest}
                onCheckedChange={setIsMonthlyInterest}
              />
            </div>
           <div className="flex items-center justify-between rounded-lg border p-4 my-4">
              <div className="space-y-0.5">
                <Label htmlFor="late-interest-switch" className="text-base font-semibold">Activar Interés por Mora</Label>
                <p className="text-sm text-muted-foreground">
                  Habilita o deshabilita el cálculo automático.
                </p>
              </div>
              <Switch
                id="late-interest-switch"
                checked={isLateInterestActive}
                onCheckedChange={setIsLateInterestActive}
              />
            </div>
            
          {!commissionTiers ? (
             <div className="flex items-center justify-center h-24">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                <p className="ml-2">Cargando tramos...</p>
             </div>
          ) : (
            <>
                {commissionTiers.map((tier, index) => (
                <div key={index} className="flex flex-col md:flex-row items-center gap-4 border p-4 rounded-lg relative">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 flex-1 w-full">
                    <div className="space-y-2">
                      <Label htmlFor={`min-amount-${index}`}>Monto Mínimo</Label>
                      <div className="relative">
                        <DollarSign className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id={`min-amount-${index}`}
                          value={formatCurrencyForInput(tier.minAmount)}
                          onChange={(e) => handleCurrencyTierChange(index, 'minAmount', e.target.value)}
                          className="pl-8"
                          placeholder="0"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`max-amount-${index}`}>Monto Máximo</Label>
                      <div className="relative">
                        <DollarSign className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id={`max-amount-${index}`}
                          value={formatCurrencyForInput(tier.maxAmount)}
                          onChange={(e) => handleCurrencyTierChange(index, 'maxAmount', e.target.value)}
                          className="pl-8"
                          placeholder="500.000"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`percentage-${index}`}>Comisión (%)</Label>
                      <div className="relative">
                        <Input
                          id={`percentage-${index}`}
                          type="number"
                          value={tier.percentage === undefined ? "" : tier.percentage}
                          onChange={(e) => handleCommissionTierChange(index, 'percentage', e.target.value)}
                          className="pr-8"
                          placeholder="20"
                        />
                        <Percent className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      </div>
                    </div>
                     <div className="space-y-2">
                      <Label htmlFor={`late-rate-${index}`}>Interés Mora Diario (%)</Label>
                      <div className="relative">
                        <Input
                          id={`late-rate-${index}`}
                          type="number"
                          value={tier.lateInterestRate === undefined ? "" : tier.lateInterestRate}
                          onChange={(e) => handleCommissionTierChange(index, 'lateInterestRate', e.target.value)}
                          className="pr-8"
                          placeholder="2"
                           disabled={!isLateInterestActive}
                        />
                        <Percent className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeCommissionTier(index)}
                    className="text-destructive hover:bg-destructive/10 absolute -top-3 -right-3 sm:relative sm:top-auto sm:right-auto"
                    disabled={commissionTiers.length <= 1}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <div className="flex flex-col sm:flex-row gap-2 pt-4">
                <Button onClick={addCommissionTier} variant="outline" className="w-full sm:w-auto" disabled={commissionTiers.length >= 4}>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Añadir Tramo
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
      
       <Separator />

      <Card className="border-dashed">
        <CardHeader>
          <CardTitle>Generación de Contratos</CardTitle>
          <CardDescription>
            Activa esta función para generar un contrato automáticamente por cada crédito nuevo o renovado.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
           <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <Label htmlFor="contract-switch" className="text-base font-semibold">Activar Generación de Contratos</Label>
                <p className="text-sm text-muted-foreground">
                  Se creará un documento en la sección 'Contratos' del cliente.
                </p>
              </div>
              <Switch
                id="contract-switch"
                checked={isContractGenerationActive}
                onCheckedChange={setIsContractGenerationActive}
              />
            </div>

            <div className="space-y-2">
                <Label htmlFor="contract-template">Plantilla del Contrato</Label>
                 <Textarea
                    id="contract-template"
                    placeholder="Pega aquí tu plantilla de contrato..."
                    className="min-h-96 font-mono text-sm"
                    value={contractTemplate}
                    onChange={(e) => setContractTemplate(e.target.value)}
                    disabled={!isContractGenerationActive}
                />
                <p className="text-xs text-muted-foreground">
                    Puedes editar este contrato, agregar o quitar cláusulas. Los marcadores como “NOMBRE DEL CLIENTE” o “VALOR PRESTAMO” se reemplazarán automáticamente y no deben ser modificados.
                </p>
            </div>
        </CardContent>
      </Card>


       <Separator />

      <div className="flex justify-end">
        <Button onClick={handleSaveAllSettings} disabled={isSaving}>
            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            {isSaving ? 'Guardando...' : 'Guardar Toda la Configuración'}
        </Button>
      </div>

    </div>
  );
}
