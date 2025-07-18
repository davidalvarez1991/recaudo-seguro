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
import { CobradorRegisterSchema } from "@/lib/schemas";
import { registerCobrador } from "@/lib/actions";
import { useTransition } from "react";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

export function CobradorRegistrationForm() {
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof CobradorRegisterSchema>>({
    resolver: zodResolver(CobradorRegisterSchema),
    defaultValues: {
      idNumber: "",
      password: "",
    },
  });

  const onSubmit = (values: z.infer<typeof CobradorRegisterSchema>) => {
    startTransition(async () => {
       try {
        const result = await registerCobrador(values);
        if (result?.error) {
           toast({
             title: "Error de registro",
             description: result.error,
             variant: "destructive",
           });
        } else if (result?.success) {
            toast({
              title: "Registro Exitoso",
              description: `El perfil de cobrador ha sido creado.`,
              variant: "default",
              className: "bg-accent text-accent-foreground border-accent",
            });
            form.reset();
        }
      } catch (error) {
         const result = error as { error?: string };
         toast({
            title: "Error",
            description: result?.error || "Algo salió mal. Por favor, inténtalo de nuevo.",
            variant: "destructive",
          });
       }
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="idNumber"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Número de Identificación</FormLabel>
              <FormControl>
                <Input {...field} placeholder="123456789" disabled={isPending} />
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
              <FormLabel>Contraseña</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  type="password"
                  placeholder="********"
                  disabled={isPending}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full bg-accent hover:bg-accent/90" disabled={isPending}>
          {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Crear cuenta de cobrador
        </Button>
      </form>
    </Form>
  );
}
