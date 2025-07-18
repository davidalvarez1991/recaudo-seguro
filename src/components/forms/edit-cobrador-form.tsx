
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
import { EditCobradorSchema } from "@/lib/schemas";
import { updateCobrador } from "@/lib/actions";
import { useTransition } from "react";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

type Cobrador = {
  id: string;
  name: string;
  idNumber: string;
};

type EditCobradorFormProps = {
  cobrador: Cobrador;
  onFormSubmit: () => void;
};

export function EditCobradorForm({ cobrador, onFormSubmit }: EditCobradorFormProps) {
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof EditCobradorSchema>>({
    resolver: zodResolver(EditCobradorSchema),
    defaultValues: {
      idNumber: cobrador.idNumber,
      name: cobrador.name,
      password: "",
    },
  });

  const onSubmit = (values: z.infer<typeof EditCobradorSchema>) => {
    startTransition(async () => {
      try {
        const result = await updateCobrador(values);
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
              <FormLabel>Nombre del Cobrador</FormLabel>
              <FormControl>
                <Input {...field} disabled={isPending} />
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
          {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Guardar Cambios
        </Button>
      </form>
    </Form>
  );
}
