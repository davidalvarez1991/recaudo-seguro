
'use server';
/**
 * @fileOverview Un agente de IA para dar consejos financieros a los proveedores.
 * 
 * - getFinancialAdvice - Una función que genera consejos basados en la situación financiera del proveedor.
 * - FinancialAdviceInput - El tipo de entrada para la función.
 * - FinancialAdviceOutput - El tipo de retorno para la función.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

// Define el esquema de entrada para el flujo.
const FinancialAdviceInputSchema = z.object({
  baseCapital: z.number().describe("El capital total que el proveedor ha definido para prestar."),
  activeCapital: z.number().describe("La cantidad de dinero que actualmente está prestada y en la calle."),
  collectedCommission: z.number().describe("La cantidad de ganancia por comisión que el proveedor ya ha recaudado y tiene disponible."),
  totalActiveClients: z.number().describe("El número total de clientes con créditos activos."),
  clientsInArrears: z.number().describe("El número de clientes que actualmente tienen pagos atrasados (en mora)."),
});
export type FinancialAdviceInput = z.infer<typeof FinancialAdviceInputSchema>;

// Define el esquema de salida que la IA debe generar.
const FinancialAdviceOutputSchema = z.object({
    type: z.enum(["warning", "suggestion", "info"]).describe("El tipo de consejo: 'warning' para alertas, 'suggestion' para oportunidades, 'info' para consejos generales."),
    title: z.string().describe("Un título corto y llamativo para el consejo (máx. 5 palabras)."),
    message: z.string().describe("El consejo financiero, escrito en un tono amigable, alentador y profesional. Debe ser conciso, directo e incluir detalles específicos como montos. (máx. 3 frases)."),
});
export type FinancialAdviceOutput = z.infer<typeof FinancialAdviceOutputSchema>;

// Función exportada que se llamará desde la acción del servidor.
export async function getFinancialAdvice(input: FinancialAdviceInput): Promise<FinancialAdviceOutput> {
  // Manejar el caso donde no hay capital base para evitar división por cero.
  if (input.baseCapital === 0) {
      return {
          type: 'info',
          title: 'Define tu Capital',
          message: 'Establece tu capital base en la configuración para que podamos darte consejos financieros más precisos.'
      };
  }
  return getFinancialAdviceFlow(input);
}


// Define el prompt que se enviará al modelo de lenguaje.
const prompt = ai.definePrompt({
  name: 'financialAdvicePrompt',
  input: { schema: FinancialAdviceInputSchema },
  output: { schema: FinancialAdviceOutputSchema },
  prompt: `Eres un asesor financiero experto, amigable y proactivo para proveedores de microcréditos. Tu objetivo es dar consejos claros, útiles, breves y alentadores que impulsen al usuario a tomar mejores decisiones.

Analiza la siguiente situación financiera de un proveedor:
- Capital Base Total: {{{baseCapital}}}
- Capital Activo en la Calle: {{{activeCapital}}}
- Ganancia (Comisión) Recaudada: {{{collectedCommission}}}
- Clientes Activos Totales: {{{totalActiveClients}}}
- Clientes en Mora: {{{clientsInArrears}}}

Tu tarea es generar un consejo basado en estas reglas, en orden de prioridad:

1. **ALERTA DE CARTERA RIESGOSA (Máxima Prioridad):**
   - **Condición:** Si el número de 'Clientes en Mora' es alto (ej. más del 30% de los 'Clientes Activos Totales').
   - **Acción:** Genera una alerta de riesgo sobre la calidad de la cartera.
     - **type:** "warning"
     - **title:** "¡Cuidado! Cartera en Riesgo" o "Alerta de Morosidad".
     - **message:** "Tienes {{{clientsInArrears}}} de {{{totalActiveClients}}} clientes en mora. Enfócate en la recuperación antes de otorgar nuevos créditos para proteger tu capital."

2. **ALERTA DE LÍMITE DE CAPITAL (Segunda Prioridad):**
   - **Condición:** Si el 'Capital Activo en la Calle' es más del 85% del 'Capital Base Total' y la regla anterior no se cumple.
   - **Acción:** Genera una alerta sobre el límite de capital.
     - **type:** "warning"
     - **title:** "Alerta de Capital" o "Límite de Inversión Cercano".
     - **message:** "Has invertido más del 85% de tu capital. Considera usar tus ganancias para fondear nuevos préstamos o espera a recaudar más para no sobrepasarte."

3. **SUGERENCIA DE CRECIMIENTO (Tercera Prioridad):**
   - **Condición:** Si la 'Ganancia Recaudada' es significativa (ej. más de 50,000) Y las reglas de alerta NO se cumplen.
   - **Acción:** Genera una sugerencia de reinversión específica y alentadora.
     - **type:** "suggestion"
     - **title:** "¡Oportunidad de Crecimiento!" o "¡A Reinvertir tus Ganancias!".
     - **message:** "¡Excelente trabajo! Tienes {{{collectedCommission}}} en ganancias listas. Con ese monto, podrías, por ejemplo, darle un nuevo crédito de 500,000 a X clientes más. ¡Reinvierte para expandir tu negocio!"
     - *Nota: Adapta la sugerencia del crédito ejemplo al monto de la ganancia.*

4. **CONSEJO GENERAL (Si no se cumple ninguna de las anteriores):**
   - **Acción:** Genera un mensaje informativo y positivo.
     - **type:** "info"
     - **title:** "Gestión Saludable" o "¡Vas por Buen Camino!".
     - **message:** "Tu capital y tu cartera están bien gestionados. ¡Sigue así para mantener un flujo de caja saludable y hacer crecer tu negocio!"

Responde únicamente con la estructura JSON definida. Sé directo y motivador.`,
});

// Define el flujo de Genkit que orquesta la llamada a la IA.
const getFinancialAdviceFlow = ai.defineFlow(
  {
    name: 'getFinancialAdviceFlow',
    inputSchema: FinancialAdviceInputSchema,
    outputSchema: FinancialAdviceOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
