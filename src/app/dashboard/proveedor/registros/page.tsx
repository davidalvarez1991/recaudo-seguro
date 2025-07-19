
"use client";

import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ClipboardList, MoreHorizontal, Trash2 } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { getCreditsByProvider, deleteClientAndCredits } from "@/lib/actions";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";

type Registro = {
  id: string;
  cobradorId: string;
  cobradorName?: string;
  clienteId: string;
  clienteName?: string;
  tipo: string;
  valor: number;
  fecha: string;
  formattedDate?: string;
};

export default function RegistrosPage() {
  const [registros, setRegistros] = useState<Registro[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRegistro, setSelectedRegistro] = useState<Registro | null>(null);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const fetchRecords = async () => {
    setLoading(true);
    try {
      const allActivityRecords: Registro[] = await getCreditsByProvider();
      const formattedRecords = allActivityRecords
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

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="space-y-1">
                  <CardTitle className="text-3xl">Registro de Actividad</CardTitle>
                  <CardDescription>
                  Visualiza todas las acciones registradas por tus cobradores.
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
                    <TableRow key={registro.id}>
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
                        {registro.valor > 0 ? `$${registro.valor.toLocaleString('es-CO')}` : '-'}
                      </TableCell>
                      <TableCell className="text-right">
                         <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                    <MoreHorizontal className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
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
