
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
import { Loader2, DollarSign, UploadCloud, Eraser, FileText, X } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ClientCreditSchema } from "@/lib/schemas";
import { createClientAndCredit } from "@/lib/actions";
import { Progress } from "@/components/ui/progress";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import SignatureCanvas from 'react-signature-canvas';
import { Badge } from "@/components/ui/badge";

type ClientRegistrationFormProps = {
  onFormSubmit?: () => void;
};

export function ClientRegistrationForm({ onFormSubmit }: ClientRegistrationFormProps) {
  const [isPending, setIsPending] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [requiresGuarantor, setRequiresGuarantor] = useState(true);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const { toast } = useToast();
  const formRef = useRef<HTMLFormElement>(null);
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
      documents: undefined,
      requiresGuarantor: true,
      signature: "",
    },
    context: {
        requiresGuarantor: true,
    }
  });

  useEffect(() => {
    form.setValue('requiresGuarantor', requiresGuarantor);
    form.trigger(['guarantorName', 'guarantorPhone', 'guarantorAddress']);
  }, [requiresGuarantor, form]);
  
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isPending && uploadProgress === null) {
      setUploadProgress(0);
    }
    if (isPending && uploadProgress !== null && uploadProgress < 90) {
      timer = setTimeout(() => {
        setUploadProgress((prev) => (prev !== null ? prev + 10 : 0));
      }, 500);
    }
    return () => {
      clearTimeout(timer);
    };
  }, [isPending, uploadProgress]);

  useEffect(() => {
    form.setValue('documents', selectedFiles.length > 0 ? selectedFiles : undefined);
  }, [selectedFiles, form]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      const newFiles = Array.from(event.target.files);
      setSelectedFiles((prevFiles) => {
          const combined = [...prevFiles, ...newFiles];
          // Enforce max 3 files
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
    }
  };

  const removeFile = (indexToRemove: number) => {
    setSelectedFiles((prevFiles) => prevFiles.filter((_, index) => index !== indexToRemove));
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
  
  const clientAction = async (formData: FormData) => {
    setIsPending(true);
    setUploadProgress(10); // Start progress

    // Append files to formData
    selectedFiles.forEach((file) => {
      formData.append('documents', file);
    });
    
    // Check and append signature
    if (sigPadRef.current && !sigPadRef.current.isEmpty()) {
      const signatureDataUrl = sigPadRef.current.toDataURL('image/png');
      formData.append('signature', signatureDataUrl);
    }

    const result = await createClientAndCredit(formData);
    
    setUploadProgress(100);

    if (result && result.success) {
      toast({
        title: "Registro Exitoso",
        description: "El cliente y su crédito han sido creados correctamente.",
        variant: "default",
        className: "bg-accent text-accent-foreground border-accent",
      });
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('creditos-updated'));
      }
      form.reset();
      setSelectedFiles([]);
      clearSignature();
      onFormSubmit?.();
    } else if (result && result.error) {
       toast({
        title: "Error en el registro",
        description: result.error,
        variant: "destructive",
      });
    } else {
        toast({
            title: "Error inesperado",
            description: "Ocurrió un problema al procesar la solicitud.",
            variant: "destructive",
        });
    }
    setIsPending(false);
    setTimeout(() => setUploadProgress(null), 500);
  };

  return (
    <Form {...form}>
      <form
        ref={formRef}
        action={clientAction}
        className="space-y-4"
      >
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
                                    <Input {...field} placeholder="Jane Smith" disabled={isPending} />
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
                                    <Input {...field} type="tel" placeholder="3017654321" disabled={isPending} />
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
                                    <Input {...field} placeholder="Calle Falsa 123" disabled={isPending} />
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

                <FormField
                    control={form.control}
                    name="documents"
                    render={() => (
                        <FormItem>
                            <FormLabel>Cargar Documentos (Opcional, máx. 3)</FormLabel>
                            <FormControl>
                                <>
                                    <Input 
                                        ref={fileInputRef}
                                        type="file" 
                                        multiple
                                        className="hidden"
                                        disabled={isPending || selectedFiles.length >= 3}
                                        onChange={handleFileChange}
                                        accept="image/*,video/*,application/pdf"
                                    />
                                    <Button
                                      type="button"
                                      variant="outline"
                                      onClick={() => fileInputRef.current?.click()}
                                      disabled={isPending || selectedFiles.length >= 3}
                                    >
                                      <UploadCloud className="mr-2" />
                                      Elegir archivos ({selectedFiles.length}/3)
                                    </Button>
                                </>
                            </FormControl>
                            <FormMessage />
                            {selectedFiles.length > 0 && (
                              <div className="space-y-2 mt-2">
                                {selectedFiles.map((file, index) => (
                                  <div key={index} className="flex items-center justify-between p-2 border rounded-md">
                                    <div className="flex items-center gap-2 overflow-hidden">
                                      <FileText className="h-5 w-5 shrink-0" />
                                      <span className="text-sm truncate">{file.name}</span>
                                    </div>
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
                                ))}
                              </div>
                            )}
                        </FormItem>
                    )}
                />

                <Separator className="my-6" />

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
          <div className="space-y-2 pt-2">
            <Label>Subiendo archivos...</Label>
            <Progress value={uploadProgress} className="w-full" />
          </div>
        )}
        <Button 
            type="submit" 
            className="w-full" 
            disabled={isPending}
            onClick={() => {
                if (formRef.current) {
                    const formData = new FormData(formRef.current);
                    clientAction(formData);
                }
            }}
        >
          {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isPending ? "Registrando..." : "Crear Cliente y Crédito"}
        </Button>
      </form>
    </Form>
  );
}
