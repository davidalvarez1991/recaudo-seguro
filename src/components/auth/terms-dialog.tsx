
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
            Última actualización: 25 de agosto de 2024
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
                Recaudo Seguro es una herramienta de gestión de información. Su único propósito es ayudar a los usuarios a organizar datos de cobros, pagos y estados de cuenta. La aplicación <span className="italic">no participa en operaciones financieras</span>, no presta dinero ni se involucra en actividades de cobranza o transacciones.
                </p>
            </div>

            <div>
                <h3 className="font-bold text-foreground mb-2">2. INFORMACIÓN REGISTRADA</h3>
                <p>
                El usuario es el único responsable de toda la información que registra. Recaudo Seguro no verifica la veracidad de los datos ni conoce la procedencia de los fondos. El usuario garantiza que toda la información es legal y que ha obtenido el consentimiento necesario de terceros para su registro.
                </p>
            </div>

            <div>
                <h3 className="font-bold text-foreground mb-2">3. PROHIBICIONES Y CUMPLIMIENTO LEGAL</h3>
                <p>
                Está estrictamente prohibido usar la aplicación para:
                </p>
                <ul className="list-disc pl-6 mt-2 space-y-1">
                    <li>Cobrar tasas de interés que superen la <span className="italic">tasa de usura</span> máxima permitida en Colombia, certificada por la Superintendencia Financiera.</li>
                    <li>Realizar actividades ilícitas, extorsión, acoso o amenazas.</li>
                    <li>Recaudar dinero de origen ilícito (lavado de activos).</li>
                    <li>Publicar datos personales de terceros sin su consentimiento, violando la Ley 1581 de 2012.</li>
                </ul>
            </div>

            <div>
                <h3 className="font-bold text-foreground mb-2">4. PROTECCIÓN DE DATOS Y PRIVACIDAD</h3>
                <p>
                 El usuario acepta que Recaudo Seguro recopile los datos de registro para el uso de la app. Nuestra política de privacidad cumple con la Ley 1581 de 2012. La información registrada es privada y se almacena con medidas de seguridad para garantizar su confidencialidad. No compartimos datos con terceros sin una orden judicial.
                </p>
            </div>

            <div>
                <h3 className="font-bold text-foreground mb-2">5. LIMITACIÓN DE RESPONSABILIDAD</h3>
                <p>
                El desarrollador y/o propietario de Recaudo Seguro no será responsable por:
                </p>
                 <ul className="list-disc pl-6 mt-2 space-y-1">
                    <li>La legalidad de las transacciones o préstamos gestionados por el usuario.</li>
                    <li>Cualquier sanción, multa o proceso judicial que se derive de las acciones del usuario.</li>
                    <li>Errores, omisiones o pérdida de datos causados por un mal uso de la aplicación.</li>
                    <li>Cualquier acto ilegal, incluyendo el delito de usura o extorsión.</li>
                </ul>
            </div>

            <div>
                <h3 className="font-bold text-foreground mb-2">6. SEGURIDAD Y ACCESO</h3>
                 <ul className="list-disc pl-6 mt-2 space-y-1">
                    <li>La aplicación utiliza tecnologías seguras de Google (Firebase/Firestore) para proteger los datos. El usuario debe mantener la confidencialidad de su contraseña.</li>
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
