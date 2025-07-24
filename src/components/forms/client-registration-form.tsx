
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
import { Loader2, DollarSign, UploadCloud, Eraser, FileText, X, Save, StepForward, CheckCircle2, AlertCircle, Upload, CalendarIcon } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ClientCreditSchema } from "@/lib/schemas";
import { createClientAndCredit, updateCreditSignature, uploadSingleDocument, savePaymentSchedule } from "@/lib/actions";
import { Progress } from "@/components/ui/progress";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import SignatureCanvas from 'react-signature-canvas';
import { cn } from "@/lib/utils";
import { Calendar } from "@/components/ui/calendar";
import { addDays, getDay, isSameDay, startOfDay } from 'date-fns';

type ClientRegistrationFormProps = {
  onFormSubmit?: () => void;
};

type FileWithStatus = {
    file: File;
    status: 'pending' | 'uploading' | 'completed' | 'error';
    progress: number;
    error?: string;
}

type PaymentFrequency = 'diario' | 'semanal' | 'quincenal' | 'mensual';

export function ClientRegistrationForm({ onFormSubmit }: ClientRegistrationFormProps) {
  const [step, setStep] = useState(1);
  const [isPending, setIsPending] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [requiresGuarantor, setRequiresGuarantor] = useState(false);
  const [filesToUpload, setFilesToUpload] = useState<FileWithStatus[]>([]);
  const [createdCreditId, setCreatedCreditId] = useState<string | null>(null);
  
  // State for payment schedule
  const [paymentFrequency, setPaymentFrequency] = useState<PaymentFrequency>('diario');
  const [selectedDates, setSelectedDates] = useState<Date[]>([]);
  const [month, setMonth] = useState(new Date());

  const { toast } = useToast();
  const sigPadRef = useRef<SignatureCanvas>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<z.infer<typeof ClientCreditSchema>>({
    resolver: zodResolver(ClientCreditSchema),
    defaultValues: {
      idNumber: "",
      name: "",
      address: "",
      contactPhone: "",
      guarantorName: "",
      guarantorPhone: "",
      guarantorAddress: "",
      creditAmount: "",
      installments: "",
      requiresGuarantor: false,
      signature: "",
    },
    context: {
        requiresGuarantor: false,
    }
  });

  useEffect(() => {
    form.setValue('requiresGuarantor', requiresGuarantor);
    if (!requiresGuarantor) {
      form.setValue('guarantorName', '');
      form.setValue('guarantorPhone', '');
      form.setValue('guarantorAddress', '');
    }
    form.trigger(['guarantorName', 'guarantorPhone', 'guarantorAddress']);
  }, [requiresGuarantor, form]);
  
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      const newFiles = Array.from(event.target.files);
      setFilesToUpload((prevFiles) => {
          const combined = [...prevFiles, ...newFiles.map(f => ({ file: f, status: 'pending' as const, progress: 0 }))];
          if (combined.length > 3) {
              toast({
                  title: "Límite de archivos alcanzado",
                  description: "Solo puedes subir un máximo de 3 archivos.",
                  variant: "destructive"
              });
              return prevFiles;
          }
          return combined;
      });
      event.target.value = '';
    }
  };

  const removeFile = (indexToRemove: number) => {
    setFilesToUpload((prevFiles) => prevFiles.filter((_, index) => index !== indexToRemove));
  };

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

  const clearSignature = () => {
    sigPadRef.current?.clear();
    form.setValue('signature', '');
  };
  
  const handleNextStep = async () => {
    const isValid = await form.trigger();
    if (!isValid) return;

    setIsPending(true);
    const result = await createClientAndCredit(form.getValues());
    
    if (result && result.success && result.creditId) {
      setCreatedCreditId(result.creditId);
      setStep(2);
    } else if (result && result.error) {
       toast({
        title: "Error en el registro",
        description: result.error,
        variant: "destructive",
      });
    }
    setIsPending(false);
  };

    const handleDateSelect = (date: Date | undefined) => {
        if (!date) return;
        const today = startOfDay(new Date());
        if (date < today) return; // Prevent selecting past dates

        const updateSelectedDates = (newDates: Date[]) => {
             const installments = parseInt(form.getValues('installments') || '0', 10);
             if (installments > 0 && newDates.length > installments) {
                toast({
                    title: "Límite de cuotas alcanzado",
                    description: `No puedes seleccionar más de ${installments} fechas de pago.`,
                    variant: "destructive",
                });
                return;
            }
             setSelectedDates(newDates);
        };
        
        const dateWithoutTime = startOfDay(date);

        if (paymentFrequency === 'semanal') {
            const dayOfWeek = getDay(dateWithoutTime);
            const firstDate = dateWithoutTime;
            const newDates = [firstDate];
            const installments = parseInt(form.getValues('installments') || '1', 10);
            let currentDate = firstDate;
            for (let i = 1; i < installments; i++) {
                currentDate = addDays(currentDate, 7);
                newDates.push(currentDate);
            }
            updateSelectedDates(newDates);
        } else { // quincenal, mensual, or individual selection for diario
            const existingIndex = selectedDates.findIndex(d => isSameDay(d, dateWithoutTime));
            if (existingIndex > -1) {
                updateSelectedDates(selectedDates.filter((_, i) => i !== existingIndex));
            } else {
                updateSelectedDates([...selectedDates, dateWithoutTime].sort((a,b) => a.getTime() - b.getTime()));
            }
        }
    };
    
    useEffect(() => {
        const installments = parseInt(form.getValues('installments') || '0', 10);
        if (installments <= 0) {
             setSelectedDates([]);
             return;
        }

        const today = startOfDay(new Date());
        let newDates: Date[] = [];
        
        if (paymentFrequency === 'diario') {
            newDates = Array.from({ length: installments }, (_, i) => addDays(today, i));
        } else if (paymentFrequency === 'quincenal') {
            newDates = Array.from({ length: installments }, (_, i) => addDays(today, i * 15));
        } else if (paymentFrequency === 'mensual') {
            newDates = Array.from({ length: installments }, (_, i) => addDays(today, i * 30));
        } else {
             // For weekly, we clear dates and let the user select the first day
             setSelectedDates([]);
             return;
        }
        setSelectedDates(newDates);

    }, [paymentFrequency, form.getValues('installments')]);

    const handleSaveSchedule = async () => {
        if (!createdCreditId || selectedDates.length === 0) {
             toast({
                title: "Información incompleta",
                description: "Debes seleccionar las fechas de pago.",
                variant: "destructive"
            });
            return;
        }
        
        setIsPending(true);
        const result = await savePaymentSchedule({
            creditId: createdCreditId,
            paymentFrequency,
            paymentDates: selectedDates.map(d => d.toISOString())
        });
        
        if (result.success) {
            toast({ title: "Calendario Guardado", description: "El calendario de pagos se ha guardado correctamente." });
            setStep(3); // Move to next step
        } else {
            toast({ title: "Error", description: result.error, variant: "destructive" });
        }
        setIsPending(false);
    };
  
  const handleUploadAllFiles = async () => {
        if (!createdCreditId) return;
        setIsPending(true);

        for (let i = 0; i < filesToUpload.length; i++) {
            const fileWithStatus = filesToUpload[i];
            if (fileWithStatus.status === 'pending' || fileWithStatus.status === 'error') {
                
                setFilesToUpload(prev => prev.map((f, idx) => idx === i ? { ...f, status: 'uploading' } : f));
                
                const formData = new FormData();
                formData.append('creditId', createdCreditId);
                formData.append('document', fileWithStatus.file);
                
                const result = await uploadSingleDocument(formData);
                
                if (result.success) {
                    setFilesToUpload(prev => prev.map((f, idx) => idx === i ? { ...f, status: 'completed' } : f));
                } else {
                    setFilesToUpload(prev => prev.map((f, idx) => idx === i ? { ...f, status: 'error', error: result.error } : f));
                    toast({
                        title: `Error al subir ${fileWithStatus.file.name}`,
                        description: result.error || "Inténtalo de nuevo.",
                        variant: "destructive"
                    });
                    break; // Stop on first error
                }
            }
        }
        setIsPending(false);
    };

    const hasPendingUploads = filesToUpload.some(f => f.status === 'pending' || f.status === 'error');


  const handleFinish = async () => {
    if (!createdCreditId) return;

    let signatureDataUrl: string | undefined;
    if (sigPadRef.current && !sigPadRef.current.isEmpty()) {
      signatureDataUrl = sigPadRef.current.toDataURL('image/png');
    } else {
        toast({
            title: "Registro Completado",
            description: "El cliente y crédito han sido creados.",
            variant: "default",
            className: "bg-accent text-accent-foreground border-accent",
        });
        if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('creditos-updated'));
        }
        onFormSubmit?.();
        return;
    }

    setIsPending(true);
    setUploadProgress(0);

    const formData = new FormData();
    formData.append('creditId', createdCreditId);
    formData.append('signature', signatureDataUrl);

    const progressInterval = setInterval(() => {
        setUploadProgress(prev => (prev !== null ? Math.min(prev + 10, 90) : 0));
    }, 200);

    const result = await updateCreditSignature(formData);

    clearInterval(progressInterval);
    setUploadProgress(100);

    if (result && result.success) {
      toast({
        title: "Registro Completado",
        description: "El cliente, crédito y firma han sido guardados.",
        variant: "default",
        className: "bg-accent text-accent-foreground border-accent",
      });
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('creditos-updated'));
      }
      onFormSubmit?.();
    } else if (result && result.error) {
      toast({
        title: "Error al guardar firma",
        description: result.error,
        variant: "destructive",
      });
    }

    setIsPending(false);
    setTimeout(() => setUploadProgress(null), 500);
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
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nombre Completo</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="John Doe" disabled={isPending} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
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
                      <div className="space-y-4 pt-2">
                          <FormField
                              control={form.control}
                              name="guarantorName"
                              render={({ field }) => (
                                  <FormItem>
                                  <FormLabel>Nombre del Fiador</FormLabel>
                                  <FormControl>
                                      <Input {...field} value={field.value || ''} placeholder="Jane Smith" disabled={isPending} />
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
                                      <Input {...field} value={field.value || ''} type="tel" placeholder="3017654321" disabled={isPending} />
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
                                      <Input {...field} value={field.value || ''} placeholder="Calle Falsa 123" disabled={isPending} />
                                  </FormControl>
                                  <FormMessage />
                                  </FormItem>
                              )}
                          />
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
                <ScrollArea className="h-[450px] w-full pr-6">
                    <div className="space-y-4">
                        <div className="space-y-2">
                             <Label>Frecuencia de Pago</Label>
                             <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                {(['diario', 'semanal', 'quincenal', 'mensual'] as PaymentFrequency[]).map((freq) => (
                                <Button
                                    key={freq}
                                    type="button"
                                    variant={paymentFrequency === freq ? "default" : "outline"}
                                    onClick={() => setPaymentFrequency(freq)}
                                    disabled={isPending}
                                >
                                    {freq.charAt(0).toUpperCase() + freq.slice(1)}
                                </Button>
                                ))}
                            </div>
                        </div>

                         <div className="rounded-md border flex justify-center">
                            <Calendar
                                mode="multiple"
                                selected={selectedDates}
                                onSelect={handleDateSelect}
                                month={month}
                                onMonthChange={setMonth}
                                fromDate={new Date()}
                                disabled={(date) => date < startOfDay(new Date())}
                                footer={
                                     <p className="text-sm text-muted-foreground px-3 pt-2">
                                        Has seleccionado {selectedDates.length} de {form.getValues('installments') || 0} cuotas.
                                    </p>
                                }
                                modifiers={{
                                    selected: selectedDates,
                                }}
                                modifiersClassNames={{
                                    selected: 'bg-red-500 text-white hover:bg-red-600 focus:bg-red-600',
                                }}
                            />
                        </div>
                    </div>
                </ScrollArea>
                 <div className="flex gap-2 mt-4">
                    <Button type="button" variant="outline" onClick={() => setStep(1)} className="w-full" disabled={isPending}>
                        Volver
                    </Button>
                    <Button type="button" onClick={handleSaveSchedule} className="w-full" disabled={isPending || selectedDates.length === 0}>
                        <Save className="mr-2 h-4 w-4" />
                        {isPending ? 'Guardando...' : 'Guardar Calendario'}
                    </Button>
                </div>
            </>
        );
      case 3:
        return (
            <>
                <ScrollArea className="h-96 w-full pr-6">
                    <div className="space-y-4">
                        <Label>Cargar Documentos (Opcional, máx. 3)</Label>
                        <Input 
                            ref={fileInputRef}
                            type="file" 
                            multiple
                            className="hidden"
                            disabled={isPending || filesToUpload.length >= 3}
                            onChange={handleFileChange}
                            accept="image/*,video/*,application/pdf"
                        />
                         <Button
                            type="button"
                            variant="outline"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={isPending || filesToUpload.length >= 3}
                            className="w-full"
                         >
                            <UploadCloud className="mr-2" />
                            Elegir archivos ({filesToUpload.length}/3)
                        </Button>
                        {filesToUpload.length > 0 && (
                            <div className="space-y-2 mt-2">
                            {filesToUpload.map((fileWithStatus, index) => (
                                <div key={index} className="flex items-center justify-between p-2 border rounded-md">
                                <div className="flex items-center gap-2 overflow-hidden flex-1">
                                    <FileText className="h-5 w-5 shrink-0" />
                                    <span className="text-sm truncate">{fileWithStatus.file.name}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                     {fileWithStatus.status === 'uploading' && <Loader2 className="h-5 w-5 animate-spin text-blue-500" />}
                                     {fileWithStatus.status === 'completed' && <CheckCircle2 className="h-5 w-5 text-green-500" />}
                                     {fileWithStatus.status === 'error' && <AlertCircle className="h-5 w-5 text-red-500" />}
                                     <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        className="h-6 w-6"
                                        onClick={() => removeFile(index)}
                                        disabled={isPending}
                                    >
                                        <X className="h-4 w-4" />
                                    </Button>
                                </div>
                                </div>
                            ))}
                            </div>
                        )}
                        {filesToUpload.length > 0 && (
                            <Button
                                type="button"
                                onClick={handleUploadAllFiles}
                                disabled={isPending || !hasPendingUploads}
                                className="w-full"
                            >
                                {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                                {isPending ? 'Subiendo...' : 'Iniciar Carga'}
                            </Button>
                        )}
                    </div>
                </ScrollArea>
                <div className="flex gap-2 mt-4">
                    <Button type="button" variant="outline" onClick={() => setStep(2)} className="w-full" disabled={isPending}>
                        Volver
                    </Button>
                    <Button type="button" onClick={() => setStep(4)} className="w-full" disabled={isPending || hasPendingUploads}>
                        <StepForward className="mr-2 h-4 w-4" />
                        Omitir y Seguir
                    </Button>
                </div>
            </>
        );
      case 4:
         return (
            <>
                <ScrollArea className="h-96 w-full pr-6">
                    <div className="space-y-4">
                         <FormField
                            control={form.control}
                            name="signature"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Firma del Cliente (Opcional)</FormLabel>
                                    <FormControl>
                                        <div className="relative w-full aspect-[2/1] border border-input rounded-md bg-background">
                                            <SignatureCanvas
                                                ref={sigPadRef}
                                                penColor="black"
                                                canvasProps={{ className: "w-full h-full rounded-md" }}
                                                onEnd={() => {
                                                  if (sigPadRef.current) {
                                                    field.onChange(sigPadRef.current.toDataURL('image/png'));
                                                  }
                                                }}
                                                disabled={isPending}
                                            />
                                            <input type="hidden" {...field} />
                                        </div>
                                    </FormControl>
                                    <Button 
                                      type="button" 
                                      variant="outline" 
                                      size="sm" 
                                      onClick={clearSignature}
                                      disabled={isPending}
                                      className="mt-2"
                                    >
                                        <Eraser className="mr-2 h-4 w-4" />
                                        Limpiar Firma
                                    </Button>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
                </ScrollArea>
                {isPending && uploadProgress !== null && (
                  <div className="space-y-2 pt-4">
                    <Label>Guardando firma...</Label>
                    <Progress value={uploadProgress} className="w-full" />
                  </div>
                )}
                <div className="flex gap-2 mt-4">
                    <Button type="button" variant="outline" onClick={() => setStep(3)} className="w-full" disabled={isPending}>
                        Volver
                    </Button>
                    <Button type="button" onClick={handleFinish} className="w-full" disabled={isPending}>
                        {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                        Finalizar y Guardar Firma
                    </Button>
                </div>
            </>
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
