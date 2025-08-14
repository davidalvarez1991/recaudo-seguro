
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
import { Loader2, Send, Calendar as CalendarIcon } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { sendAnnouncementToProviders } from "@/lib/actions";
import { AnnouncementSchema } from "@/lib/schemas";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Calendar } from "@/components/ui/calendar";
import { DateRange } from "react-day-picker";

export function AnnouncementForm() {
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof AnnouncementSchema>>({
    resolver: zodResolver(AnnouncementSchema),
    defaultValues: {
      message: "",
      dateRange: {
        from: undefined,
        to: undefined
      }
    },
  });

  const onSubmit = (values: z.infer<typeof AnnouncementSchema>) => {
    startTransition(async () => {
      const result = await sendAnnouncementToProviders(values);
      if (result.success) {
        toast({
          title: "Anuncio Programado",
          description: "El mensaje ha sido programado y se mostrará en las fechas indicadas.",
          className: "bg-accent text-accent-foreground border-accent",
        });
        form.reset();
      } else {
        toast({
          title: "Error",
          description: result.error || "No se pudo programar el anuncio.",
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
        
        <FormField
          control={form.control}
          name="dateRange"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Rango de Fechas de Visibilidad</FormLabel>
                <Popover>
                    <PopoverTrigger asChild>
                        <FormControl>
                            <Button
                                id="date"
                                variant={"outline"}
                                className={cn(
                                "w-full sm:w-[300px] justify-start text-left font-normal",
                                !field.value?.from && "text-muted-foreground"
                                )}
                                disabled={isPending}
                            >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {field.value?.from ? (
                                    field.value.to ? (
                                        <>
                                        {format(field.value.from, "LLL dd, y", { locale: es })} -{" "}
                                        {format(field.value.to, "LLL dd, y", { locale: es })}
                                        </>
                                    ) : (
                                        format(field.value.from, "LLL dd, y", { locale: es })
                                    )
                                ) : (
                                    <span>Selecciona un rango</span>
                                )}
                            </Button>
                        </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                            initialFocus
                            mode="range"
                            defaultMonth={field.value?.from}
                            selected={field.value}
                            onSelect={field.onChange}
                            numberOfMonths={2}
                            locale={es}
                        />
                    </PopoverContent>
                </Popover>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end">
            <Button type="submit" disabled={isPending}>
                {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                {isPending ? "Enviando..." : "Enviar Anuncio"}
            </Button>
        </div>
      </form>
    </Form>
  );
}
