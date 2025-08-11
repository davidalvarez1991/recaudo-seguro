
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
import { Separator } from "@/components/ui/separator";

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
  
    const totalProjectedIncome = useMemo(() => {
        return providers.reduce((sum, p) => sum + (p.uniqueClientCount * pricePerClient), 0);
    }, [providers, pricePerClient]);

    const totalClients = useMemo(() => {
        return providers.reduce((sum, p) => sum + p.uniqueClientCount, 0);
    }, [providers]);
    
    const totalProviders = providers.length;


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
          <Separator className="my-6" />
           <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <Card className="bg-green-50 dark:bg-green-900/30 border-green-200">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-green-800 dark:text-green-200">Ingreso Total Proyectado</CardTitle>
                    <DollarSign className="h-5 w-5 text-green-600 dark:text-green-400" />
                    </CardHeader>
                    <CardContent>
                    <div className="text-3xl font-bold text-green-900 dark:text-green-300">{formatCurrency(totalProjectedIncome)}</div>
                    </CardContent>
                </Card>
                <Card className="bg-blue-50 dark:bg-blue-900/30 border-blue-200">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-blue-800 dark:text-blue-200">Total Proveedores</CardTitle>
                    <UsersIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    </CardHeader>
                    <CardContent>
                    <div className="text-3xl font-bold text-blue-900 dark:text-blue-300">{totalProviders}</div>
                    </CardContent>
                </Card>
                <Card className="bg-purple-50 dark:bg-purple-900/30 border-purple-200">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-purple-800 dark:text-purple-200">Total Clientes</CardTitle>
                    <UsersIcon className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                    </CardHeader>
                    <CardContent>
                    <div className="text-3xl font-bold text-purple-900 dark:text-purple-300">{totalClients}</div>
                    </CardContent>
                </Card>
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
          ) : filteredProviders.length > 0 ? (
            <>
                {/* Mobile View */}
                <div className="md:hidden space-y-4">
                    {filteredProviders.map((provider) => (
                        <Card key={provider.id} className="p-4 space-y-4 bg-muted/30">
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-3">
                                     <Avatar>
                                        <AvatarFallback>{getAvatarFallback(provider.companyName)}</AvatarFallback>
                                    </Avatar>
                                    <div className="space-y-0.5">
                                        <p className="font-semibold">{provider.companyName}</p>
                                        <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                                            <User className="h-3 w-3" />
                                            {provider.idNumber}
                                        </p>
                                        <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                                            <Phone className="h-3 w-3" />
                                            {provider.whatsappNumber}
                                        </p>
                                    </div>
                                </div>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-8 w-8 -mr-2 -mt-2">
                                            <MoreHorizontal className="h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuItem onClick={() => handleEdit(provider)}><Pencil className="mr-2 h-4 w-4" />Editar</DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem onClick={() => handleDelete(provider)} className="text-destructive"><Trash2 className="mr-2 h-4 w-4" />Eliminar</DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                            <Separator />
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                  <p className="text-muted-foreground">Clientes</p>
                                  <p className="font-medium">{provider.uniqueClientCount}</p>
                                </div>
                                <div>
                                  <p className="text-muted-foreground">Suscripción</p>
                                  <p className="font-medium text-primary">{formatCurrency(provider.uniqueClientCount * pricePerClient)}</p>
                                </div>
                                <div>
                                    <p className="text-muted-foreground">Estado</p>
                                    <div><Badge variant={provider.isActive ? "secondary" : "destructive"}>{provider.isActive ? "Activo" : "Inactivo"}</Badge></div>
                                </div>
                                <div>
                                  <p className="text-muted-foreground">Activación</p>
                                  <p>{provider.activatedAt ? format(new Date(provider.activatedAt), 'd MMM, yyyy', { locale: es }) : '-'}</p>
                                </div>
                            </div>
                             <Button 
                                size="sm" 
                                variant={provider.isActive ? "destructive" : "default"}
                                onClick={() => handleToggleStatus(provider)}
                                disabled={isPending}
                                className="w-full"
                            >
                                {isPending && selectedProvider?.id === provider.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : (provider.isActive ? <Ban className="mr-2 h-4 w-4"/> : <CheckCircle className="mr-2 h-4 w-4"/>)}
                                {provider.isActive ? 'Desactivar' : 'Activar'}
                            </Button>
                        </Card>
                    ))}
                </div>

                {/* Desktop View */}
                <div className="hidden md:block">
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
                      {filteredProviders.map((provider) => (
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
                      ))}
                      </TableBody>
                  </Table>
                </div>
            </>
          ) : (
             <div className="text-center py-16 text-muted-foreground">
                <UsersIcon className="mx-auto h-12 w-12" />
                <h3 className="mt-4 text-lg font-semibold">
                    No se encontraron proveedores
                </h3>
                <p className="mt-2 text-sm">
                    {searchTerm ? `No se encontraron resultados para "${searchTerm}".` : "Actualmente no hay proveedores registrados en la plataforma."}
                </p>
             </div>
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
