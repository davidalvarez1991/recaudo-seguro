
"use client";

import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getHistoricalCreditsByCliente, getUserData, getPaymentsByCreditId } from "@/lib/actions";
import { Loader2, History, ArrowLeft, ClipboardList, Download } from "lucide-react";
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { useToast } from "@/hooks/use-toast";

declare module 'jspdf' {
    interface jsPDF {
        autoTable: (options: any) => jsPDF;
    }
}

type HistoricalCredit = {
  id: string;
  fecha: string;
  valor: number;
  cuotas: number;
  estado: string;
  providerId: string;
  providerName: string;
  clienteName: string;
  commission: number;
};

const formatCurrency = (value: number) => {
  if (isNaN(value)) return "$0";
  return `$${value.toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
};

export default function HistorialClientePage() {
  const [credits, setCredits] = useState<HistoricalCredit[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        setLoading(true);
        const data = await getHistoricalCreditsByCliente();
        setCredits(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, []);

  const handleDownloadPDF = async (credit: HistoricalCredit) => {
    try {
        const doc = new jsPDF();
        const today = new Date();
        const formattedToday = format(today, "d 'de' MMMM, yyyy", { locale: es });

        const providerData = await getUserData(credit.providerId);
        const providerName = (providerData?.companyName || credit.providerName || 'N/A').toUpperCase();
        const paymentRecords = await getPaymentsByCreditId(credit.id);

        // Header
        doc.setFontSize(22);
        doc.setTextColor(41, 98, 255);
        doc.text("Paz y Salvo de Crédito", 105, 40, { align: 'center' });
        doc.setFontSize(10);
        doc.setTextColor(100);
        doc.text(`Cliente: ${credit.clienteName}`, 105, 47, { align: 'center' });

        // Watermark
        doc.setFontSize(72);
        doc.setTextColor(200);
        doc.text("PAGADO", 105, 160, { angle: 45, align: 'center' });
        
        // Body - Main Details
        doc.setFontSize(12);
        doc.setTextColor(0);
        
        const mainDetailsBody = [
            ['Empresa Prestadora', providerName],
            ['Fecha de Liquidación', formattedToday],
            ['Fecha de Inicio Crédito', format(new Date(credit.fecha), "d 'de' MMMM, yyyy", { locale: es })],
            ['Valor Solicitado', formatCurrency(credit.valor)],
            ['Número de Cuotas', credit.cuotas.toString()],
        ];

        doc.autoTable({
            startY: 60,
            head: [['Concepto', 'Detalle']],
            body: mainDetailsBody,
            theme: 'striped',
            headStyles: { fillColor: [41, 98, 255] },
            styles: { fontSize: 11 },
        });

        // Body - Payment History
        if (paymentRecords.length > 0) {
            const paymentHistoryBody = paymentRecords.map((payment, index) => [
                (index + 1).toString(),
                format(new Date(payment.date), "d 'de' MMMM, yyyy", { locale: es }),
                payment.type === 'interes' ? 'Abono a Interés' : 'Pago a Cuota'
            ]);
            
            doc.autoTable({
                startY: (doc as any).lastAutoTable.finalY + 10,
                head: [['#', 'Fecha de Pago', 'Tipo']],
                body: paymentHistoryBody,
                theme: 'grid',
                headStyles: { fillColor: [41, 98, 255] },
                styles: { fontSize: 10 },
            });
        }


        doc.setFontSize(10);
        doc.text("Este documento certifica que el crédito referenciado ha sido cancelado en su totalidad.", 14, (doc as any).lastAutoTable.finalY + 20);
        doc.text("Generado por Recaudo Seguro.", 14, (doc as any).lastAutoTable.finalY + 25);

        const fileName = `Paz_y_Salvo_${credit.clienteName.replace(/ /g, '_')}_${format(today, 'yyyy-MM-dd')}.pdf`;
        doc.save(fileName);
        
        toast({
            title: "Descarga Iniciada",
            description: "El paz y salvo se ha generado correctamente."
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
                    <History className="h-8 w-8 text-primary" />
                    Historial de Créditos
                </CardTitle>
                <CardDescription>
                    Aquí puedes ver todos tus créditos anteriores y descargar comprobantes.
                </CardDescription>
            </div>
            <Button asChild variant="outline" className="w-full sm:w-auto">
                <Link href="/dashboard/cliente">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Volver a Créditos Activos
                </Link>
            </Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center items-center h-40">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="ml-4 text-muted-foreground">Cargando tu historial...</p>
          </div>
        ) : credits.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fecha de Inicio</TableHead>
                <TableHead>Proveedor</TableHead>
                <TableHead>Valor Solicitado</TableHead>
                <TableHead>Estado Final</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {credits.map((credit) => (
                <TableRow key={credit.id}>
                  <TableCell>{format(new Date(credit.fecha), "d 'de' MMMM, yyyy", { locale: es })}</TableCell>
                  <TableCell>{credit.providerName}</TableCell>
                  <TableCell>{formatCurrency(credit.valor)}</TableCell>
                  <TableCell>
                    <Badge variant={credit.estado === 'Pagado' ? 'secondary' : 'outline'}>{credit.estado}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {credit.estado === 'Pagado' && (
                        <Button variant="outline" size="sm" onClick={() => handleDownloadPDF(credit)}>
                            <Download className="mr-2 h-4 w-4"/>
                            Paz y Salvo
                        </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="text-center text-muted-foreground py-16">
            <ClipboardList className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-semibold">No tienes historial de créditos</h3>
            <p className="text-sm">Tus créditos pagados o renovados aparecerán aquí.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
