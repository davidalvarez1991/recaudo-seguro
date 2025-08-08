
"use client";

import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Loader2, DollarSign, Save, StepForward, CheckCircle2, ShieldCheck } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ClientCreditSchema } from "@/lib/schemas";
import { createClientCreditAndContract, getContractForAcceptance, getProviderCommissionTiers } from "@/lib/actions";
import { Progress } from "@/components/ui/progress";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { Calendar } from "@/components/ui/calendar";
import { startOfDay, format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Badge } from "@/components/ui/badge";

type ClientRegistrationFormProps = {
  onFormSubmit?: () => void;
};

type FormData = z.infer<typeof ClientCreditSchema>;

type CommissionTier = {
  minAmount: number;
  maxAmount: number;
  percentage: number;
};

const step1Fields: (keyof FormData)[] = [
    "idNumber", "firstName", "secondName", "firstLastName", "secondLastName",
    "address", "contactPhone", "creditAmount", "installments", "requiresGuarantor",
    "requiresReferences"
];
const step1GuarantorFields: (keyof FormData)[] = ["guarantor.name", "guarantor.idNumber", "guarantor.address", "guarantor.phone"];
const step1ReferencesFields: (keyof FormData)[] = [
    "references.familiar.name", "references.familiar.phone", "references.familiar.address",
    "references.personal.name", "references.personal.phone", "references.personal.address"
];


export function ClientRegistrationForm({ onFormSubmit }: ClientRegistrationFormProps) {
  const [step, setStep] = useState(1);
  const [isPending, setIsPending] = useState(false);
  
  const [formData, setFormData] = useState<Partial<FormData>>({});
  const [selectedDates, setSelectedDates] = useState<Date[]>([]);
  const [month, setMonth] = useState(new Date());
  const [contractText, setContractText] = useState<string | null>(null);
  const [commissionTiers, setCommissionTiers] = useState<CommissionTier[]>([]);

  const { toast } = useToast();

  useEffect(() => {
    const fetchTiers = async () => {
        const tiers = await getProviderCommissionTiers();
        setCommissionTiers(tiers);
    };
    fetchTiers();
  }, []);

  const form = useForm<FormData>({
    resolver: zodResolver(ClientCreditSchema),
    defaultValues: {
      idNumber: "",
      firstName: "",
      secondName: "",
      firstLastName: "",
      secondLastName: "",
      address: "",
      contactPhone: "",
      creditAmount: "",
      installments: "",
      requiresGuarantor: false,
      guarantor: {
        name: "",
        idNumber: "",
        address: "",
        phone: ""
      },
      requiresReferences: false,
      references: {
        familiar: { name: "", phone: "", address: "" },
        personal: { name: "", phone: "", address: "" }
      }
    },
    mode: "onChange"
  });

  const requiresGuarantor = form.watch('requiresGuarantor');
  const requiresReferences = form.watch('requiresReferences');

  const formatCurrency = (value: string) => {
    if (!value) return "";
    const numberValue = parseInt(value.replace(/\D/g, ""), 10);
    if (isNaN(numberValue)) return "";
    return new Intl.NumberFormat('es-CO').format(numberValue);
  };

  const handleCurrencyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const formattedValue = formatCurrency(value);
    form.setValue('creditAmount', formattedValue);
  };
  
  const handleNextStep = async (currentStep: number, nextStep: number) => {
    let fieldsToValidate = step1Fields;
    if (form.getValues('requiresGuarantor')) {
      fieldsToValidate = [...fieldsToValidate, ...step1GuarantorFields];
    }
     if (form.getValues('requiresReferences')) {
      fieldsToValidate = [...fieldsToValidate, ...step1ReferencesFields];
    }
    
    const isValid = await form.trigger(fieldsToValidate as any);
    if (!isValid) return;
    
    setFormData(prev => ({ ...prev, ...form.getValues() }));
    setStep(nextStep);
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
            // Revert to the previous valid state
            setSelectedDates(prevDates => prevDates);
            return;
        }

        setSelectedDates(validDates.sort((a,b) => a.getTime() - b.getTime()));
    };

    const calculateCommission = (amount: number, tiers: CommissionTier[]): { commission: number; percentage: number } => {
        if (!tiers || tiers.length === 0) {
            return { commission: amount * 0.20, percentage: 20 };
        }
        const sortedTiers = [...tiers].sort((a, b) => a.minAmount - b.minAmount);
        const applicableTier = sortedTiers.find(tier => amount >= tier.minAmount && amount <= tier.maxAmount);

        if (applicableTier) {
            return { commission: amount * (applicableTier.percentage / 100), percentage: applicableTier.percentage };
        }
        const fallbackPercentage = sortedTiers[0]?.percentage || 20;
        return { commission: amount * (fallbackPercentage / 100), percentage: fallbackPercentage };
    };

    const goToContractStep = async () => {
        const currentFormData = { ...formData, ...form.getValues() };
        if (selectedDates.length === 0) {
            toast({ title: "Fechas requeridas", description: "Debes seleccionar las fechas de pago.", variant: "destructive" });
            return;
        }

        const installments = parseInt(currentFormData.installments || '0', 10);
        if (selectedDates.length !== installments) {
            toast({ title: "Fechas no coinciden", description: `Debes seleccionar exactamente ${installments} fechas. Has seleccionado ${selectedDates.length}.`, variant: "destructive" });
            return;
        }

        setIsPending(true);
        try {
            const fullName = [currentFormData.firstName, currentFormData.secondName, currentFormData.firstLastName, currentFormData.secondLastName].filter(Boolean).join(" ");
            const creditValue = parseFloat(currentFormData.creditAmount?.replace(/\./g, '') || '0');
            const { commission, percentage } = calculateCommission(creditValue, commissionTiers);

            const contractData = await getContractForAcceptance({
                creditData: {
                    valor: creditValue,
                    cuotas: installments,
                    commission: commission,
                    commissionPercentage: percentage
                },
                clienteData: {
                    name: fullName,
                    idNumber: currentFormData.idNumber!,
                    city: 'N/A', 
                },
                paymentDates: selectedDates.map(d => d.toISOString())
            });

            if (contractData.contractText) {
                setContractText(contractData.contractText);
                setStep(3);
            } else {
                toast({ title: "Error", description: "No se pudo generar el contrato. Revisa la configuración del proveedor.", variant: "destructive"});
            }
        } catch(e) {
             toast({ title: "Error de red", description: "No se pudo generar el contrato.", variant: "destructive"});
        } finally {
            setIsPending(false);
        }
    };


    const handleFinalSubmit = async () => {
        setIsPending(true);
        const finalData = { ...formData, ...form.getValues() };
        
        try {
            const result = await createClientCreditAndContract({
                clientData: finalData,
                paymentDates: selectedDates.map(d => d.toISOString())
            });
            
            if (result.success) {
                toast({
                    title: "Registro Finalizado",
                    description: "El cliente, su crédito y contrato han sido creados exitosamente.",
                    variant: "default",
                    className: "bg-accent text-accent-foreground border-accent",
                });
                if (typeof window !== 'undefined') {
                    window.dispatchEvent(new CustomEvent('creditos-updated'));
                }
                onFormSubmit?.();
            } else {
                toast({ title: "Error en el registro", description: result.error, variant: "destructive" });
            }
        } catch (e) {
            toast({ title: "Error de red", description: "No se pudo conectar con el servidor.", variant: "destructive" });
        } finally {
            setIsPending(false);
        }
    }
    
  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <>
            <ScrollArea className="h-96 w-full pr-6">
              <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="idNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Número de Cédula</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="123456789" disabled={isPending} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                     <FormField
                        control={form.control}
                        name="firstName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Primer Nombre</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="John" disabled={isPending} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="secondName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Segundo Nombre</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="(Opcional)" disabled={isPending} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="firstLastName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Primer Apellido</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="Doe" disabled={isPending} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="secondLastName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Segundo Apellido</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="(Opcional)" disabled={isPending} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                  </div>
                  <FormField
                    control={form.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Dirección de Domicilio</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Carrera 5 # 10-20" disabled={isPending} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="contactPhone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Teléfono de Contacto</FormLabel>
                        <FormControl>
                          <Input {...field} type="tel" placeholder="3001234567" disabled={isPending} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Separator className="my-6" />
                  
                  <FormField
                      control={form.control}
                      name="requiresGuarantor"
                      render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                              <div className="space-y-0.5">
                                  <FormLabel>¿Requiere Fiador?</FormLabel>
                              </div>
                              <FormControl>
                                  <Switch
                                      checked={field.value}
                                      onCheckedChange={field.onChange}
                                      disabled={isPending}
                                  />
                              </FormControl>
                          </FormItem>
                      )}
                  />
                  {requiresGuarantor && (
                      <div className="space-y-4 p-4 border rounded-lg">
                        <h4 className="font-semibold text-md">Información del Fiador</h4>
                         <FormField
                            control={form.control}
                            name="guarantor.name"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Nombre Completo del Fiador</FormLabel>
                                <FormControl>
                                    <Input {...field} placeholder="Nombre del fiador" disabled={isPending} />
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                         <FormField
                            control={form.control}
                            name="guarantor.idNumber"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Cédula del Fiador</FormLabel>
                                <FormControl>
                                    <Input {...field} placeholder="Cédula del fiador" disabled={isPending} />
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="guarantor.address"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Dirección del Fiador</FormLabel>
                                <FormControl>
                                    <Input {...field} placeholder="Dirección del fiador" disabled={isPending} />
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                         <FormField
                            control={form.control}
                            name="guarantor.phone"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Teléfono del Fiador</FormLabel>
                                <FormControl>
                                    <Input {...field} type="tel" placeholder="Teléfono del fiador" disabled={isPending} />
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                      </div>
                  )}

                  <FormField
                      control={form.control}
                      name="requiresReferences"
                      render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                              <div className="space-y-0.5">
                                  <FormLabel>¿Requiere Referencias?</FormLabel>
                              </div>
                              <FormControl>
                                  <Switch
                                      checked={field.value}
                                      onCheckedChange={field.onChange}
                                      disabled={isPending}
                                  />
                              </FormControl>
                          </FormItem>
                      )}
                  />
                  {requiresReferences && (
                      <div className="space-y-6 pt-2">
                          <div className="space-y-4 p-4 border rounded-lg">
                            <h4 className="font-semibold text-md">Referencia Familiar</h4>
                            <FormField
                                control={form.control}
                                name="references.familiar.name"
                                render={({ field }) => (
                                    <FormItem>
                                    <FormLabel>Nombre</FormLabel>
                                    <FormControl>
                                        <Input {...field} placeholder="Nombre completo del familiar" disabled={isPending} />
                                    </FormControl>
                                    <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="references.familiar.phone"
                                render={({ field }) => (
                                    <FormItem>
                                    <FormLabel>Número telefónico</FormLabel>
                                    <FormControl>
                                        <Input {...field} type="tel" placeholder="Teléfono del familiar" disabled={isPending} />
                                    </FormControl>
                                    <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="references.familiar.address"
                                render={({ field }) => (
                                    <FormItem>
                                    <FormLabel>Dirección</FormLabel>
                                    <FormControl>
                                        <Input {...field} placeholder="Dirección del familiar" disabled={isPending} />
                                    </FormControl>
                                    <FormMessage />
                                    </FormItem>
                                )}
                            />
                          </div>

                          <div className="space-y-4 p-4 border rounded-lg">
                            <h4 className="font-semibold text-md">Referencia Personal</h4>
                             <FormField
                                control={form.control}
                                name="references.personal.name"
                                render={({ field }) => (
                                    <FormItem>
                                    <FormLabel>Nombre</FormLabel>
                                    <FormControl>
                                        <Input {...field} placeholder="Nombre completo del conocido" disabled={isPending} />
                                    </FormControl>
                                    <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="references.personal.phone"
                                render={({ field }) => (
                                    <FormItem>
                                    <FormLabel>Número telefónico</FormLabel>
                                    <FormControl>
                                        <Input {...field} type="tel" placeholder="Teléfono del conocido" disabled={isPending} />
                                    </FormControl>
                                    <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="references.personal.address"
                                render={({ field }) => (
                                    <FormItem>
                                    <FormLabel>Dirección</FormLabel>
                                    <FormControl>
                                        <Input {...field} placeholder="Dirección del conocido" disabled={isPending} />
                                    </FormControl>
                                    <FormMessage />
                                    </FormItem>
                                )}
                            />
                          </div>
                      </div>
                  )}

                  <Separator className="my-6" />
                  <FormField
                    control={form.control}
                    name="creditAmount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Valor del Crédito</FormLabel>
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
              </div>
            </ScrollArea>
            <Button type="button" onClick={() => handleNextStep(1, 2)} className="w-full mt-4" disabled={isPending}>
              {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              {isPending ? "Guardando..." : "Siguiente"}
            </Button>
          </>
        );
      case 2:
        return (
            <>
                <div className="space-y-4">
                    <div className="flex justify-between items-center">
                        <div className="space-y-1">
                            <Label>Seleccionar Fechas de Pago</Label>
                            <p className="text-sm text-muted-foreground">
                                Haz clic en los días para establecer el cronograma.
                            </p>
                        </div>
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
                 <div className="flex gap-2 mt-6">
                    <Button type="button" variant="outline" onClick={() => setStep(1)} className="w-full" disabled={isPending}>
                        Volver
                    </Button>
                    <Button type="button" onClick={goToContractStep} className="w-full" disabled={isPending || selectedDates.length === 0}>
                        {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
                        {isPending ? 'Generando...' : 'Siguiente'}
                    </Button>
                </div>
            </>
        );
      case 3:
        return (
            <div className="space-y-4">
                 <div className="space-y-1">
                    <Label>Revisión y Aceptación del Contrato</Label>
                    <p className="text-sm text-muted-foreground">
                        El cliente debe leer y aceptar los términos para finalizar.
                    </p>
                </div>
                 <ScrollArea className="h-80 w-full rounded-md border p-4 whitespace-pre-wrap font-mono text-xs">
                    {isPending && !contractText ? (
                        <div className="flex justify-center items-center h-full">
                            <Loader2 className="animate-spin" />
                        </div>
                    ) : (
                        contractText
                    )}
                </ScrollArea>
                <Button type="button" onClick={handleFinalSubmit} className="w-full bg-accent hover:bg-accent/90" disabled={isPending || !contractText}>
                    {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ShieldCheck className="mr-2 h-4 w-4" />}
                    {isPending ? "Procesando..." : "Crear y Finalizar Registro"}
                </Button>
            </div>
        )
      default:
        return null;
    }
  }

  return (
    <Form {...form}>
      <form
        onSubmit={(e) => e.preventDefault()} // Prevent default form submission
        className="space-y-4"
      >
        {renderStep()}
      </form>
    </Form>
  );
}
