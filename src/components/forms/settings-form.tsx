
"use client";

import { useState, useRef, ChangeEvent, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Upload, Save, Percent, Trash2, PlusCircle, DollarSign, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { getUserData, saveProviderSettings } from "@/lib/actions";
import { storage } from "@/lib/firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";


type CommissionTier = {
  minAmount: number;
  maxAmount: number;
  percentage: number;
};

type SettingsFormProps = {
  providerId: string;
};

const formatCurrencyForInput = (value: number | string): string => {
    if (value === undefined || value === null || value === 0 || value === "0") return "";
    if (typeof value === 'number') {
        value = value.toString();
    }
    const numberValue = parseInt(value.replace(/\D/g, ''), 10);
    if (isNaN(numberValue)) return "";
    return new Intl.NumberFormat('es-CO').format(numberValue);
};

export function SettingsForm({ providerId }: SettingsFormProps) {
  const [logo, setLogo] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [commissionTiers, setCommissionTiers] = useState<CommissionTier[]>([]);
  const [lateInterestRate, setLateInterestRate] = useState("2");
  const [isLateInterestActive, setIsLateInterestActive] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const fetchUserData = async () => {
      if (providerId) {
        const userData = await getUserData(providerId);
        if (userData) {
          setLogo(userData.companyLogoUrl || null);
          setLateInterestRate((userData.lateInterestRate || 2).toString());
          setIsLateInterestActive(userData.isLateInterestActive || false);
          
          if (userData.commissionTiers && userData.commissionTiers.length > 0) {
              setCommissionTiers(userData.commissionTiers);
          } else {
              // Set a default tier if none exist
              setCommissionTiers([{ minAmount: 0, maxAmount: 50000000, percentage: userData.commissionPercentage || 20 }]);
          }
        }
      }
    };
    fetchUserData();
  }, [providerId]);


  const handleLogoChange = async (event: ChangeEvent<HTMLInputElement>) => {
    if (!providerId) return;
    const file = event.target.files?.[0];
    if (file) {
      // Create a temporary URL for instant preview
      const previewUrl = URL.createObjectURL(file);
      setLogo(previewUrl); // Show preview immediately

      setIsUploading(true);
      const storagePath = `proveedores/${providerId}/logo/${file.name}`;
      const storageRef = ref(storage, storagePath);

      try {
        await uploadBytes(storageRef, file);
        const downloadURL = await getDownloadURL(storageRef);
        
        await saveProviderSettings(providerId, { companyLogoUrl: downloadURL });

        // Update with the final URL from storage
        setLogo(downloadURL);
        localStorage.setItem(`company-logo_${providerId}`, downloadURL);
        window.dispatchEvent(new CustomEvent('logo-updated'));
        
        toast({
          title: "Logo Actualizado",
          description: "El logo de tu empresa ha sido actualizado.",
          variant: "default",
          className: "bg-accent text-accent-foreground border-accent",
        });

      } catch (error) {
        console.error("Error uploading logo:", error);
        toast({
          title: "Error de carga",
          description: "No se pudo subir el nuevo logo.",
          variant: "destructive"
        });
        // If upload fails, revoke the preview URL to avoid memory leaks
        URL.revokeObjectURL(previewUrl);
        // Optionally revert to the old logo if you have it stored
      } finally {
        setIsUploading(false);
      }
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };
  
  const handleCommissionTierChange = (index: number, field: keyof CommissionTier, value: string) => {
    const numericValue = parseInt(value.replace(/\D/g, ''), 10);
    
    const newTiers = [...commissionTiers];
    newTiers[index] = { ...newTiers[index], [field]: isNaN(numericValue) ? 0 : numericValue };
    setCommissionTiers(newTiers);
  };

  const addCommissionTier = () => {
    if (commissionTiers.length < 4) {
      setCommissionTiers([...commissionTiers, { minAmount: 0, maxAmount: 0, percentage: 0 }]);
    } else {
      toast({ title: "Límite alcanzado", description: "Puedes configurar un máximo de 4 tramos de comisión.", variant: "destructive" });
    }
  };

  const removeCommissionTier = (index: number) => {
    if (commissionTiers.length > 1) {
        const newTiers = commissionTiers.filter((_, i) => i !== index);
        setCommissionTiers(newTiers);
    } else {
        toast({ title: "Acción no permitida", description: "Debe haber al menos un tramo de comisión.", variant: "destructive" });
    }
  };

  const handleSaveCommissions = async () => {
    // Basic validation
    for (const tier of commissionTiers) {
      if (tier.minAmount >= tier.maxAmount && tier.maxAmount !== 0) {
        toast({ title: "Error de validación", description: `El monto mínimo (${formatCurrencyForInput(tier.minAmount)}) debe ser menor que el máximo (${formatCurrencyForInput(tier.maxAmount)}) en un tramo.`, variant: "destructive" });
        return;
      }
      if (tier.percentage <= 0 || tier.percentage > 100) {
        toast({ title: "Error de validación", description: `El porcentaje (${tier.percentage}%) debe estar entre 1 y 100.`, variant: "destructive" });
        return;
      }
    }
    
    const result = await saveProviderSettings(providerId, { commissionTiers: commissionTiers });
    if (result.success) {
      toast({
        title: "Comisiones Guardadas",
        description: "La nueva estructura de comisiones ha sido guardada.",
        variant: "default",
        className: "bg-accent text-accent-foreground border-accent",
      });
    } else {
       toast({ title: "Error", description: result.error, variant: "destructive" });
    }
  };

  const handleSaveLateInterest = async () => {
     const rate = parseFloat(lateInterestRate);
     if (isNaN(rate)) {
        toast({ title: "Error", description: "La tasa de interés debe ser un número.", variant: "destructive" });
        return;
    }
    const result = await saveProviderSettings(providerId, { lateInterestRate: rate, isLateInterestActive });
     if (result.success) {
      toast({
        title: "Configuración de Mora Guardada",
        description: `Interés por mora ${isLateInterestActive ? `activado al ${rate}%` : 'desactivado'}.`,
        variant: "default",
        className: "bg-accent text-accent-foreground border-accent",
      });
    } else {
        toast({ title: "Error", description: result.error, variant: "destructive" });
    }
  };

  return (
    <div className="space-y-8 pt-6">

      {/* Logo Section */}
      <div className="space-y-6">
        <div className="space-y-1">
            <h3 className="text-lg font-medium">Logo de la Empresa</h3>
            <p className="text-sm text-muted-foreground">Sube o actualiza el logo de tu empresa.</p>
        </div>
        <div className="flex flex-col items-start gap-6 sm:flex-row sm:items-center">
          <Avatar className="h-24 w-24 border">
            <AvatarImage src={logo || "https://placehold.co/200x200.png"} data-ai-hint="company logo" alt="Logo de la empresa" />
            <AvatarFallback>LOGO</AvatarFallback>
          </Avatar>
          <div className="flex flex-col gap-2 w-full sm:w-auto">
             <Input
                type="file"
                ref={fileInputRef}
                onChange={handleLogoChange}
                className="hidden"
                accept="image/png, image/jpeg, image/gif"
                disabled={isUploading || !providerId}
              />
            <Button onClick={handleUploadClick} disabled={isUploading || !providerId} className="w-full sm:w-auto">
              {isUploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
              {isUploading ? "Cargando..." : "Subir Logo"}
            </Button>
            <p className="text-xs text-muted-foreground">
              PNG, JPG o GIF (Recomendado 200x200px).
            </p>
          </div>
        </div>
      </div>

      <Separator />

      {/* Commission Section */}
      <Card className="border-dashed">
        <CardHeader>
          <CardTitle>Fórmula de Comisión por Tramos</CardTitle>
          <CardDescription>
            Define hasta 4 rangos de comisión diferentes según el monto del préstamo.
            El sistema aplicará automáticamente el porcentaje correspondiente.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {commissionTiers.map((tier, index) => (
            <div key={index} className="flex flex-col md:flex-row items-center gap-2 border p-4 rounded-lg relative">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 flex-1 w-full">
                <div className="space-y-2">
                  <Label htmlFor={`min-amount-${index}`}>Monto Mínimo</Label>
                  <div className="relative">
                    <DollarSign className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id={`min-amount-${index}`}
                      value={formatCurrencyForInput(tier.minAmount)}
                      onChange={(e) => handleCommissionTierChange(index, 'minAmount', e.target.value)}
                      className="pl-8"
                      placeholder="0"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`max-amount-${index}`}>Monto Máximo</Label>
                  <div className="relative">
                     <DollarSign className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id={`max-amount-${index}`}
                      value={formatCurrencyForInput(tier.maxAmount)}
                      onChange={(e) => handleCommissionTierChange(index, 'maxAmount', e.target.value)}
                      className="pl-8"
                      placeholder="500.000"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`percentage-${index}`}>Porcentaje</Label>
                  <div className="relative">
                    <Input
                      id={`percentage-${index}`}
                      type="number"
                      value={tier.percentage === 0 ? "" : tier.percentage}
                      onChange={(e) => handleCommissionTierChange(index, 'percentage', e.target.value)}
                      className="pr-8"
                      placeholder="20"
                    />
                    <Percent className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  </div>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => removeCommissionTier(index)}
                className="text-destructive hover:bg-destructive/10 absolute -top-3 -right-3 sm:relative sm:top-auto sm:right-auto"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
          <div className="flex flex-col sm:flex-row gap-2 pt-4">
            <Button onClick={addCommissionTier} variant="outline" className="w-full sm:w-auto" disabled={commissionTiers.length >= 4}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Añadir Tramo
            </Button>
            <Button onClick={handleSaveCommissions} className="w-full sm:w-auto">
                <Save className="mr-2 h-4 w-4" />
                Guardar Comisiones
            </Button>
          </div>
        </CardContent>
      </Card>

      <Separator />
      
      {/* Late Interest Section */}
      <div className="space-y-6">
         <div className="space-y-1">
            <h3 className="text-lg font-medium">Interés por Día de Mora</h3>
            <p className="text-sm text-muted-foreground">Aplica un interés diario a los pagos atrasados.</p>
        </div>
        <div className="flex items-center justify-between rounded-lg border p-4">
          <div className="space-y-0.5">
            <Label htmlFor="late-interest-switch" className="text-base font-semibold">Activar Interés por Mora</Label>
            <p className="text-sm text-muted-foreground">
              Habilita o deshabilita el cálculo automático.
            </p>
          </div>
          <Switch
            id="late-interest-switch"
            checked={isLateInterestActive}
            onCheckedChange={setIsLateInterestActive}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="late-interest-rate">Tasa de Interés Diario (%)</Label>
          <div className="relative">
            <Input 
              id="late-interest-rate"
              placeholder="2"
              value={lateInterestRate}
              onChange={(e) => setLateInterestRate(e.target.value)}
              disabled={!isLateInterestActive}
              className="pr-8"
            />
            <Percent className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          </div>
        </div>
        
        <Button onClick={handleSaveLateInterest} className="w-full sm:w-auto">
          <Save className="mr-2 h-4 w-4" />
          Guardar Configuración de Mora
        </Button>
      </div>
    </div>
  );
}
