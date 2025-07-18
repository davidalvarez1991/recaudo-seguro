
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
import { useTransition, useState, useEffect } from "react";
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
  const [cobradorId, setCobradorId] = useState<string | null>(null);
  const { toast } = useToast();

   useEffect(() => {
    // Function to get a cookie by name
    const getCookie = (name: string): string | null => {
      const value = `; ${document.cookie}`;
      const parts = value.split(`; ${name}=`);
      if (parts.length === 2) return parts.pop()?.split(';').shift() || null;
      return null;
    };
    setCobradorId(getCookie('loggedInUser'));
  }, []);

  const form = useForm<z.infer<typeof ClientCreditSchema>>({
    resolver: zodResolver(ClientCreditSchema),
    defaultValues: {
      idNumber: "",
      address: "",
      contactPhone: "",
      guarantorPhone: "",
      idCardPhoto: undefined,
      creditAmount: 0,
      installments: 0,
    },
  });

  const onSubmit = (values: z.infer<typeof ClientCreditSchema>) => {
    startTransition(async () => {
       if (!cobradorId) {
            toast({
                title: "Error",
                description: "No se pudo identificar al cobrador. Por favor, inicie sesión de nuevo.",
                variant: "destructive",
            });
            return;
        }

        const result = await createClientAndCredit(values);

        if (result.success) {
          toast({
            title: "Registro Exitoso",
            description: "El cliente y su crédito han sido creados correctamente.",
            variant: "default",
            className: "bg-accent text-accent-foreground border-accent",
          });
          window.dispatchEvent(new CustomEvent('creditos-updated'));
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

  const fileRef = form.register("idCardPhoto");

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
                                 <Input type="file" {...fileRef} disabled={isPending} accept="image/png, image/jpeg, image/gif" />
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
                        <Input {...field} type="number" placeholder="500000" disabled={isPending} />
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
                        <Input {...field} type="number" placeholder="12" disabled={isPending} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
            </div>
        </ScrollArea>
        <Button type="submit" className="w-full" disabled={isPending || !cobradorId}>
          {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Crear Cliente y Crédito
        </Button>
      </form>
    </Form>
  );
}

    