
"use client";

import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ClipboardList, MoreHorizontal, Trash2, Download, Eye, Pencil, RefreshCcw, Loader2, Search } from "lucide-react";
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
import { EditClientForm } from "@/components/forms/edit-client-form";
import { Input } from "@/components/ui/input";

type Reference = {
    name: string;
    phone: string;
    address: string;
}

type Guarantor = {
    name: string;
    idNumber: string;
    address: string;
    phone: string;
}

type Registro = {
  id: string;
  cobradorId: string;
  cobradorName?: string;
  clienteId: string;
  clienteName?: string;
  estado: string; 
  valor: number;
  commission: number;
  fecha: string;
  formattedDate?: string;
  documentUrls?: string[];
  guarantor?: Guarantor | null;
  references?: {
    familiar: Reference;
    personal: Reference;
  } | null;
  cuotas: number;
  clienteAddress?: string;
  clientePhone?: string;
  paidInstallments: number;
  paidAmount: number;
  agreementAmount: number;
  remainingBalance: number;
};

const ITEMS_PER_PAGE = 10;

export default function RegistrosPage() {
  const [registros, setRegistros] = useState<Registro[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRegistro, setSelectedRegistro] = useState<Registro | null>(null);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const { toast } = useToast();
  const router = useRouter();

  const fetchRecords = async () => {
    setLoading(true);
    try {
      const allActivityRecords: any[] = await getCreditsByProvider();
      const formattedRecords = allActivityRecords
        .map((credito) => ({
          ...credito,
          formattedDate: new Date(credito.fecha).toLocaleString('es-CO', {
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
  
  // Reset page to 1 when search term changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const handleViewDetails = (registro: Registro) => {
    setSelectedRegistro(registro);
    setIsDetailsModalOpen(true);
  };

  const handleEdit = (registro: Registro) => {
    setSelectedRegistro(registro);
    setIsEditModalOpen(true);
  };

  const handleDelete = (registro: Registro) => {
    setSelectedRegistro(registro);
    setIsDeleteAlertOpen(true);
  };
  
  const handleFormSubmit = () => {
    setIsEditModalOpen(false);
    fetchRecords();
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

  const filteredRegistros = registros.filter(registro =>
    (registro.clienteName?.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (registro.clienteId?.toLowerCase().includes(searchTerm.toLowerCase()))
  );
  
  const totalPages = Math.ceil(filteredRegistros.length / ITEMS_PER_PAGE);
  const paginatedRegistros = filteredRegistros.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

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
              <div className="flex flex-col sm:flex-row gap-2">
                 <Button onClick={fetchRecords} disabled={loading} variant="outline" className="w-full sm:w-auto">
                    {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCcw className="mr-2 h-4 w-4" />}
                    Actualizar
                 </Button>
                <Button asChild variant="outline" className="w-full sm:w-auto">
                    <Link href="/dashboard/proveedor">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Volver al Panel
                    </Link>
                </Button>
              </div>
          </div>
            <div className="mt-4 relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                type="search"
                placeholder="Buscar por nombre o cédula de cliente..."
                className="w-full pl-8 sm:w-[300px]"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
        </CardHeader>
        <CardContent className="pt-6">
          {loading ? (
             <p>Cargando registros...</p>
          ) : paginatedRegistros.length > 0 ? (
            <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Cobrador</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Estado del Crédito</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedRegistros.map((registro) => (
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
                        <Badge 
                          variant={
                            registro.estado === 'Pagado' ? 'secondary' : 
                            registro.estado === 'Renovado' ? 'outline' : 
                            'default'
                          }
                          className={
                            registro.estado === 'Pagado' ? 'bg-green-100 text-green-800' : ''
                          }
                        >
                          {registro.estado}
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
                                <DropdownMenuItem onClick={() => handleEdit(registro)}>
                                  <Pencil className="mr-2 h-4 w-4" />
                                  Editar Cliente
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
                  <h3 className="text-lg font-semibold">{searchTerm ? 'No se encontraron registros' : 'No hay actividad registrada'}</h3>
                  <p className="text-sm">{searchTerm ? 'Intenta con otro nombre o cédula.' : 'Cuando un cobrador cree un crédito, aparecerá aquí.'}</p>
              </div>
          )}
        </CardContent>
         {totalPages > 1 && (
            <CardFooter>
                <div className="flex items-center justify-between w-full">
                    <Button 
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1 || loading}
                        variant="outline"
                    >
                        Anterior
                    </Button>
                    <span className="text-sm text-muted-foreground">
                        Página {currentPage} de {totalPages}
                    </span>
                    <Button 
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                        disabled={currentPage === totalPages || loading}
                        variant="outline"
                    >
                        Siguiente
                    </Button>
                </div>
            </CardFooter>
        )}
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
                                <div className="text-sm text-green-800 dark:text-green-200">Total Pagado (Cuotas)</div>
                                <div className="text-lg font-bold text-green-900 dark:text-green-100">{formatCurrency(selectedRegistro.paidAmount)}</div>
                            </div>
                             <div className="p-3 bg-red-100 dark:bg-red-900/50 rounded-md">
                                <div className="text-sm text-red-800 dark:text-red-200">Saldo Pendiente</div>
                                <div className="text-lg font-bold text-red-900 dark:text-red-100">{formatCurrency(selectedRegistro.remainingBalance)}</div>
                            </div>
                            {selectedRegistro.agreementAmount > 0 && (
                                <div className="p-3 bg-blue-100 dark:bg-blue-900/50 rounded-md md:col-span-2">
                                    <div className="text-sm text-blue-800 dark:text-blue-200">Total Acuerdos</div>
                                    <div className="text-lg font-bold text-blue-900 dark:text-blue-100">{formatCurrency(selectedRegistro.agreementAmount)}</div>
                                </div>
                            )}
                        </div>

                        {selectedRegistro.guarantor && (
                           <>
                                <Separator />
                                <h4 className="font-semibold text-md">Información del Fiador</h4>
                                 <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-1 text-sm pl-2">
                                    <div><span className="font-semibold">Nombre:</span> {selectedRegistro.guarantor.name}</div>
                                    <div><span className="font-semibold">Cédula:</span> {selectedRegistro.guarantor.idNumber}</div>
                                    <div><span className="font-semibold">Teléfono:</span> {selectedRegistro.guarantor.phone}</div>
                                    <div className="md:col-span-2"><span className="font-semibold">Dirección:</span> {selectedRegistro.guarantor.address}</div>
                                </div>
                            </>
                        )}


                        {selectedRegistro.references && (
                            <>
                                <Separator />
                                <h4 className="font-semibold text-md">Información de Referencias</h4>
                                <div className="space-y-4">
                                    <div>
                                        <h5 className="font-medium text-sm text-muted-foreground">Referencia Familiar</h5>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-1 text-sm pl-2">
                                            <div><span className="font-semibold">Nombre:</span> {selectedRegistro.references.familiar.name}</div>
                                            <div><span className="font-semibold">Teléfono:</span> {selectedRegistro.references.familiar.phone}</div>
                                            <div className="md:col-span-2"><span className="font-semibold">Dirección:</span> {selectedRegistro.references.familiar.address}</div>
                                        </div>
                                    </div>
                                    <div>
                                        <h5 className="font-medium text-sm text-muted-foreground">Referencia Personal</h5>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-1 text-sm pl-2">
                                            <div><span className="font-semibold">Nombre:</span> {selectedRegistro.references.personal.name}</div>
                                            <div><span className="font-semibold">Teléfono:</span> {selectedRegistro.references.personal.phone}</div>
                                            <div className="md:col-span-2"><span className="font-semibold">Dirección:</span> {selectedRegistro.references.personal.address}</div>
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}

                    </>
                )}
            </div>
            <DialogFooter>
                <Button variant="outline" onClick={() => setIsDetailsModalOpen(false)}>Cerrar</Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Cliente</DialogTitle>
            <DialogDescription>
              Actualiza la información del cliente. Los cambios se reflejarán en todos sus registros.
            </DialogDescription>
          </DialogHeader>
          {selectedRegistro && (
            <EditClientForm
              cliente={{
                id: selectedRegistro.clienteId,
                name: selectedRegistro.clienteName || '',
                idNumber: selectedRegistro.clienteId,
                address: selectedRegistro.clienteAddress || '',
                contactPhone: selectedRegistro.clientePhone || '',
              }}
              onFormSubmit={handleFormSubmit}
            />
          )}
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
