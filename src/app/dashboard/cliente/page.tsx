
"use client";

import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { getCreditsByCliente } from "@/lib/actions";
import { Loader2, CheckCircle2, Circle, Wallet, HandCoins, FileText } from "lucide-react";
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from "@/lib/utils";

type CreditData = {
  id: string;
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
  const [credit, setCredit] = useState<CreditData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCreditData = async () => {
      try {
        setLoading(true);
        const data = await getCreditsByCliente();
        setCredit(data);
      } catch (err) {
        setError("No se pudo cargar la información de tu crédito. Por favor, intenta de nuevo más tarde.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchCreditData();
  }, []);

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-1">
            <CardTitle className="text-3xl">Tu Estado de Cuenta</CardTitle>
            <CardDescription>Consulta el estado actual de tu crédito.</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center items-center h-40">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="ml-4 text-muted-foreground">Cargando tu información...</p>
          </div>
        ) : error ? (
          <div className="text-center text-destructive py-8">
            <p>{error}</p>
          </div>
        ) : credit ? (
          <div className="space-y-8">
            {/* Total Credit Amount */}
            <div className="text-center bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-6">
              <p className="text-sm font-medium text-green-700 dark:text-green-300">VALOR TOTAL DEL CRÉDITO</p>
              <p className="text-5xl font-bold text-green-600 dark:text-green-400 tracking-tight">{formatCurrency(credit.totalLoanAmount)}</p>
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
                 <div className="p-4 bg-blue-50 dark:bg-blue-900/30 rounded-lg border border-blue-100 dark:border-blue-900">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-white rounded-full border shadow-sm">
                           <HandCoins className="w-6 h-6 text-blue-500" />
                        </div>
                        <div>
                            <div className="text-sm text-blue-600 dark:text-blue-300">Total Pagado</div>
                            <div className="text-2xl font-bold text-blue-700 dark:text-blue-200">{formatCurrency(credit.paidAmount)}</div>
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
