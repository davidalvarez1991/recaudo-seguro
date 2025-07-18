"use client";

import { useState, useRef, ChangeEvent } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Upload } from "lucide-react";

export default function ProveedorDashboard() {
  const [logo, setLogo] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  return (
    <div className="grid gap-8">
      <Card>
        <CardHeader>
          <CardTitle className="text-3xl">Perfil de Proveedor</CardTitle>
          <CardDescription>Bienvenido a tu panel de proveedor.</CardDescription>
        </CardHeader>
        <CardContent>
          <p>Gestiona tus productos, servicios y visualiza tus recaudos.</p>
        </CardContent>
      </Card>

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
    </div>
  );
}
