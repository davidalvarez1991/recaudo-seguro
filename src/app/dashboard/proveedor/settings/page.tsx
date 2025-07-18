"use client";

import { useState, useRef, ChangeEvent } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Upload, ArrowLeft, Save, Asterisk } from "lucide-react";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";
import { Label } from "@/components/ui/label";

export default function SettingsPage() {
  const [logo, setLogo] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [commissionPercentage, setCommissionPercentage] = useState("20%");
  const { toast } = useToast();

  const handleLogoChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadstart = () => setIsUploading(true);
      reader.onloadend = () => {
        setLogo(reader.result as string);
        setIsUploading(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };
  
  const handleSaveCommission = () => {
    // In a real application, you would save this percentage to your backend.
    console.log("Saving commission percentage:", commissionPercentage);
    toast({
      title: "Porcentaje Guardado",
      description: `El nuevo porcentaje de comisión (${commissionPercentage}) ha sido guardado.`,
      variant: "default",
      className: "bg-accent text-accent-foreground border-accent",
    });
  };

  return (
    <div className="grid gap-8">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <CardTitle className="text-3xl">Configuración</CardTitle>
              <CardDescription>
                Gestiona la configuración de tu perfil de proveedor.
              </CardDescription>
            </div>
            <Button asChild variant="outline">
              <Link href="/dashboard/proveedor">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Volver
              </Link>
            </Button>
          </div>
        </CardHeader>
      </Card>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle>Logo de la Empresa</CardTitle>
            <CardDescription>Sube o actualiza el logo de tu empresa.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-6 md:flex-row">
            <Avatar className="h-32 w-32 border">
              <AvatarImage src={logo || "https://placehold.co/200x200.png"} data-ai-hint="company logo" alt="Logo de la empresa" />
              <AvatarFallback>LOGO</AvatarFallback>
            </Avatar>
            <div className="flex flex-col gap-4">
               <Input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleLogoChange}
                  className="hidden"
                  accept="image/png, image/jpeg, image/gif"
                  disabled={isUploading}
                />
              <Button onClick={handleUploadClick} disabled={isUploading}>
                <Upload className="mr-2 h-4 w-4" />
                {isUploading ? "Cargando..." : "Subir Logo"}
              </Button>
              <p className="text-sm text-muted-foreground">
                Se recomienda un archivo PNG, JPG o GIF de 200x200px.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Fórmula de Comisión</CardTitle>
            <CardDescription>Define el porcentaje de comisión para tus cobradores.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="flex-1 space-y-2">
                <Label htmlFor="credit-value">Valor del Crédito</Label>
                <Input 
                    id="credit-value"
                    value="Valor registrado por el cobrador"
                    disabled
                />
              </div>
              <div className="self-end pb-2">
                <Asterisk className="h-5 w-5 text-muted-foreground" />
              </div>
              <div className="w-32 space-y-2">
                <Label htmlFor="commission-percentage">Porcentaje</Label>
                <Input 
                    id="commission-percentage"
                    placeholder="20%"
                    value={commissionPercentage}
                    onChange={(e) => setCommissionPercentage(e.target.value)}
                />
              </div>
            </div>
             <Button onClick={handleSaveCommission}>
                <Save className="mr-2 h-4 w-4" />
                Guardar Porcentaje
             </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
