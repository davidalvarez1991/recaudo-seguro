
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
import { useTransition } from "react";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ClientCreditSchema } from "@/lib/schemas";
import { createClientAndCredit } from "@/lib/actions";

type ClientRegistrationFormProps = {
  onFormSubmit?: () => void;
};

export function ClientRegistrationForm({ onFormSubmit }: ClientRegistrationFormProps) {
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof ClientCreditSchema>>({
    resolver: zodResolver(ClientCreditSchema),
    defaultValues: {
      idNumber: "",
      name: "",
      address: "",
      contactPhone: "",
      guarantorPhone: "",
      idCardPhoto: undefined,
      creditAmount: undefined,
      installments: undefined,
    },
  });

  const onSubmit = (values: z.infer<typeof ClientCreditSchema>) => {
    const formData = new FormData();
    Object.entries(values).forEach(([key, value]) => {
      if (value) {
        if (key === 'idCardPhoto' && value instanceof File) {
          formData.append(key, value);
        } else if (typeof value === 'string' || typeof value === 'number') {
          formData.append(key, String(value));
        }
      }
    });

    startTransition(async () => {
        const result = await createClientAndCredit(formData);

        if (result.success) {
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
        } else {
           toast({
            title: "Error en el registro",
            description: result.error || "No se pudo completar la operación.",
            variant: "destructive",
          });
        }
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                    name="idCardPhoto"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Foto de la Cédula</FormLabel>
                            <FormControl>
                                 <Input 
                                    type="file" 
                                    disabled={isPending} 
                                    accept="image/png, image/jpeg, image/gif, image/webp" 
                                    onChange={(e) => field.onChange(e.target.files ? e.target.files[0] : null)}
                                 />
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
                      <FormControl>
                        <Input {...field} type="number" placeholder="500000" disabled={isPending} onChange={e => field.onChange(e.target.valueAsNumber)} value={field.value ?? ""} />
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
                      <FormLabel>Cuotas a Diferir</FormLabel>
                      <FormControl>
                        <Input {...field} type="number" placeholder="12" disabled={isPending} onChange={e => field.onChange(e.target.valueAsNumber)} value={field.value ?? ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
            </div>
        </ScrollArea>
        <Button type="submit" className="w-full" disabled={isPending}>
          {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Crear Cliente y Crédito
        </Button>
      </form>
    </Form>
  );
}
