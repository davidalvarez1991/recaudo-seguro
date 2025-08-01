
"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "../ui/button";

export function TermsDialog() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <button type="button" className="font-semibold underline text-primary hover:text-primary/80 transition-colors">
          Términos y Condiciones
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>🛡️ TÉRMINOS Y CONDICIONES DE USO – RECAUDO SEGURO</DialogTitle>
          <DialogDescription>
            Última actualización: 28 de julio de 2025
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="h-96 w-full rounded-md border p-4">
          <div className="space-y-6 text-sm text-muted-foreground">
            <p>
              Bienvenido a Recaudo Seguro, una aplicación digital que permite a personas o empresas llevar el control de cobros, pagos, registros de clientes y estados de cuenta, con acceso en tiempo real y almacenamiento seguro.
            </p>
            <p>
              Al utilizar la aplicación, usted acepta los siguientes términos:
            </p>
            
            <div>
                <h3 className="font-bold text-foreground mb-2">1. FINALIDAD DE LA APLICACIÓN</h3>
                <p>
                Recaudo Seguro es una plataforma de registro de información. Su objetivo es permitir a los usuarios organizar datos relacionados con préstamos, cobros y pagos. La app no realiza operaciones financieras, no presta dinero, no recauda fondos ni participa en actividades de cobranza directa.
                </p>
            </div>

            <div>
                <h3 className="font-bold text-foreground mb-2">2. INFORMACIÓN REGISTRADA</h3>
                <p>
                Los datos almacenados (clientes, pagos, montos, fechas, estados) son ingresados exclusivamente por los usuarios. Recaudo Seguro:
                </p>
                <ul className="list-disc pl-6 mt-2 space-y-1">
                    <li>No verifica la veracidad de la información.</li>
                    <li>No conoce ni controla la procedencia de los fondos.</li>
                    <li>No interviene en la relación entre cobradores y clientes.</li>
                </ul>
                <p className="mt-2">
                Cada usuario es responsable total del contenido que almacena.
                </p>
            </div>

            <div>
                <h3 className="font-bold text-foreground mb-2">3. USO INFORMAL E INFORMACIÓN SENSIBLE</h3>
                <p>
                La app puede ser usada por usuarios que trabajan en el sector informal, sin que eso implique relación o respaldo de nuestra parte. La plataforma se exonera de toda responsabilidad penal, civil o fiscal relacionada con:
                </p>
                <ul className="list-disc pl-6 mt-2 space-y-1">
                    <li>El origen de los recursos.</li>
                    <li>La legalidad de los préstamos.</li>
                    <li>Cualquier actividad que derive de su uso.</li>
                </ul>
            </div>

            <div>
                <h3 className="font-bold text-foreground mb-2">4. PROTECCIÓN DE DATOS Y PRIVACIDAD</h3>
                 <ul className="list-disc pl-6 mt-2 space-y-1">
                    <li>Toda la información es privada y cifrada.</li>
                    <li>Solo el usuario que registra los datos tiene acceso.</li>
                    <li>No compartimos información con terceros sin orden judicial o requerimiento legal.</li>
                </ul>
            </div>

            <div>
                <h3 className="font-bold text-foreground mb-2">5. LIMITACIÓN DE RESPONSABILIDAD</h3>
                <p>
                Recaudo Seguro no se hace responsable por:
                </p>
                 <ul className="list-disc pl-6 mt-2 space-y-1">
                    <li>Pérdida o daño de datos causados por mal uso.</li>
                    <li>Consecuencias legales derivadas de la actividad del usuario.</li>
                    <li>Errores cometidos en los registros manuales por parte del usuario.</li>
                </ul>
            </div>

            <div>
                <h3 className="font-bold text-foreground mb-2">6. SEGURIDAD Y ACCESO</h3>
                 <ul className="list-disc pl-6 mt-2 space-y-1">
                    <li>Garantizamos conexión segura mediante encriptación y Firestore de Google.</li>
                    <li>Cada usuario debe resguardar su contraseña y evitar el uso indebido.</li>
                </ul>
            </div>

            <div>
                <h3 className="font-bold text-foreground mb-2">7. PROHIBICIONES</h3>
                <p>
                Está prohibido usar la app para:
                </p>
                 <ul className="list-disc pl-6 mt-2 space-y-1">
                    <li>Actividades ilícitas, extorsión o amenazas.</li>
                    <li>Cobranzas violentas o fuera del marco legal.</li>
                    <li>Publicar datos de terceros sin su consentimiento.</li>
                </ul>
            </div>

            <div>
                <h3 className="font-bold text-foreground mb-2">8. MODIFICACIONES</h3>
                <p>
                Estos términos pueden ser modificados en cualquier momento. El uso continuo de la app implica la aceptación de los cambios.
                </p>
            </div>

            <div>
                <h3 className="font-bold text-foreground mb-2">9. CONTACTO</h3>
                <p>
                Para dudas legales, soporte técnico o consultas generales, comuníquese al correo: recaudo.seguro.servicio.cliente@gmail.com
                <br />
                Número de contacto: +57 305 2353554
                </p>
            </div>

            <div>
                <h3 className="font-bold text-foreground mb-2">✅ CLAÚSULA DE EXONERACIÓN LEGAL ADICIONAL</h3>
                <p>
                El desarrollador de esta aplicación se exonera expresamente de toda responsabilidad sobre el origen de los recursos registrados en la plataforma, así como de cualquier consecuencia jurídica que se derive de su uso. Recaudo Seguro es una herramienta de gestión personal y no participa en transacciones monetarias.
                </p>
            </div>

          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
