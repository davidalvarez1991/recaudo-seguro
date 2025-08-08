
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
});
export type FinancialAdviceInput = z.infer<typeof FinancialAdviceInputSchema>;

// Define el esquema de salida que la IA debe generar.
const FinancialAdviceOutputSchema = z.object({
    type: z.enum(["warning", "suggestion", "info"]).describe("El tipo de consejo: 'warning' para alertas, 'suggestion' para oportunidades, 'info' para consejos generales."),
    title: z.string().describe("Un título corto y llamativo para el consejo (máx. 5 palabras)."),
    message: z.string().describe("El consejo financiero, escrito en un tono amigable y profesional. Debe ser conciso y directo (máx. 2 frases)."),
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
  prompt: `Eres un asesor financiero experto y amigable para proveedores de microcréditos. Tu objetivo es dar consejos claros, útiles y breves.

Analiza la siguiente situación financiera de un proveedor:
- Capital Base Total: {{{baseCapital}}}
- Capital Activo en la Calle: {{{activeCapital}}}
- Ganancia (Comisión) Recaudada: {{{collectedCommission}}}

Tu tarea es generar un consejo basado en estas reglas, en orden de prioridad:

1. **ALERTA DE RIESGO (Máxima Prioridad):**
   - **Condición:** Si el 'Capital Activo en la Calle' es más del 85% del 'Capital Base Total'.
   - **Acción:** Genera una alerta.
     - **type:** "warning"
     - **title:** "Alerta de Capital" o "Cuidado: Límite Cercano".
     - **message:** "Estás cerca de tu límite de capital. Considera usar tus ganancias para fondear nuevos préstamos o espera a recaudar más."

2. **SUGERENCIA DE CRECIMIENTO (Segunda Prioridad):**
   - **Condición:** Si la 'Ganancia Recaudada' es significativa (ej. más de 50,000 o más del 10% del capital base) Y la regla de alerta NO se cumple.
   - **Acción:** Genera una sugerencia de reinversión.
     - **type:** "suggestion"
     - **title:** "Oportunidad de Crecimiento" o "¡A Reinvertir!".
     - **message:** "Tienes una buena ganancia acumulada. ¡Reinvierte para hacer crecer tu cartera y prestar más!"

3. **CONSEJO GENERAL (Si no se cumple ninguna de las anteriores):**
   - **Acción:** Genera un mensaje informativo y positivo.
     - **type:** "info"
     - **title:** "Gestión Saludable" o "¡Vas Bien!".
     - **message:** "Tu capital está bien gestionado. Sigue así para mantener un flujo de caja saludable y hacer crecer tu negocio."

Responde únicamente con la estructura JSON definida.`,
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
