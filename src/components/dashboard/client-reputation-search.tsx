
"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Form, FormControl, FormField, FormItem } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Loader2, ShieldCheck, ShieldAlert, ShieldQuestion, BrainCircuit } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { getClientReputationData } from "@/lib/actions";
import { type ClientReputationOutput } from "@/ai/flows/analyze-client-reputation";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

const SearchSchema = z.object({
  idNumber: z.string().min(6, "La cédula debe tener al menos 6 caracteres."),
});

type SearchFormValues = z.infer<typeof SearchSchema>;

const recommendationConfig = {
    "Excelente": { icon: ShieldCheck, color: "bg-green-100 text-green-800 border-green-300" },
    "Bueno": { icon: ShieldCheck, color: "bg-blue-100 text-blue-800 border-blue-300" },
    "Regular": { icon: ShieldQuestion, color: "bg-yellow-100 text-yellow-800 border-yellow-300" },
    "Malo": { icon: ShieldAlert, color: "bg-orange-100 text-orange-800 border-orange-300" },
    "Muy Malo": { icon: ShieldAlert, color: "bg-red-100 text-red-800 border-red-300" },
};

export function ClientReputationSearch() {
  const [isSearching, setIsSearching] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [result, setResult] = useState<ClientReputationOutput | null>(null);
  const [clientName, setClientName] = useState<string | null>(null);
  const { toast } = useToast();

  const form = useForm<SearchFormValues>({
    resolver: zodResolver(SearchSchema),
    defaultValues: { idNumber: "" },
  });

  const onSubmit = async (values: SearchFormValues) => {
    setIsSearching(true);
    setIsModalOpen(true);
    setResult(null); // Reset previous results

    try {
      const response = await getClientReputationData(values.idNumber);
      if (response.error) {
        toast({ title: "Error", description: response.error, variant: "destructive" });
        setIsModalOpen(false);
      } else if (response.analysis) {
        setResult(response.analysis);
        setClientName(response.clientName || `Cliente ${values.idNumber}`);
      }
    } catch (error) {
      console.error(error);
      toast({ title: "Error de red", description: "No se pudo conectar con el servidor.", variant: "destructive" });
      setIsModalOpen(false);
    } finally {
      setIsSearching(false);
    }
  };

  const config = result ? recommendationConfig[result.recommendation] : null;
  const Icon = config ? config.icon : ShieldQuestion;

  return (
    <>
      <div className="border border-dashed rounded-lg p-4 space-y-3 bg-muted/30">
        <div className="flex items-center gap-2">
            <BrainCircuit className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-semibold">Consultar Reputación de Cliente</h3>
        </div>
        <p className="text-sm text-muted-foreground">
          Verifica el historial de pagos de un cliente en toda la plataforma usando IA.
        </p>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex gap-2">
            <FormField
              control={form.control}
              name="idNumber"
              render={({ field }) => (
                <FormItem className="flex-grow">
                  <FormControl>
                    <Input {...field} placeholder="Ingresa la cédula del cliente" disabled={isSearching} />
                  </FormControl>
                </FormItem>
              )}
            />
            <Button type="submit" disabled={isSearching}>
              {isSearching ? <Loader2 className="animate-spin" /> : <Search />}
              <span className="hidden sm:inline ml-2">Buscar</span>
            </Button>
          </form>
        </Form>
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Análisis de Reputación Crediticia</DialogTitle>
            <DialogDescription>
              {clientName ? `Resultado para ${clientName}` : "Evaluando historial del cliente..."}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {isSearching && !result && (
              <div className="flex flex-col items-center justify-center h-40 gap-4 text-center">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
                <p className="text-muted-foreground">Analizando historial con IA...<br/>Esto puede tardar unos segundos.</p>
              </div>
            )}
            {result && config && (
              <div className="space-y-6">
                <div className={cn("p-6 rounded-lg text-center border", config.color)}>
                  <Icon className="h-16 w-16 mx-auto mb-3" />
                  <p className="text-sm font-semibold uppercase tracking-wider">Recomendación</p>
                  <p className="text-3xl font-bold">{result.recommendation}</p>
                </div>
                
                <div className="text-center">
                    <p className="text-sm text-muted-foreground">Puntuación de Riesgo</p>
                    <p className="text-5xl font-bold text-primary">{result.riskScore}</p>
                    <p className="text-xs text-muted-foreground">(0 = Sin Riesgo, 100 = Riesgo Máximo)</p>
                </div>

                <div>
                    <h4 className="font-semibold mb-2">Resumen del Analista IA:</h4>
                    <p className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-md border">{result.summary}</p>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
