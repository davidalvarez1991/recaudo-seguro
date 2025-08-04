
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
import { useState, useRef, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Loader2, DollarSign, Eraser, FileText, X, Save, StepForward, CheckCircle2, AlertCircle, Upload, CalendarIcon, RefreshCw, BadgeInfo, ShieldCheck } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ClientCreditSchema } from "@/lib/schemas";
import { createClientAndCredit, savePaymentSchedule, getContractForAcceptance, acceptContract } from "@/lib/actions";
import { Progress } from "@/components/ui/progress";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { Calendar } from "@/components/ui/calendar";
import { addDays, getDay, isSameDay, startOfDay, format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Badge } from "@/components/ui/badge";

type ClientRegistrationFormProps = {
  onFormSubmit?: () => void;
};

export function ClientRegistrationForm({ onFormSubmit }: ClientRegistrationFormProps) {
  const [step, setStep] = useState(1);
  const [isPending, setIsPending] = useState(false);
  const [requiresGuarantor, setRequiresGuarantor] = useState(false);
  const [requiresReferences, setRequiresReferences] = useState(false);
  const [createdCreditId, setCreatedCreditId] = useState<string | null>(null);
  const [contractText, setContractText] = useState<string | null>(null);
  
  // State for payment schedule
  const [selectedDates, setSelectedDates] = useState<Date[]>([]);
  const [month, setMonth] = useState(new Date());

  const { toast } = useToast();

  const form = useForm<z.infer<typeof ClientCreditSchema>>({
    resolver: zodResolver(ClientCreditSchema),
    defaultValues: {
      idNumber: "",
      firstName: "",
      secondName: "",
      firstLastName: "",
      secondLastName: "",
      address: "",
      contactPhone: "",
      guarantorName: "",
      guarantorIdNumber: "",
      guarantorAddress: "",
      guarantorPhone: "",
      familyReferenceName: "",
      familyReferencePhone: "",
      familyReferenceAddress: "",
      personalReferenceName: "",
      personalReferencePhone: "",
      personalReferenceAddress: "",
      creditAmount: "",
      installments: "",
      requiresGuarantor: false,
      requiresReferences: false,
    },
    context: {
        requiresGuarantor: false,
        requiresReferences: false,
    }
  });

  useEffect(() => {
    form.setValue('requiresGuarantor', requiresGuarantor);
    if (!requiresGuarantor) {
      form.setValue('guarantorName', '');
      form.setValue('guarantorIdNumber', '');
      form.setValue('guarantorAddress', '');
      form.setValue('guarantorPhone', '');
    }
    form.trigger(['guarantorName', 'guarantorIdNumber', 'guarantorAddress', 'guarantorPhone']);
  }, [requiresGuarantor, form]);
  
  useEffect(() => {
    form.setValue('requiresReferences', requiresReferences);
    if (!requiresReferences) {
      form.setValue('familyReferenceName', '');
      form.setValue('familyReferencePhone', '');
      form.setValue('familyReferenceAddress', '');
      form.setValue('personalReferenceName', '');
      form.setValue('personalReferencePhone', '');
      form.setValue('personalReferenceAddress', '');
    }
    form.trigger(['familyReferenceName', 'familyReferencePhone', 'familyReferenceAddress', 'personalReferenceName', 'personalReferencePhone', 'personalReferenceAddress']);
  }, [requiresReferences, form]);

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
  
  const handleNextStep = async () => {
    const isValid = await form.trigger();
    if (!isValid) return;

    setIsPending(true);
    try {
        const result = await createClientAndCredit(form.getValues());
        
        if (result.success && result.creditId) {
            setCreatedCreditId(result.creditId);
            setStep(2);
        } else {
            toast({
                title: "Error en el registro",
                description: result.error,
                variant: "destructive",
            });
        }
    } catch (e) {
         toast({
            title: "Error de red",
            description: "No se pudo conectar con el servidor.",
            variant: "destructive",
        });
    } finally {
        setIsPending(false);
    }
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
    
    const handleSaveSchedule = async () => {
        const validDates = selectedDates.filter(d => d instanceof Date && !isNaN(d.getTime()));

        if (!createdCreditId || validDates.length === 0) {
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
                description: `Debes seleccionar exactamente ${installments} fechas de pago. Has seleccionado ${validDates.length}.`,
                variant: "destructive"
            });
            return;
        }

        setIsPending(true);
        const result = await savePaymentSchedule({
            creditId: createdCreditId,
            paymentDates: validDates.map(d => d.toISOString())
        });
        
        if (result.success) {
            setStep(3); // Move to step 3 to fetch and display the contract
        } else {
            toast({ title: "Error al guardar calendario", description: result.error, variant: "destructive" });
        }
        setIsPending(false);
    };

    const handleResetDates = () => {
      setSelectedDates([]);
      toast({
        title: "Selección reiniciada",
        description: "Puedes volver a elegir las fechas de pago.",
      });
    }

    const handleAcceptContract = async () => {
        if (!createdCreditId) return;
        
        setIsPending(true);
        const result = await acceptContract(createdCreditId);

        if (result.success) {
            toast({
                title: "Registro Finalizado",
                description: "El contrato fue aceptado y el crédito está activo.",
                variant: "default",
                className: "bg-accent text-accent-foreground border-accent",
            });
            if (typeof window !== 'undefined') {
                window.dispatchEvent(new CustomEvent('creditos-updated'));
            }
            onFormSubmit?.();
        } else {
            toast({
                title: "Error",
                description: result.error || "No se pudo aceptar el contrato.",
                variant: "destructive",
            });
        }
        setIsPending(false);
    }
    
    // Effect to fetch the processed contract when moving to step 3
    useEffect(() => {
        if (step === 3 && createdCreditId) {
            const fetchContract = async () => {
                setIsPending(true);
                setContractText(null); // Clear previous contract text
                const data = await getContractForAcceptance(createdCreditId);
                if (data.contractText) {
                    setContractText(data.contractText);
                } else if (data.error) {
                    toast({
                        title: "Error al generar contrato",
                        description: data.error,
                        variant: "destructive",
                    });
                } else {
                    // This case handles when contract generation is disabled by the provider.
                    // The process should just finish.
                    toast({ 
                        title: "Registro Completado",
                        description: "El cliente y su crédito han sido creados exitosamente (sin contrato).",
                        variant: "default",
                        className: "bg-accent text-accent-foreground border-accent",
                    });
                    if (typeof window !== 'undefined') {
                        window.dispatchEvent(new CustomEvent('creditos-updated'));
                    }
                    onFormSubmit?.();
                }
                setIsPending(false);
            };
            fetchContract();
        }
    }, [step, createdCreditId, onFormSubmit, toast]);


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
                  <div className="grid grid-cols-2 gap-4">
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
                  
                  <Controller
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
                                      onCheckedChange={(checked) => {
                                          field.onChange(checked);
                                          setRequiresGuarantor(checked);
                                      }}
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
                            name="guarantorName"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Nombre Completo del Fiador</FormLabel>
                                <FormControl>
                                    <Input {...field} value={field.value || ''} placeholder="Nombre del fiador" disabled={isPending} />
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                         <FormField
                            control={form.control}
                            name="guarantorIdNumber"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Cédula del Fiador</FormLabel>
                                <FormControl>
                                    <Input {...field} value={field.value || ''} placeholder="Cédula del fiador" disabled={isPending} />
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="guarantorAddress"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Dirección del Fiador</FormLabel>
                                <FormControl>
                                    <Input {...field} value={field.value || ''} placeholder="Dirección del fiador" disabled={isPending} />
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                         <FormField
                            control={form.control}
                            name="guarantorPhone"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Teléfono del Fiador</FormLabel>
                                <FormControl>
                                    <Input {...field} value={field.value || ''} type="tel" placeholder="Teléfono del fiador" disabled={isPending} />
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                      </div>
                  )}

                  <Controller
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
                                      onCheckedChange={(checked) => {
                                          field.onChange(checked);
                                          setRequiresReferences(checked);
                                      }}
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
                                name="familyReferenceName"
                                render={({ field }) => (
                                    <FormItem>
                                    <FormLabel>Nombre</FormLabel>
                                    <FormControl>
                                        <Input {...field} value={field.value || ''} placeholder="Nombre completo del familiar" disabled={isPending} />
                                    </FormControl>
                                    <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="familyReferencePhone"
                                render={({ field }) => (
                                    <FormItem>
                                    <FormLabel>Número telefónico</FormLabel>
                                    <FormControl>
                                        <Input {...field} value={field.value || ''} type="tel" placeholder="Teléfono del familiar" disabled={isPending} />
                                    </FormControl>
                                    <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="familyReferenceAddress"
                                render={({ field }) => (
                                    <FormItem>
                                    <FormLabel>Dirección</FormLabel>
                                    <FormControl>
                                        <Input {...field} value={field.value || ''} placeholder="Dirección del familiar" disabled={isPending} />
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
                                name="personalReferenceName"
                                render={({ field }) => (
                                    <FormItem>
                                    <FormLabel>Nombre</FormLabel>
                                    <FormControl>
                                        <Input {...field} value={field.value || ''} placeholder="Nombre completo del conocido" disabled={isPending} />
                                    </FormControl>
                                    <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="personalReferencePhone"
                                render={({ field }) => (
                                    <FormItem>
                                    <FormLabel>Número telefónico</FormLabel>
                                    <FormControl>
                                        <Input {...field} value={field.value || ''} type="tel" placeholder="Teléfono del conocido" disabled={isPending} />
                                    </FormControl>
                                    <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="personalReferenceAddress"
                                render={({ field }) => (
                                    <FormItem>
                                    <FormLabel>Dirección</FormLabel>
                                    <FormControl>
                                        <Input {...field} value={field.value || ''} placeholder="Dirección del conocido" disabled={isPending} />
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
                                      value={field.value || ''}
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
                              value={field.value || ''}
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
            <Button type="button" onClick={handleNextStep} className="w-full mt-4" disabled={isPending}>
              {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              {isPending ? "Guardando..." : "Guardar y Siguiente"}
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
                 <div className="flex gap-2 mt-6">
                    <Button type="button" variant="outline" onClick={() => setStep(1)} className="w-full" disabled={isPending}>
                        Volver
                    </Button>
                    <Button type="button" onClick={handleSaveSchedule} className="w-full" disabled={isPending || selectedDates.length === 0}>
                        {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
                        {isPending ? 'Guardando...' : 'Siguiente'}
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
                    {isPending ? <div className="flex justify-center items-center h-full"><Loader2 className="animate-spin" /></div> : contractText}
                </ScrollArea>
                <Button type="button" onClick={handleAcceptContract} className="w-full bg-accent hover:bg-accent/90" disabled={isPending || !contractText}>
                    {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ShieldCheck className="mr-2 h-4 w-4" />}
                    {isPending ? "Procesando..." : "Aceptar y Finalizar Contrato"}
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
