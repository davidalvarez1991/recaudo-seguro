
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
import { EditClientSchema } from "@/lib/schemas";
import { updateClient } from "@/lib/actions";
import { useTransition } from "react";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Save } from "lucide-react";

type Cliente = {
  id: string;
  name: string;
  idNumber: string;
  address: string;
  contactPhone: string;
};

type EditClientFormProps = {
  cliente: Cliente;
  onFormSubmit: () => void;
};

export function EditClientForm({ cliente, onFormSubmit }: EditClientFormProps) {
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof EditClientSchema>>({
    resolver: zodResolver(EditClientSchema),
    defaultValues: {
      originalIdNumber: cliente.idNumber,
      idNumber: cliente.idNumber,
      name: cliente.name,
      address: cliente.address,
      contactPhone: cliente.contactPhone,
    },
  });

  const onSubmit = (values: z.infer<typeof EditClientSchema>) => {
    startTransition(async () => {
      try {
        const result = await updateClient(values);
        if (result?.error) {
           toast({
             title: "Error al actualizar",
             description: result.error,
             variant: "destructive",
           });
        } else if (result?.success) {
            toast({
              title: "Actualización Exitosa",
              description: result.success,
              variant: "default",
              className: "bg-accent text-accent-foreground border-accent",
            });
            onFormSubmit();
        }
      } catch (error) {
         toast({
            title: "Error",
            description: "Algo salió mal. Por favor, inténtalo de nuevo.",
            variant: "destructive",
          });
       }
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nombre Completo</FormLabel>
              <FormControl>
                <Input {...field} disabled={isPending} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="idNumber"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Número de Identificación</FormLabel>
              <FormControl>
                <Input {...field} disabled={isPending} />
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
              <FormLabel>Dirección</FormLabel>
              <FormControl>
                <Input {...field} disabled={isPending} />
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
                <Input {...field} type="tel" disabled={isPending} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full bg-accent hover:bg-accent/90" disabled={isPending}>
          {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          Guardar Cambios
        </Button>
      </form>
    </Form>
  );
}
