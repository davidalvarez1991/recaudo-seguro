
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
import { Button } from "@/components/ui/button";
import { useTransition } from "react";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Send } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { sendAnnouncementToProviders } from "@/lib/actions";

const AnnouncementSchema = z.object({
  message: z.string().min(10, {
    message: "El anuncio debe tener al menos 10 caracteres.",
  }),
});

export function AnnouncementForm() {
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof AnnouncementSchema>>({
    resolver: zodResolver(AnnouncementSchema),
    defaultValues: {
      message: "",
    },
  });

  const onSubmit = (values: z.infer<typeof AnnouncementSchema>) => {
    startTransition(async () => {
      const result = await sendAnnouncementToProviders(values.message);
      if (result.success) {
        toast({
          title: "Anuncio Enviado",
          description: "El mensaje ha sido enviado a todos los proveedores.",
          className: "bg-accent text-accent-foreground border-accent",
        });
        form.reset();
      } else {
        toast({
          title: "Error",
          description: result.error || "No se pudo enviar el anuncio.",
          variant: "destructive",
        });
      }
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="message"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Mensaje del Anuncio</FormLabel>
              <FormControl>
                <Textarea
                  {...field}
                  placeholder="Escribe aquí tu comunicado..."
                  className="min-h-48"
                  disabled={isPending}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex justify-end">
            <Button type="submit" disabled={isPending}>
                {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                {isPending ? "Enviando..." : "Enviar a Todos"}
            </Button>
        </div>
      </form>
    </Form>
  );
}
