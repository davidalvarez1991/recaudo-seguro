
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
import { EditProviderSchema } from "@/lib/schemas";
import { updateProvider } from "@/lib/actions";
import { useTransition } from "react";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Save } from "lucide-react";

type Provider = {
  id: string;
  companyName: string;
  idNumber: string;
  email: string;
  whatsappNumber: string;
};

type EditProviderFormProps = {
  provider: Provider;
  onFormSubmit: () => void;
};

export function EditProviderForm({ provider, onFormSubmit }: EditProviderFormProps) {
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof EditProviderSchema>>({
    resolver: zodResolver(EditProviderSchema),
    defaultValues: {
      originalIdNumber: provider.idNumber,
      companyName: provider.companyName,
      idNumber: provider.idNumber,
      email: provider.email,
      whatsappNumber: provider.whatsappNumber,
      password: "",
    },
  });

  const onSubmit = (values: z.infer<typeof EditProviderSchema>) => {
    startTransition(async () => {
      try {
        const result = await updateProvider(values);
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
          name="companyName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nombre de la Empresa</FormLabel>
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
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Correo Electrónico</FormLabel>
              <FormControl>
                <Input {...field} type="email" disabled={isPending} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
         <FormField
          control={form.control}
          name="whatsappNumber"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Número de WhatsApp</FormLabel>
              <FormControl>
                <Input {...field} type="tel" disabled={isPending} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nueva Contraseña (opcional)</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  type="password"
                  placeholder="Dejar en blanco para no cambiar"
                  disabled={isPending}
                />
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
