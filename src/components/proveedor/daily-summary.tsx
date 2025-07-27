
"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { User, Users, DollarSign } from "lucide-react";

type DailySummaryProps = {
  summary: {
    cobradorId: string;
    cobradorName: string;
    collectedAmount: number;
  }[];
  total: number;
};

const formatCurrency = (value: number) => {
    if (isNaN(value)) return "$0";
    return `$${value.toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
};

export function DailySummary({ summary, total }: DailySummaryProps) {
  if (summary.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-8 border-2 border-dashed rounded-lg">
          <DollarSign className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-semibold">Sin Recaudos Hoy</h3>
          <p className="text-sm">Aún no se han registrado pagos en el día de hoy.</p>
      </div>
    );
  }

  return (
    <Card className="border-dashed bg-muted/30">
        <CardContent className="pt-6">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-[60%]">
                            <Users className="inline-block mr-2 h-4 w-4" />
                            Cobrador
                        </TableHead>
                        <TableHead className="text-right">
                             <DollarSign className="inline-block mr-2 h-4 w-4" />
                            Recaudado Hoy
                        </TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {summary.map((item) => (
                        <TableRow key={item.cobradorId}>
                            <TableCell className="font-medium">{item.cobradorName}</TableCell>
                            <TableCell className="text-right font-semibold text-primary">{formatCurrency(item.collectedAmount)}</TableCell>
                        </TableRow>
                    ))}
                     <TableRow className="bg-muted/80 hover:bg-muted/80">
                        <TableCell className="font-bold text-lg">Total General</TableCell>
                        <TableCell className="text-right font-bold text-lg text-green-600">{formatCurrency(total)}</TableCell>
                    </TableRow>
                </TableBody>
            </Table>
        </CardContent>
    </Card>
  );
}
