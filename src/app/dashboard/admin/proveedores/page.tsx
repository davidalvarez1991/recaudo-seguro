
"use client";

import { useState, useEffect, useTransition, useMemo } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, User, MoreHorizontal, Pencil, Trash2, Loader2, RefreshCw, CheckCircle, Ban, Users as UsersIcon, DollarSign, Search, CalendarCheck, Phone } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { getAllProviders, toggleProviderStatus, deleteProvider, getAdminSettings } from "@/lib/actions";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { EditProviderForm } from "@/components/forms/edit-provider-form";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { format } from "date-fns";
import { es } from "date-fns/locale";

type Provider = {
  id: string;
  companyName: string;
  idNumber: string;
  email: string;
  whatsappNumber: string;
  isActive: boolean;
  uniqueClientCount: number;
  activatedAt?: string;
};

const formatCurrency = (value: number) => {
    if (isNaN(value)) return "$0";
    return `$${value.toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
};

const getAvatarFallback = (name: string) => {
    if (!name) return 'P';
    const words = name.split(' ');
    if (words.length > 1) {
        return `${words[0][0]}${words[1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
}


export default function AdminProvidersPage() {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [pricePerClient, setPricePerClient] = useState(3500);
  const [loading, setLoading] = useState(true);
  const [selectedProvider, setSelectedProvider] = useState<Provider | null>(null);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const router = useRouter();

  const fetchProviders = async () => {
    setLoading(true);
    try {
      const [providersData, settingsData] = await Promise.all([
        getAllProviders(),
        getAdminSettings(),
      ]);
      setProviders(providersData);
      setPricePerClient(settingsData.pricePerClient || 3500);
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

  const handleEdit = (provider: Provider) => {
    setSelectedProvider(provider);
    setIsEditModalOpen(true);
  };
  
  const handleFormSubmit = () => {
    setIsEditModalOpen(false);
    fetchProviders();
  };

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
                fetchProviders();
            } else {
                toast({
                    title: "Error",
                    description: result.error || "No se pudo cambiar el estado del proveedor.",
                    variant: "destructive",
                });
            }
      });
  }
  
  const filteredProviders = useMemo(() => {
    return providers.filter(provider => 
        provider.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        provider.idNumber.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [providers, searchTerm]);

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
                    {loading && !isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
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
          <div className="pt-4">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Buscar por nombre o cédula..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-8 sm:max-w-sm"
                />
              </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
             <div className="flex justify-center items-center h-40">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
             </div>
          ) : (
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Proveedor</TableHead>
                        <TableHead className="text-center">Clientes</TableHead>
                        <TableHead className="text-center">Suscripción</TableHead>
                        <TableHead className="text-center">Estado</TableHead>
                        <TableHead className="text-center">Fecha de Activación</TableHead>
                        <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                 {filteredProviders.length > 0 ? (
                    filteredProviders.map((provider) => (
                        <TableRow key={provider.id}>
                            <TableCell>
                                <div className="flex items-center gap-3">
                                    <Avatar>
                                        <AvatarFallback>{getAvatarFallback(provider.companyName)}</AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <p className="font-medium">{provider.companyName}</p>
                                        <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                                            <Phone className="h-3 w-3" />
                                            {provider.whatsappNumber}
                                        </p>
                                    </div>
                                </div>
                            </TableCell>
                            <TableCell className="text-center font-medium">{provider.uniqueClientCount}</TableCell>
                            <TableCell className="text-center font-semibold text-primary">{formatCurrency(provider.uniqueClientCount * pricePerClient)}</TableCell>
                            <TableCell className="text-center">
                                <Badge variant={provider.isActive ? "secondary" : "destructive"}>
                                    {provider.isActive ? "Activo" : "Inactivo"}
                                </Badge>
                            </TableCell>
                            <TableCell className="text-center text-sm text-muted-foreground">
                                {provider.activatedAt ? format(new Date(provider.activatedAt), 'd MMM, yyyy', { locale: es }) : '-'}
                            </TableCell>
                            <TableCell className="text-right">
                                <div className="flex justify-end items-center gap-2">
                                     <Button 
                                        size="sm" 
                                        variant={provider.isActive ? "destructive" : "default"}
                                        onClick={() => handleToggleStatus(provider)}
                                        disabled={isPending}
                                        className="w-28"
                                    >
                                        {isPending && selectedProvider?.id === provider.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : (provider.isActive ? <Ban className="mr-2 h-4 w-4"/> : <CheckCircle className="mr-2 h-4 w-4"/>)}
                                        {provider.isActive ? 'Desactivar' : 'Activar'}
                                    </Button>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-8 w-8">
                                                <MoreHorizontal className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem onClick={() => handleEdit(provider)}>
                                                <Pencil className="mr-2 h-4 w-4" />
                                                Editar
                                            </DropdownMenuItem>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem onClick={() => handleDelete(provider)} className="text-destructive focus:text-destructive">
                                                <Trash2 className="mr-2 h-4 w-4" />
                                                Eliminar Proveedor
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                            </TableCell>
                        </TableRow>
                    ))
                 ) : (
                    <TableRow>
                        <TableCell colSpan={6} className="h-24 text-center">
                            No se encontraron proveedores {searchTerm ? `con el término "${searchTerm}"` : "registrados."}
                        </TableCell>
                    </TableRow>
                 )}
                </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
      
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Proveedor</DialogTitle>
            <DialogDescription>
              Actualiza la información del proveedor. Solo los campos completados serán modificados.
            </DialogDescription>
          </DialogHeader>
          {selectedProvider && (
            <EditProviderForm provider={selectedProvider} onFormSubmit={handleFormSubmit} />
          )}
        </DialogContent>
      </Dialog>

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
