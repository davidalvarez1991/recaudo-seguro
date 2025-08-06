
"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { FileText, ArrowLeft, Loader2, Download, ShieldCheck, RefreshCw } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { getClientContracts } from "@/lib/actions";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import jsPDF from "jspdf";
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";

type Contract = {
  id: string;
  creditId: string;
  providerName: string;
  creditAmount: number;
  acceptedAt: string;
  contractText: string;
};

const formatCurrency = (value: number) => {
    if (isNaN(value)) return "$0";
    return `$${value.toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
};

export default function ContratosPage() {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchContracts = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getClientContracts();
      setContracts(data);
    } catch (err) {
      console.error("Error fetching contracts:", err);
      toast({
        title: "Error",
        description: "No se pudieron cargar tus contratos.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchContracts();
  }, [fetchContracts]);

  const handleDownloadPDF = (contract: Contract) => {
    try {
      const doc = new jsPDF();
      
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 15;
      const usableWidth = pageWidth - 2 * margin;

      doc.setFont("helvetica", "bold");
      doc.setFontSize(16);
      doc.text("Contrato de Préstamo - Recaudo Seguro", pageWidth / 2, 20, { align: "center" });

      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      
      let finalY = 35;
      const lines = doc.splitTextToSize(contract.contractText, usableWidth);
      doc.text(lines, margin, finalY);
      finalY += (lines.length * doc.getLineHeight()) / doc.internal.scaleFactor;
      
      // Disclaimer watermark at the bottom
      const disclaimer = "Los contratos y facturas generadas a través de Recaudo Seguro son herramientas exclusivas que ofrece la app para facilitar la trazabilidad y respaldo documental entre el comercio y el cliente. Estas funciones son utilizadas directamente por los usuarios y no implican que la app gestione, administre o participe en los acuerdos de cobro.\nRecaudo Seguro actúa únicamente como una plataforma tecnológica de apoyo y no interviene en la relación contractual ni en las transacciones financieras entre las partes.";
      
      doc.setFontSize(7);
      doc.setTextColor("#cccccc"); // Light gray color
      const disclaimerLines = doc.splitTextToSize(disclaimer, usableWidth);
      const disclaimerHeight = (disclaimerLines.length * doc.getLineHeight()) / doc.internal.scaleFactor;
      const disclaimerY = pageHeight - disclaimerHeight - 10; // 10 units from bottom
      doc.text(disclaimerLines, margin, disclaimerY);


      const fileName = `Contrato_${contract.providerName.replace(/ /g, '_')}_${format(new Date(contract.acceptedAt), 'yyyy-MM-dd')}.pdf`;
      doc.save(fileName);
      
      toast({
        title: "Descarga Iniciada",
        description: "El contrato se ha generado correctamente."
      });

    } catch (e) {
      console.error("Error generating PDF", e);
      toast({
          title: "Error",
          description: "No se pudo generar el documento PDF.",
          variant: "destructive"
      });
    }
  };


  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="space-y-1">
                <CardTitle className="text-3xl flex items-center gap-2">
                    <FileText className="h-8 w-8 text-primary" />
                    Contratos y Documentos
                </CardTitle>
                <CardDescription>
                    Aquí podrás ver y descargar todos los documentos de tus créditos vigentes.
                </CardDescription>
            </div>
             <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                <Button onClick={fetchContracts} variant="outline" disabled={loading}>
                    {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
                    Actualizar
                </Button>
                <Button asChild variant="outline" className="w-full sm:w-auto">
                    <Link href="/dashboard/cliente">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Volver a Mis Créditos
                    </Link>
                </Button>
            </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center items-center h-40">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="ml-4 text-muted-foreground">Cargando tus contratos...</p>
          </div>
        ) : contracts.length > 0 ? (
          <Accordion type="single" collapsible className="w-full space-y-4">
            {contracts.map((contract) => (
              <AccordionItem key={contract.id} value={contract.id} className="border rounded-lg bg-card">
                 <AccordionTrigger className="px-4 py-3 hover:no-underline text-left">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center w-full gap-2">
                    <div className="flex-1 space-y-1">
                      <p className="font-semibold text-primary">Contrato con {contract.providerName}</p>
                      <p className="text-sm text-muted-foreground">Monto: {formatCurrency(contract.creditAmount)}</p>
                    </div>
                    <p className="text-xs text-muted-foreground self-start sm:self-center pt-1">
                      Aceptado: {format(new Date(contract.acceptedAt), "d 'de' MMMM, yyyy", { locale: es })}
                    </p>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-4 pb-4">
                  <div className="space-y-4">
                     <ScrollArea className="h-80 w-full rounded-md border p-4 whitespace-pre-wrap font-mono text-xs bg-muted/50">
                        {contract.contractText}
                     </ScrollArea>
                     <Button onClick={() => handleDownloadPDF(contract)}>
                        <Download className="mr-2 h-4 w-4" />
                        Descargar PDF
                     </Button>
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        ) : (
          <div className="text-center text-muted-foreground py-16">
            <ShieldCheck className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-semibold">No tienes contratos vigentes</h3>
            <p className="text-sm">Cuando aceptes un contrato de crédito, aparecerá aquí.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
