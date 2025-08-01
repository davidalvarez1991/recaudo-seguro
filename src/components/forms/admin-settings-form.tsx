
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Save, DollarSign, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Label } from "@/components/ui/label";
import { getAdminSettings, saveAdminSettings } from "@/lib/actions";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

type AdminSettingsFormProps = {
  adminId: string;
};

const formatCurrencyForInput = (value: number | string): string => {
    if (value === undefined || value === null || value === "") return "";
    if (typeof value === 'number') {
        value = value.toString();
    }
    const numberValue = parseInt(value.replace(/\D/g, ''), 10);
    if (isNaN(numberValue)) return "";
    return new Intl.NumberFormat('es-CO', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(numberValue);
};

export function AdminSettingsForm({ adminId }: AdminSettingsFormProps) {
  const [pricePerClient, setPricePerClient] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const { toast } = useToast();

  useEffect(() => {
    const fetchSettings = async () => {
      setIsLoading(true);
      try {
        const settings = await getAdminSettings();
        setPricePerClient(formatCurrencyForInput(settings.pricePerClient || 3500));
      } catch (error) {
        toast({ title: "Error", description: "No se pudieron cargar los ajustes.", variant: "destructive" });
      } finally {
        setIsLoading(false);
      }
    };
    fetchSettings();
  }, [toast]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
        const numericPrice = parseInt(pricePerClient.replace(/\D/g, ''), 10);
        if (isNaN(numericPrice) || numericPrice <= 0) {
            toast({ title: "Valor inválido", description: "El precio por cliente debe ser un número positivo.", variant: "destructive" });
            return;
        }

        const result = await saveAdminSettings({ pricePerClient: numericPrice });
        if (result.success) {
          toast({
            title: "Configuración Guardada",
            description: "Tus ajustes se han guardado correctamente.",
            variant: "default",
            className: "bg-accent text-accent-foreground border-accent",
          });
        } else {
           toast({ title: "Error", description: result.error, variant: "destructive" });
        }
    } finally {
        setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-48">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8 pt-6">
      <Card className="border-dashed">
        <CardHeader>
          <CardTitle>Modelo de Suscripción</CardTitle>
          <CardDescription>
            Establece el costo mensual que cada proveedor pagará por cada cliente único que gestione en la plataforma.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
           <div className="space-y-2">
                <Label htmlFor="price-per-client">Precio por Cliente</Label>
                <div className="relative">
                <DollarSign className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                    id="price-per-client"
                    value={pricePerClient}
                    onChange={(e) => setPricePerClient(formatCurrencyForInput(e.target.value))}
                    className="pl-8"
                    placeholder="3.500"
                    disabled={isSaving}
                />
                </div>
            </div>
            <div className="flex justify-end">
                <Button onClick={handleSave} disabled={isSaving}>
                    {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                    {isSaving ? 'Guardando...' : 'Guardar Configuración'}
                </Button>
            </div>
        </CardContent>
      </Card>
    </div>
  );
}
