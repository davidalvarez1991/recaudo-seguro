
"use client";

import { useForm } from "react-hook-form";
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
import { useState, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { Loader2, DollarSign, UploadCloud } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ClientCreditSchema } from "@/lib/schemas";
import { createClientAndCredit } from "@/lib/actions";
import { Progress } from "@/components/ui/progress";

type ClientRegistrationFormProps = {
  onFormSubmit?: () => void;
};

export function ClientRegistrationForm({ onFormSubmit }: ClientRegistrationFormProps) {
  const [isPending, setIsPending] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const { toast } = useToast();
  const formRef = useRef<HTMLFormElement>(null);

  const form = useForm<z.infer<typeof ClientCreditSchema>>({
    resolver: zodResolver(ClientCreditSchema),
    defaultValues: {
      idNumber: "",
      name: "",
      address: "",
      contactPhone: "",
      guarantorName: "",
      guarantorPhone: "",
      creditAmount: "",
      installments: "",
      documents: undefined,
    },
  });

  const formatCurrency = (value: string) => {
    if (!value) return "";
    const numberValue = parseInt(value.replace(/[^\d]/g, ""), 10);
    if (isNaN(numberValue)) return "";
    return new Intl.NumberFormat('es-CO').format(numberValue);
  };
  
  const clientAction = async (formData: FormData) => {
    setIsPending(true);
    setUploadProgress(0);

    const onProgress = (progress: number) => {
      setUploadProgress(progress);
    };

    const result = await createClientAndCredit(formData, onProgress);
    
    setIsPending(false);
    setUploadProgress(null);

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
  };

  return (
    <Form {...form}>
      <form
        ref={formRef}
        action={clientAction}
        onSubmit={form.handleSubmit(() => {
          if (formRef.current) {
            const formData = new FormData(formRef.current);
            clientAction(formData);
          }
        })}
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
                                    onChange={e => field.onChange(formatCurrency(e.target.value))}
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
                    render={({ field: { value, onChange, ...fieldProps} }) => (
                        <FormItem>
                            <FormLabel>Cargar Documentos</FormLabel>
                            <FormControl>
                                <div className="relative">
                                    <UploadCloud className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input 
                                        {...fieldProps}
                                        type="file" 
                                        multiple
                                        className="pl-8"
                                        disabled={isPending}
                                        onChange={(e) => onChange(e.target.files)}
                                        accept="image/*,application/pdf"
                                    />
                                </div>
                            </FormControl>
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
        <Button type="submit" className="w-full" disabled={isPending}>
          {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isPending ? "Registrando..." : "Crear Cliente y Crédito"}
        </Button>
      </form>
    </Form>
  );
}
