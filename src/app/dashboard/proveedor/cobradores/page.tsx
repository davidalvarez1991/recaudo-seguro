
"use client";

import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, UserCircle, Trash2 } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { useState, useEffect } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { deleteCobrador } from "@/lib/actions";
import { useToast } from "@/hooks/use-toast";

type Cobrador = {
  id: string;
  name: string;
  idNumber: string;
  status: string;
  providerId: string;
};

export default function GestionCobradoresPage() {
  const [cobradores, setCobradores] = useState<Cobrador[]>([]);
  const [providerId, setProviderId] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    // Function to get a cookie by name
    const getCookie = (name: string): string | null => {
      const value = `; ${document.cookie}`;
      const parts = value.split(`; ${name}=`);
      if (parts.length === 2) return parts.pop()?.split(';').shift() || null;
      return null;
    };
    const currentProviderId = getCookie('loggedInUser');
    setProviderId(currentProviderId);

    const fetchCobradores = () => {
        if (!currentProviderId) return;
        const cobradoresKey = `cobradores_${currentProviderId}`;
        const storedCobradoresRaw = localStorage.getItem(cobradoresKey);
        if (storedCobradoresRaw) {
            setCobradores(JSON.parse(storedCobradoresRaw));
        } else {
            setCobradores([]);
        }
    };

    const handleCobradoresUpdate = () => fetchCobradores();
    
    fetchCobradores();
    
    window.addEventListener('cobradores-updated', handleCobradoresUpdate);
    
    return () => {
      window.removeEventListener('cobradores-updated', handleCobradoresUpdate);
    };
  }, []);

  const handleDelete = async (idNumber: string) => {
    if (!providerId) return;
    const serverResult = await deleteCobrador(idNumber);

    if (serverResult.success) {
      const cobradoresKey = `cobradores_${providerId}`;
      const storedCobradoresRaw = localStorage.getItem(cobradoresKey);
      if (storedCobradoresRaw) {
          let storedCobradores: Cobrador[] = JSON.parse(storedCobradoresRaw);
          const updatedCobradores = storedCobradores.filter(c => c.idNumber !== idNumber);
          localStorage.setItem(cobradoresKey, JSON.stringify(updatedCobradores));
          window.dispatchEvent(new CustomEvent('cobradores-updated'));
      }

      toast({
        title: "Cobrador Eliminado",
        description: "El perfil del cobrador ha sido eliminado correctamente.",
        variant: "default",
        className: "bg-accent text-accent-foreground border-accent",
      });
    } else {
      toast({
        title: "Error",
        description: serverResult.error || "No se pudo eliminar el cobrador.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="flex flex-col gap-8">
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="space-y-1">
              <h1 className="text-3xl font-bold tracking-tight">Gestión de Cobradores</h1>
              <p className="text-muted-foreground">
              Visualiza y administra las cuentas de tus cobradores.
              </p>
          </div>
          <Button asChild variant="outline">
              <Link href="/dashboard/proveedor">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Volver al Panel
              </Link>
          </Button>
        </div>
      </div>

      {cobradores.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {cobradores.map((cobrador) => (
            <Card key={cobrador.id} className="flex flex-col">
              <CardHeader className="flex flex-row items-center gap-4">
                  <UserCircle className="w-12 h-12 text-muted-foreground" />
                  <div className="grid gap-1">
                      <CardTitle>{cobrador.name}</CardTitle>
                      <CardDescription>ID: {cobrador.idNumber}</CardDescription>
                  </div>
              </CardHeader>
              <CardContent className="flex items-center justify-between mt-auto">
                <div>
                  <span className="text-sm text-muted-foreground">Estado</span>
                  <Badge variant={cobrador.status === 'Activo' ? 'default' : 'secondary'} className="ml-2">
                    {cobrador.status}
                  </Badge>
                </div>
              </CardContent>
              <CardFooter className="pt-4 border-t">
                 <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" className="w-full">
                      <Trash2 className="mr-2 h-4 w-4" />
                      Eliminar
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Esta acción no se puede deshacer. Se eliminará permanentemente
                        el perfil del cobrador y todos sus datos asociados.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction onClick={() => handleDelete(cobrador.idNumber)}>
                        Continuar
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
            <CardContent className="pt-6">
                <div className="text-center text-muted-foreground py-8">
                    <UserCircle className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                    <h3 className="text-lg font-semibold">No hay cobradores registrados</h3>
                    <p className="text-sm">Crea un nuevo cobrador desde tu panel de proveedor para empezar.</p>
                </div>
            </CardContent>
        </Card>
      )}
    </div>
  );
}
