
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
import { Loader2, Upload } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

const ClientCreditSchema = z.object({
  idNumber: z.string().min(6, "La cédula debe tener al menos 6 caracteres."),
  address: z.string().min(5, "La dirección es obligatoria."),
  contactPhone: z.string().min(10, "El teléfono debe tener 10 dígitos."),
  guarantorPhone: z.string().min(10, "El teléfono del fiador debe tener 10 dígitos."),
  idCardPhoto: z.any().refine(files => files?.length > 0, "La foto de la cédula es obligatoria."),
  creditAmount: z.coerce.number().min(1, "El valor del crédito es obligatorio."),
  installments: z.coerce.number().min(1, "El número de cuotas es obligatorio."),
});

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
      address: "",
      contactPhone: "",
      guarantorPhone: "",
      idCardPhoto: undefined,
      creditAmount: 0,
      installments: 0,
    },
  });

  const onSubmit = (values: z.infer<typeof ClientCreditSchema>) => {
    startTransition(() => {
      // Mock API call
      console.log("Submitting new client and credit:", values);
      
      toast({
        title: "Registro Exitoso",
        description: "El cliente y su crédito han sido creados correctamente.",
        variant: "default",
        className: "bg-accent text-accent-foreground border-accent",
      });
      form.reset();
      onFormSubmit?.();
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
        <Button type="submit" className="w-full" disabled={isPending}>
          {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Crear Cliente y Crédito
        </Button>
      </form>
    </Form>
  );
}

