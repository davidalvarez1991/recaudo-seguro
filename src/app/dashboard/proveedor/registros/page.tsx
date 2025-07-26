
"use client";

import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ClipboardList, MoreHorizontal, Trash2, Download, Eye } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { getCreditsByProvider, deleteClientAndCredits } from "@/lib/actions";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Separator } from "@/components/ui/separator";

type Registro = {
  id: string;
  cobradorId: string;
  cobradorName?: string;
  clienteId: string;
  clienteName?: string;
  tipo: string;
  valor: number;
  commission: number;
  fecha: string;
  formattedDate?: string;
  documentUrls?: string[];
  guarantor?: { name: string; phone: string; address: string } | null;
  cuotas: number;
  clienteAddress?: string;
  clientePhone?: string;
  paidInstallments: number;
  paidAmount: number;
  remainingBalance: number;
};

const ADMIN_ID = "0703091991";

export default function RegistrosPage() {
  const [registros, setRegistros] = useState<Registro[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRegistro, setSelectedRegistro] = useState<Registro | null>(null);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const fetchRecords = async () => {
    setLoading(true);
    try {
      const allActivityRecords: any[] = await getCreditsByProvider();
      const formattedRecords = allActivityRecords
        .filter(credito => credito.cobradorId !== ADMIN_ID)
        .map((credito) => ({
          ...credito,
          tipo: "Creación Crédito",
          formattedDate: new Date(credito.fecha).toLocaleDateString('es-CO', {
            year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
          }),
        }))
        .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
      setRegistros(formattedRecords);
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudieron cargar los registros.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, []);

  const handleViewDetails = (registro: Registro) => {
    setSelectedRegistro(registro);
    setIsDetailsModalOpen(true);
  };

  const handleDelete = (registro: Registro) => {
    setSelectedRegistro(registro);
    setIsDeleteAlertOpen(true);
  };

  const confirmDelete = async () => {
    if (!selectedRegistro) return;
    setIsDeleting(true);
    const result = await deleteClientAndCredits(selectedRegistro.clienteId);
    if (result.success) {
      toast({
        title: "Cliente Eliminado",
        description: `El cliente ${selectedRegistro.clienteName} y todos sus datos han sido eliminados.`,
        variant: "default",
        className: "bg-accent text-accent-foreground border-accent",
      });
      fetchRecords(); // Refetch data
      router.refresh();
    } else {
      toast({
        title: "Error",
        description: result.error || "No se pudo eliminar el cliente.",
        variant: "destructive",
      });
    }
    setIsDeleting(false);
    setIsDeleteAlertOpen(false);
    setSelectedRegistro(null);
  };

  const isMediaImage = (url: string) => /\.(jpg|jpeg|png|gif|webp|heic|heif)$/i.test(url);
  const isMediaVideo = (url: string) => /\.(mp4|mov|avi|mkv|webm|3gp)$/i.test(url);
  
  const formatCurrency = (value: number | undefined | null) => {
      if (value === undefined || value === null || isNaN(value)) {
          return "$0";
      }
      return `$${value.toLocaleString('es-CO')}`;
  }


  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="space-y-1">
                  <CardTitle className="text-3xl">Registro de Actividad</CardTitle>
                  <CardDescription>
                  Visualiza todas las acciones registradas por tus cobradores. Haz clic en una fila para ver los detalles.
                  </CardDescription>
              </div>
              <Button asChild variant="outline" className="w-full sm:w-auto">
                  <Link href="/dashboard/proveedor">
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      Volver al Panel
                  </Link>
              </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          {loading ? (
             <p>Cargando registros...</p>
          ) : registros.length > 0 ? (
            <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Cobrador</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Tipo de Registro</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {registros.map((registro) => (
                    <TableRow key={registro.id} onClick={() => handleViewDetails(registro)} className="cursor-pointer">
                      <TableCell>{registro.formattedDate}</TableCell>
                      <TableCell>
                          <div className="font-medium">{registro.cobradorName || 'Nombre no disponible'}</div>
                          <div className="text-sm text-muted-foreground">ID: {registro.cobradorId}</div>
                      </TableCell>
                      <TableCell>
                          <div className="font-medium">{registro.clienteName || 'Nombre no disponible'}</div>
                          <div className="text-sm text-muted-foreground">CC: {registro.clienteId}</div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={'default'}>
                          {registro.tipo}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {registro.valor > 0 ? formatCurrency(registro.valor) : '-'}
                      </TableCell>
                      <TableCell className="text-right">
                         <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => e.stopPropagation()}>
                                    <MoreHorizontal className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                                <DropdownMenuItem onClick={() => handleViewDetails(registro)}>
                                    <Eye className="mr-2 h-4 w-4" />
                                    Ver Detalles
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleDelete(registro)} className="text-destructive focus:text-destructive">
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Eliminar Cliente
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
          ) : (
              <div className="text-center text-muted-foreground py-8">
                  <ClipboardList className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <h3 className="text-lg font-semibold">No hay actividad registrada</h3>
                  <p className="text-sm">Cuando un cobrador cree un crédito, aparecerá aquí.</p>
              </div>
          )}
        </CardContent>
      </Card>
      
      <Dialog open={isDetailsModalOpen} onOpenChange={setIsDetailsModalOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col">
            <DialogHeader>
                <DialogTitle>Detalles del Crédito</DialogTitle>
                <DialogDescription>
                    Información completa del crédito, pagos y documentos de respaldo.
                </DialogDescription>
            </DialogHeader>
            <div className="flex-1 overflow-y-auto pr-4 -mr-2 space-y-6">
                {selectedRegistro && (
                    <>
                        <h4 className="font-semibold text-md">Información General</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div><span className="font-semibold text-muted-foreground">Cliente:</span> {selectedRegistro.clienteName}</div>
                            <div><span className="font-semibold text-muted-foreground">Cédula:</span> {selectedRegistro.clienteId}</div>
                            <div><span className="font-semibold text-muted-foreground">Dirección:</span> {selectedRegistro.clienteAddress || 'N/A'}</div>
                            <div><span className="font-semibold text-muted-foreground">Teléfono:</span> {selectedRegistro.clientePhone || 'N/A'}</div>
                            <div><span className="font-semibold text-muted-foreground">Cobrador:</span> {selectedRegistro.cobradorName}</div>
                            <div><span className="font-semibold text-muted-foreground">Fecha Creación:</span> {selectedRegistro.formattedDate}</div>
                        </div>

                        <Separator />
                        <h4 className="font-semibold text-md">Resumen del Crédito</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="p-3 bg-muted/50 rounded-md">
                                <div className="text-sm text-muted-foreground">Valor del Crédito</div>
                                <div className="text-lg font-bold">{formatCurrency(selectedRegistro.valor)}</div>
                            </div>
                            <div className="p-3 bg-muted/50 rounded-md">
                                <div className="text-sm text-muted-foreground">Comisión</div>
                                <div className="text-lg font-bold">{formatCurrency(selectedRegistro.commission)}</div>
                            </div>
                             <div className="p-3 bg-muted/50 rounded-md col-span-full">
                                <div className="text-sm text-muted-foreground">Total (Crédito + Comisión)</div>
                                <div className="text-xl font-bold text-primary">{formatCurrency((selectedRegistro.valor || 0) + (selectedRegistro.commission || 0))}</div>
                            </div>
                             <div className="p-3 bg-muted/50 rounded-md">
                                <div className="text-sm text-muted-foreground">Cuotas</div>
                                <div className="text-lg font-bold">{selectedRegistro.paidInstallments} / {selectedRegistro.cuotas}</div>
                            </div>
                            <div className="p-3 bg-green-100 dark:bg-green-900/50 rounded-md">
                                <div className="text-sm text-green-800 dark:text-green-200">Total Pagado</div>
                                <div className="text-lg font-bold text-green-900 dark:text-green-100">{formatCurrency(selectedRegistro.paidAmount)}</div>
                            </div>
                             <div className="p-3 bg-red-100 dark:bg-red-900/50 rounded-md">
                                <div className="text-sm text-red-800 dark:text-red-200">Saldo Pendiente</div>
                                <div className="text-lg font-bold text-red-900 dark:text-red-100">{formatCurrency(selectedRegistro.remainingBalance)}</div>
                            </div>
                        </div>

                        {selectedRegistro.guarantor && (
                            <>
                                <Separator />
                                <h4 className="font-semibold text-md">Información del Fiador</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div><span className="font-semibold text-muted-foreground">Nombre:</span> {selectedRegistro.guarantor.name}</div>
                                    <div><span className="font-semibold text-muted-foreground">Teléfono:</span> {selectedRegistro.guarantor.phone}</div>
                                    <div className="md:col-span-2"><span className="font-semibold text-muted-foreground">Dirección:</span> {selectedRegistro.guarantor.address}</div>
                                </div>
                            </>
                        )}
                        
                        <Separator />
                        
                        <div>
                            <h4 className="font-semibold text-md mb-4">Documentos Adjuntos</h4>
                            {(selectedRegistro.documentUrls && selectedRegistro.documentUrls.length > 0) ? (
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                    {selectedRegistro.documentUrls.map((url, index) => (
                                        <div key={index} className="relative group border rounded-lg overflow-hidden">
                                            {isMediaImage(url) ? (
                                                <Image src={url} alt={`Documento ${index + 1}`} width={200} height={200} className="w-full h-32 object-cover" />
                                            ) : isMediaVideo(url) ? (
                                                <video src={url} controls className="w-full h-32 object-cover bg-black" />
                                            ) : (
                                                 <div className="w-full h-32 flex items-center justify-center bg-muted">
                                                    <ClipboardList className="w-10 h-10 text-muted-foreground" />
                                                 </div>
                                            )}
                                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Button asChild variant="secondary" size="sm">
                                                    <a href={url} target="_blank" rel="noopener noreferrer" download>
                                                        <Download className="mr-2 h-4 w-4" /> Descargar
                                                    </a>
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (<p className="text-sm text-muted-foreground">No hay documentos adjuntos.</p>)}
                        </div>
                    </>
                )}
            </div>
            <DialogFooter>
                <Button variant="outline" onClick={() => setIsDetailsModalOpen(false)}>Cerrar</Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás realmente seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará permanentemente al cliente <span className="font-semibold">{selectedRegistro?.clienteName}</span> (CC: {selectedRegistro?.clienteId}) y todos sus créditos asociados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} disabled={isDeleting} className="bg-destructive hover:bg-destructive/90">
              {isDeleting ? "Eliminando..." : "Sí, eliminar todo"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
