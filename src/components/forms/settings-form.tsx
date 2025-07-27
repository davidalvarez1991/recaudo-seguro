
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
import { getUserData, saveProviderSettings } from "@/lib/actions";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "@/lib/firebase";

type SettingsFormProps = {
  providerId: string;
};

export function SettingsForm({ providerId }: SettingsFormProps) {
  const [logo, setLogo] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [commissionPercentage, setCommissionPercentage] = useState("20");
  const [lateInterestRate, setLateInterestRate] = useState("2");
  const [isLateInterestActive, setIsLateInterestActive] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const fetchUserData = async () => {
      if (providerId) {
        const userData = await getUserData(providerId);
        if (userData) {
          setLogo(userData.companyLogoUrl || null);
          setCommissionPercentage((userData.commissionPercentage || 20).toString());
          setLateInterestRate((userData.lateInterestRate || 2).toString());
          setIsLateInterestActive(userData.isLateInterestActive || false);
        }
      }
    };
    fetchUserData();
  }, [providerId]);


  const handleLogoChange = async (event: ChangeEvent<HTMLInputElement>) => {
    if (!providerId) return;
    const file = event.target.files?.[0];
    if (file) {
      setIsUploading(true);
      const storagePath = `proveedores/${providerId}/logo/${file.name}`;
      const storageRef = ref(storage, storagePath);

      try {
        await uploadBytes(storageRef, file);
        const downloadURL = await getDownloadURL(storageRef);
        
        await saveProviderSettings(providerId, { companyLogoUrl: downloadURL });

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
      } finally {
        setIsUploading(false);
      }
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };
  
  const handleSaveCommission = async () => {
    const percentage = parseFloat(commissionPercentage);
    if (isNaN(percentage)) {
        toast({ title: "Error", description: "El porcentaje de comisión debe ser un número.", variant: "destructive" });
        return;
    }
    const result = await saveProviderSettings(providerId, { commissionPercentage: percentage });
     if (result.success) {
      toast({
        title: "Porcentaje Guardado",
        description: `El nuevo porcentaje de comisión (${percentage}%) ha sido guardado.`,
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
             <div className="relative">
                <Input 
                    id="commission-percentage"
                    placeholder="20"
                    value={commissionPercentage}
                    onChange={(e) => setCommissionPercentage(e.target.value)}
                    className="pr-8"
                />
                <Percent className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              </div>
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
