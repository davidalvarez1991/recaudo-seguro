
"use client";

import { useState, useEffect, useTransition } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, User, MoreHorizontal, Pencil, Trash2, Loader2, RefreshCw, CheckCircle, Ban, Eye } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { getAllProviders, toggleProviderStatus, deleteProvider } from "@/lib/actions";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";

type Provider = {
  id: string;
  companyName: string;
  idNumber: string;
  email: string;
  isActive: boolean;
};

export default function AdminProvidersPage() {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProvider, setSelectedProvider] = useState<Provider | null>(null);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const router = useRouter();

  const fetchProviders = async () => {
    setLoading(true);
    try {
      const data = await getAllProviders();
      setProviders(data);
    } catch (error) {
      console.error("Failed to fetch providers", error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los datos de los proveedores.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProviders();
  }, []);

  const handleDelete = (provider: Provider) => {
    setSelectedProvider(provider);
    setIsDeleteAlertOpen(true);
  };

  const confirmDelete = async () => {
    if (!selectedProvider) return;
    setIsProcessing(true);
    const result = await deleteProvider(selectedProvider.id);
    if (result.success) {
      toast({
        title: "Proveedor Eliminado",
        description: `La cuenta de ${selectedProvider.companyName} ha sido eliminada.`,
        className: "bg-accent text-accent-foreground border-accent",
      });
      fetchProviders();
    } else {
      toast({
        title: "Error",
        description: result.error || "No se pudo eliminar el proveedor.",
        variant: "destructive",
      });
    }
    setIsProcessing(false);
    setIsDeleteAlertOpen(false);
  };
  
  const handleToggleStatus = (provider: Provider) => {
      startTransition(async () => {
          const result = await toggleProviderStatus(provider.id, !provider.isActive);
           if (result.success) {
                toast({
                    title: "Estado Actualizado",
                    description: `El estado de ${provider.companyName} ahora es ${!provider.isActive ? 'Activo' : 'Inactivo'}.`,
                });
                fetchProviders(); // Refresh the list
            } else {
                toast({
                    title: "Error",
                    description: result.error || "No se pudo cambiar el estado del proveedor.",
                    variant: "destructive",
                });
            }
      });
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div className="space-y-1 flex-1">
                <h1 className="text-3xl font-bold tracking-tight">Gestión de Proveedores</h1>
                <p className="text-muted-foreground">
                Activa, desactiva y administra todas las cuentas de proveedores.
                </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                <Button onClick={fetchProviders} variant="outline" className="w-full" disabled={loading}>
                    {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
                    Actualizar
                </Button>
                <Button asChild variant="outline" className="w-full">
                    <Link href="/dashboard/admin">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Volver al Panel
                    </Link>
                </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
             <div className="flex justify-center items-center h-40">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
             </div>
          ) : providers.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {providers.map((provider) => (
                <Card key={provider.id} className="flex flex-col">
                  <CardHeader className="flex flex-row items-start justify-between">
                      <div className="flex items-center gap-4">
                          <User className="w-12 h-12 text-muted-foreground" />
                          <div className="grid gap-1">
                              <CardTitle>{provider.companyName}</CardTitle>
                              <CardDescription>{provider.email}</CardDescription>
                          </div>
                      </div>
                       <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <MoreHorizontal className="h-4 w-4" />
                              </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                              <DropdownMenuItem disabled>
                                  <Pencil className="mr-2 h-4 w-4" />
                                  Editar (Próximamente)
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => handleDelete(provider)} className="text-destructive focus:text-destructive">
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Eliminar Proveedor
                              </DropdownMenuItem>
                          </DropdownMenuContent>
                      </DropdownMenu>
                  </CardHeader>
                  <CardContent className="flex-grow flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Estado</p>
                      <Badge variant={provider.isActive ? "secondary" : "destructive"}>
                        {provider.isActive ? "Activo" : "Inactivo"}
                      </Badge>
                    </div>
                    <Button 
                        size="sm" 
                        variant={provider.isActive ? "destructive" : "default"}
                        onClick={() => handleToggleStatus(provider)}
                        disabled={isPending}
                    >
                        {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : (provider.isActive ? <Ban className="mr-2 h-4 w-4"/> : <CheckCircle className="mr-2 h-4 w-4"/>)}
                        {provider.isActive ? 'Desactivar' : 'Activar'}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
                <CardContent className="pt-6">
                    <div className="text-center text-muted-foreground py-8 px-4">
                        <User className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                        <h3 className="text-lg font-semibold">No hay proveedores registrados</h3>
                        <p className="text-sm">Cuando un nuevo proveedor se registre, aparecerá aquí.</p>
                    </div>
                </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>
      
      <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás absolutamente seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción es irreversible. Se eliminará al proveedor <span className="font-semibold">{selectedProvider?.companyName}</span>, a todos sus cobradores asociados y no se podrán recuperar los datos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} disabled={isProcessing} className="bg-destructive hover:bg-destructive/90">
              {isProcessing ? "Eliminando..." : "Sí, eliminar todo"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
