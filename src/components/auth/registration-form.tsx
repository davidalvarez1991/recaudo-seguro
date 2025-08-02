
"use client";

import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { RegisterSchema } from "@/lib/schemas";
import { register } from "@/lib/actions";
import { useTransition, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Check, ChevronsUpDown } from "lucide-react";
import { useRouter } from "next/navigation";
import { Checkbox } from "@/components/ui/checkbox";
import { TermsDialog } from "@/components/auth/terms-dialog";
import { Separator } from "@/components/ui/separator";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { colombianCities } from "@/lib/colombian-cities";
import { cn } from "@/lib/utils";


type RegistrationFormProps = {
  role: "cliente" | "proveedor";
};

export function RegistrationForm({ role }: RegistrationFormProps) {
  const [isPending, startTransition] = useTransition();
  const [isCityPopoverOpen, setIsCityPopoverOpen] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const form = useForm<z.infer<typeof RegisterSchema>>({
    resolver: zodResolver(RegisterSchema),
    defaultValues: {
      companyName: "",
      city: "",
      idNumber: "",
      whatsappNumber: "",
      email: "",
      password: "",
      confirmPassword: "",
      termsAccepted: false,
    },
  });

  const onSubmit = (values: z.infer<typeof RegisterSchema>) => {
    startTransition(async () => {
       try {
        const result = await register(values, role);
        if (result?.error) {
           toast({
             title: "Error de registro",
             description: result.error,
             variant: "destructive",
           });
        } else if (result?.successUrl) {
            router.push(result.successUrl);
        }
      } catch (error) {
         let errorMessage = "Algo salió mal. Por favor, inténtalo de nuevo.";
         if (error instanceof Error) {
            errorMessage = error.message;
         }
         toast({
            title: "Error",
            description: errorMessage,
            variant: "destructive",
          });
       }
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {role === 'proveedor' && (
            <>
                <FormField
                control={form.control}
                name="companyName"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Nombre de la Empresa</FormLabel>
                    <FormControl>
                        <Input {...field} placeholder="Mi Empresa S.A.S" disabled={isPending} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
                 <FormField
                  control={form.control}
                  name="city"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Ciudad / Municipio</FormLabel>
                      <Popover open={isCityPopoverOpen} onOpenChange={setIsCityPopoverOpen}>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              role="combobox"
                              className={cn(
                                "w-full justify-between",
                                !field.value && "text-muted-foreground"
                              )}
                              disabled={isPending}
                            >
                              {field.value
                                ? colombianCities.find(
                                    (city) => city === field.value
                                  )
                                : "Selecciona tu ciudad"}
                              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-[--radix-popover-trigger-width] max-h-[--radix-popover-content-available-height] p-0">
                          <Command>
                            <CommandInput placeholder="Buscar ciudad..." />
                             <CommandList>
                                <CommandEmpty>No se encontró la ciudad.</CommandEmpty>
                                <CommandGroup>
                                {colombianCities.map((city) => (
                                    <CommandItem
                                    value={city}
                                    key={city}
                                    onSelect={() => {
                                        form.setValue("city", city);
                                        setIsCityPopoverOpen(false);
                                    }}
                                    >
                                    <Check
                                        className={cn(
                                        "mr-2 h-4 w-4",
                                        city === field.value
                                            ? "opacity-100"
                                            : "opacity-0"
                                        )}
                                    />
                                    {city}
                                    </CommandItem>
                                ))}
                                </CommandGroup>
                             </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
            </>
        )}
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
          name="whatsappNumber"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Número de WhatsApp</FormLabel>
              <FormControl>
                <Input {...field} type="tel" placeholder="3001234567" disabled={isPending} />
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
                <Input
                  {...field}
                  type="email"
                  placeholder="tu@correo.com"
                  disabled={isPending}
                />
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
        <FormField
          control={form.control}
          name="confirmPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Confirmar Contraseña</FormLabel>
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
        
        {role === 'proveedor' && (
          <>
            <Separator />
            <FormField
              control={form.control}
              name="termsAccepted"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 shadow">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      disabled={isPending}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>
                      Acepto los términos y condiciones.
                    </FormLabel>
                    <FormDescription>
                       Al registrarte, confirmas que has leído y aceptas nuestros <TermsDialog />.
                    </FormDescription>
                     <FormMessage />
                  </div>
                </FormItem>
              )}
            />
          </>
        )}

        <Button type="submit" className="w-full bg-accent hover:bg-accent/90" disabled={isPending || (role === 'proveedor' && !form.watch('termsAccepted'))}>
          {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Crear cuenta de {role}
        </Button>
      </form>
    </Form>
  );
}
