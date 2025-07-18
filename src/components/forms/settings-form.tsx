
"use client";

import { useState, useRef, ChangeEvent, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Upload, Save, Asterisk, Percent } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";

type SettingsFormProps = {
  providerId: string;
};

export function SettingsForm({ providerId }: SettingsFormProps) {
  const [logo, setLogo] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [commissionPercentage, setCommissionPercentage] = useState("20%");
  const [lateInterestRate, setLateInterestRate] = useState("2%");
  const [isLateInterestActive, setIsLateInterestActive] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (providerId) {
      const savedLogo = localStorage.getItem(`company-logo_${providerId}`);
      if (savedLogo) {
        setLogo(savedLogo);
      }
    }
  }, [providerId]);

  const handleLogoChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (!providerId) return;
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadstart = () => setIsUploading(true);
      reader.onloadend = () => {
        const result = reader.result as string;
        setLogo(result);
        localStorage.setItem(`company-logo_${providerId}`, result);
        window.dispatchEvent(new CustomEvent('logo-updated'));
        setIsUploading(false);
        toast({
          title: "Logo Actualizado",
          description: "El logo de tu empresa ha sido actualizado.",
          variant: "default",
          className: "bg-accent text-accent-foreground border-accent",
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };
  
  const handleSaveCommission = () => {
    toast({
      title: "Porcentaje Guardado",
      description: `El nuevo porcentaje de comisión (${commissionPercentage}) ha sido guardado.`,
      variant: "default",
      className: "bg-accent text-accent-foreground border-accent",
    });
  };

  const handleSaveLateInterest = () => {
    toast({
      title: "Configuración de Mora Guardada",
      description: `Interés por mora ${isLateInterestActive ? `activado al ${lateInterestRate}` : 'desactivado'}.`,
      variant: "default",
      className: "bg-accent text-accent-foreground border-accent",
    });
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
              <Upload className="mr-2 h-4 w-4" />
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
      <div className="space-y-6">
         <div className="space-y-1">
            <h3 className="text-lg font-medium">Fórmula de Comisión</h3>
            <p className="text-sm text-muted-foreground">Define el porcentaje de comisión para tus cobradores.</p>
        </div>
        <div className="flex flex-col sm:flex-row items-end gap-2">
          <div className="flex-1 w-full space-y-2">
            <Label htmlFor="credit-value">Valor del Crédito</Label>
            <Input 
                id="credit-value"
                value="Valor registrado por el cobrador"
                disabled
            />
          </div>
          <div className="pb-2 hidden sm:block">
            <Asterisk className="h-5 w-5 text-muted-foreground" />
          </div>
          <div className="w-full sm:w-40 space-y-2">
            <Label htmlFor="commission-percentage">Porcentaje</Label>
            <Input 
                id="commission-percentage"
                placeholder="20%"
                value={commissionPercentage}
                onChange={(e) => setCommissionPercentage(e.target.value)}
            />
          </div>
        </div>
         <Button onClick={handleSaveCommission} className="w-full sm:w-auto">
            <Save className="mr-2 h-4 w-4" />
            Guardar Porcentaje
         </Button>
      </div>

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
              placeholder="2%"
              value={lateInterestRate}
              onChange={(e) => setLateInterestRate(e.target.value)}
              disabled={!isLateInterestActive}
              className="pl-8"
            />
            <Percent className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
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
