
"use client";

import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, UserCircle, MoreHorizontal, Pencil, Trash2, AlertTriangle, Loader2, RefreshCw, CheckCircle, Star } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { getCobradoresDailySummary, deleteCobrador } from "@/lib/actions";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { EditCobradorForm } from "@/components/forms/edit-cobrador-form";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";

type CobradorSummary = {
  id: string;
  name: string;
  idNumber: string;
  role: string;
  providerId: string;
  createdAt: string; 
  updatedAt?: string;
  totalCollected: number;
  successfulPayments: number;
  renewedCredits: number;
  missedPayments: number;
};

const formatCurrency = (value: number) => {
    if (isNaN(value)) return "$0";
    return `$${value.toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
};

export default function GestionCobradoresPage() {
  const [cobradores, setCobradores] = useState<CobradorSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCobrador, setSelectedCobrador] = useState<CobradorSummary | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const fetchCobradores = async () => {
    setLoading(true);
    try {
      const data = await getCobradoresDailySummary();
      setCobradores(data);
    } catch (error) {
      console.error("Failed to fetch cobradores", error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los datos de los cobradores.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCobradores();
  }, []);
  
  const handleEdit = (cobrador: CobradorSummary) => {
    setSelectedCobrador(cobrador);
    setIsEditModalOpen(true);
  };

  const handleDelete = (cobrador: CobradorSummary) => {
    setSelectedCobrador(cobrador);
    setIsDeleteAlertOpen(true);
  };

  const confirmDelete = async () => {
    if (!selectedCobrador) return;
    setIsDeleting(true);
    const result = await deleteCobrador(selectedCobrador.idNumber);
    if (result.success) {
      toast({
        title: "Cobrador Eliminado",
        description: `El cobrador ${selectedCobrador.name} ha sido eliminado.`,
        variant: "default",
        className: "bg-accent text-accent-foreground border-accent",
      });
      fetchCobradores(); // Refetch data
      router.refresh();
    } else {
      toast({
        title: "Error",
        description: result.error || "No se pudo eliminar el cobrador.",
        variant: "destructive",
      });
    }
    setIsDeleting(false);
    setIsDeleteAlertOpen(false);
    setSelectedCobrador(null);
  };
  
  const handleFormSubmit = () => {
    setIsEditModalOpen(false);
    fetchCobradores(); // Refetch data
    router.refresh();
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div className="space-y-1 flex-1">
                <h1 className="text-3xl font-bold tracking-tight">Gestión de Cobradores</h1>
                <p className="text-muted-foreground">
                Visualiza y administra el rendimiento diario de tus cobradores.
                </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                <Button onClick={fetchCobradores} variant="outline" className="w-full" disabled={loading}>
                    {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
                    Actualizar
                </Button>
                <Button asChild variant="outline" className="w-full">
                    <Link href="/dashboard/proveedor">
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
          ) : cobradores.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {cobradores.map((cobrador) => (
                <Card key={cobrador.id} className="flex flex-col bg-muted/30">
                  <CardHeader className="flex flex-row items-start justify-between">
                      <div className="flex items-center gap-4">
                          <UserCircle className="w-12 h-12 text-muted-foreground" />
                          <div className="grid gap-1">
                              <CardTitle>{cobrador.name}</CardTitle>
                              <CardDescription>ID: {cobrador.idNumber}</CardDescription>
                          </div>
                      </div>
                      <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <MoreHorizontal className="h-4 w-4" />
                              </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleEdit(cobrador)}>
                                  <Pencil className="mr-2 h-4 w-4" />
                                  Editar
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleDelete(cobrador)} className="text-destructive focus:text-destructive">
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Eliminar
                              </DropdownMenuItem>
                          </DropdownMenuContent>
                      </DropdownMenu>
                  </CardHeader>
                  <CardContent className="flex-grow space-y-4">
                    <div className="p-4 rounded-lg bg-primary text-primary-foreground text-center">
                        <p className="text-sm font-medium uppercase tracking-wide text-primary-foreground/80">Recaudado Hoy</p>
                        <p className="text-3xl font-bold">{formatCurrency(cobrador.totalCollected)}</p>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-2 text-center">
                        <div className="p-2 bg-background rounded-md">
                            <p className="font-bold text-xl text-green-600">{cobrador.successfulPayments}</p>
                            <p className="text-xs text-muted-foreground flex items-center justify-center gap-1"><CheckCircle className="h-3 w-3"/> Pagos</p>
                        </div>
                         <div className="p-2 bg-background rounded-md">
                            <p className="font-bold text-xl text-amber-600">{cobrador.renewedCredits}</p>
                            <p className="text-xs text-muted-foreground flex items-center justify-center gap-1"><Star className="h-3 w-3"/> Renovados</p>
                        </div>
                         <div className="p-2 bg-background rounded-md">
                            <p className="font-bold text-xl text-red-600">{cobrador.missedPayments}</p>
                            <p className="text-xs text-muted-foreground flex items-center justify-center gap-1"><AlertTriangle className="h-3 w-3"/> En Mora</p>
                        </div>
                    </div>

                  </CardContent>
                   <CardFooter>
                      <Badge variant={'default'} className="w-full justify-center py-1">
                        Activo
                      </Badge>
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
                <CardContent className="pt-6">
                    <div className="text-center text-muted-foreground py-8 px-4">
                        <UserCircle className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                        <h3 className="text-lg font-semibold">No hay cobradores registrados</h3>
                        <p className="text-sm">Crea un nuevo cobrador desde tu panel de proveedor para empezar.</p>
                    </div>
                </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>

      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Cobrador</DialogTitle>
            <DialogDescription>
              Actualiza la información del cobrador. Solo los campos completados serán modificados.
            </DialogDescription>
          </DialogHeader>
          {selectedCobrador && (
            <EditCobradorForm cobrador={selectedCobrador} onFormSubmit={handleFormSubmit} />
          )}
        </DialogContent>
      </Dialog>
      
      <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Esto eliminará permanentemente al cobrador <span className="font-semibold">{selectedCobrador?.name}</span> de la base de datos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} disabled={isDeleting} className="bg-destructive hover:bg-destructive/90">
              {isDeleting ? "Eliminando..." : "Sí, eliminar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
