
"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getCreditsByCliente } from "@/lib/actions";
import { Loader2, CheckCircle2, Circle, Wallet, HandCoins, FileText, User, Fingerprint, Coins, Landmark, Building, RefreshCcw, Share2 } from "lucide-react";
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import html2canvas from "html2canvas";
import { useToast } from "@/hooks/use-toast";

type CreditData = {
  id: string;
  clienteName?: string;
  clienteId?: string;
  providerName?: string;
  providerLogoUrl?: string;
  valor: number;
  commission: number;
  cuotas: number;
  paidInstallments: number;
  paymentDates: string[];
  totalLoanAmount: number;
  installmentAmount: number;
  remainingBalance: number;
  paidAmount: number;
  estado: string;
};

const formatCurrency = (value: number | undefined | null) => {
    if (value === undefined || value === null || isNaN(value)) {
        return "$0";
    }
    return `$${value.toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

export default function ClienteDashboard() {
  const [credits, setCredits] = useState<CreditData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [clientInfo, setClientInfo] = useState<{ name: string, id: string } | null>(null);
  const [activeTab, setActiveTab] = useState<string>("");
  const { toast } = useToast();
  
  const contentRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const fetchCreditData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getCreditsByCliente();
      if (data && data.length > 0) {
          setCredits(data);
          setClientInfo({ name: data[0].clienteName || 'Cliente', id: data[0].clienteId || '' });
          setActiveTab(data[0].id);
      } else {
          setCredits([]);
      }
    } catch (err) {
      setError("No se pudo cargar la información de tus créditos. Por favor, intenta de nuevo más tarde.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCreditData();
  }, [fetchCreditData]);
  
  const getAvatarFallback = (name?: string) => {
    if (!name) return 'P';
    return name.substring(0, 2).toUpperCase();
  }

  const handleShare = async () => {
    const elementToCapture = contentRefs.current[activeTab];
    if (!elementToCapture) {
      toast({ title: "Error", description: "No se pudo encontrar el contenido para compartir.", variant: "destructive" });
      return;
    }

    toast({ title: "Preparando imagen...", description: "Por favor espera un momento." });

    try {
        const canvas = await html2canvas(elementToCapture, { 
            useCORS: true,
            scale: 2, // Increase scale for better quality
            backgroundColor: '#FFFFFF', // Set a solid background color
        });
        const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/png'));
        
        if (!blob) {
            throw new Error("No se pudo generar la imagen.");
        }

        const file = new File([blob], 'estado-de-cuenta.png', { type: 'image/png' });

        if (navigator.canShare && navigator.canShare({ files: [file] })) {
            await navigator.share({
                files: [file],
                title: 'Estado de Cuenta',
                text: `Aquí está el estado de cuenta de ${clientInfo?.name || 'Cliente'}.`,
            });
        } else {
           toast({ title: "No se puede compartir", description: "Tu navegador no soporta la función de compartir archivos.", variant: "destructive" });
        }
    } catch (e) {
        console.error("Error al compartir:", e);
        toast({ title: "Error", description: "Ocurrió un error al intentar compartir la imagen.", variant: "destructive" });
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-1">
            <CardTitle className="text-3xl flex items-center gap-2">
                <User className="h-8 w-8 text-primary" />
                {clientInfo ? clientInfo.name : 'Tu Estado de Cuenta'}
            </CardTitle>
            <CardDescription className="flex items-center gap-2 pl-1">
                <Fingerprint className="h-4 w-4 text-muted-foreground" />
                {clientInfo ? `CC: ${clientInfo.id}` : 'Consulta el estado actual de tus créditos.'}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={handleShare} disabled={loading || credits.length === 0}>
                <Share2 className="h-4 w-4" />
                <span className="sr-only">Compartir</span>
            </Button>
            <Button variant="outline" size="icon" onClick={fetchCreditData} disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCcw className="h-4 w-4" />}
                <span className="sr-only">Actualizar</span>
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading && credits.length === 0 ? (
          <div className="flex justify-center items-center h-40">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="ml-4 text-muted-foreground">Cargando tu información...</p>
          </div>
        ) : error ? (
          <div className="text-center text-destructive py-8">
            <p>{error}</p>
          </div>
        ) : credits.length > 0 ? (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-1 sm:grid-cols-2 md:grid-cols-3 h-auto">
              {credits.map((credit) => (
                <TabsTrigger key={credit.id} value={credit.id} className="flex flex-col h-auto items-start p-2 text-left">
                  <div className="flex items-center gap-2">
                     <Avatar className="h-6 w-6">
                        <AvatarImage src={credit.providerLogoUrl} alt={credit.providerName} crossOrigin="anonymous" />
                        <AvatarFallback>{getAvatarFallback(credit.providerName)}</AvatarFallback>
                     </Avatar>
                     <span className="font-semibold">{credit.providerName || 'Proveedor Desconocido'}</span>
                  </div>
                  <span className="text-xs text-muted-foreground ml-8">{formatCurrency(credit.totalLoanAmount)}</span>
                </TabsTrigger>
              ))}
            </TabsList>
            {credits.map((credit) => (
              <TabsContent 
                key={credit.id} 
                value={credit.id} 
                className="mt-6"
                ref={(el) => { contentRefs.current[credit.id] = el; }}
              >
                <div className="space-y-8 p-4 bg-background">
                    {/* Credit Amounts */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="text-center bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-6">
                        <p className="text-sm font-medium text-blue-700 dark:text-blue-300 flex items-center justify-center gap-1.5"><Coins className="h-4 w-4"/> VALOR SOLICITADO</p>
                        <p className="text-4xl font-bold text-blue-600 dark:text-blue-400 tracking-tight">{formatCurrency(credit.valor)}</p>
                        </div>
                        <div className="text-center bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-6">
                        <p className="text-sm font-medium text-green-700 dark:text-green-300 flex items-center justify-center gap-1.5"><Landmark className="h-4 w-4"/> TOTAL A PAGAR</p>
                        <p className="text-4xl font-bold text-green-600 dark:text-green-400 tracking-tight">{formatCurrency(credit.totalLoanAmount)}</p>
                        </div>
                    </div>
                    
                    {/* Financial Summary */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-4 bg-red-50 dark:bg-red-900/30 rounded-lg border border-red-100 dark:border-red-900">
                            <div className="flex items-center gap-3">
                                <div className="p-3 bg-white rounded-full border shadow-sm">
                                <Wallet className="w-6 h-6 text-red-500" />
                                </div>
                                <div>
                                    <div className="text-sm text-red-600 dark:text-red-300">Saldo Pendiente</div>
                                    <div className="text-2xl font-bold text-red-700 dark:text-red-200">{formatCurrency(credit.remainingBalance)}</div>
                                </div>
                            </div>
                        </div>
                        <div className="p-4 bg-green-50 dark:bg-green-900/30 rounded-lg border border-green-100 dark:border-green-900">
                            <div className="flex items-center gap-3">
                                <div className="p-3 bg-white rounded-full border shadow-sm">
                                <HandCoins className="w-6 h-6 text-green-500" />
                                </div>
                                <div>
                                    <div className="text-sm text-green-600 dark:text-green-300">Total Pagado</div>
                                    <div className="text-2xl font-bold text-green-700 dark:text-green-200">{formatCurrency(credit.paidAmount)}</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Installments Breakdown */}
                    <div>
                    <h3 className="text-lg font-medium mb-4">Detalle de Cuotas</h3>
                    <div className="space-y-3">
                        {Array.from({ length: credit.cuotas }, (_, index) => {
                        const isPaid = index < credit.paidInstallments;
                        const paymentDate = credit.paymentDates[index] ? format(new Date(credit.paymentDates[index]), "d 'de' MMMM, yyyy", { locale: es }) : 'Fecha no definida';

                        return (
                            <div
                            key={index}
                            className={cn(
                                "flex items-center justify-between rounded-lg border p-4 transition-all",
                                isPaid ? "bg-muted text-muted-foreground" : "bg-background"
                            )}
                            >
                            <div className="flex items-center gap-4">
                                {isPaid ? (
                                <CheckCircle2 className="h-6 w-6 text-green-500 flex-shrink-0" />
                                ) : (
                                <Circle className="h-6 w-6 text-muted-foreground/30 flex-shrink-0" />
                                )}
                                <div>
                                <p className={cn("font-semibold", { "line-through": isPaid })}>
                                    Cuota {index + 1}
                                </p>
                                <p className="text-xs text-muted-foreground">{paymentDate}</p>
                                </div>
                            </div>
                            <p className={cn("font-bold text-lg", isPaid ? "text-muted-foreground" : "text-primary")}>
                                {formatCurrency(credit.installmentAmount)}
                            </p>
                            </div>
                        );
                        })}
                    </div>
                    </div>
                </div>
              </TabsContent>
            ))}
          </Tabs>
        ) : (
          <div className="text-center text-muted-foreground py-16">
            <FileText className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-semibold">No tienes créditos activos</h3>
            <p className="text-sm">Cuando tengas un crédito, su información aparecerá aquí.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
