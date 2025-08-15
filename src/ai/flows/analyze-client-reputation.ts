
'use server';
/**
 * @fileOverview Un agente de IA para analizar la reputación crediticia de un cliente.
 * 
 * - analyzeClientReputation - Una función que maneja el proceso de análisis de reputación.
 * - ClientReputationInput - El tipo de entrada para la función analyzeClientReputation.
 * - ClientReputationOutput - El tipo de retorno para la función analyzeClientReputation.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

// Define el esquema de entrada para el flujo.
const ClientReputationInputSchema = z.object({
  clienteId: z.string().describe("El número de identificación del cliente a analizar."),
  creditHistory: z.array(z.object({
    id: z.string(),
    valor: z.number(),
    estado: z.string(),
    cuotas: z.number(),
    paidInstallments: z.number(),
    missedPaymentDays: z.number().optional().default(0),
  })).describe("El historial de créditos del cliente."),
});
export type ClientReputationInput = z.infer<typeof ClientReputationInputSchema>;

// Define el esquema de salida que la IA debe generar.
const ClientReputationOutputSchema = z.object({
  riskScore: z.number().min(0).max(100).describe("Una puntuación de riesgo de 0 a 100, donde 0 es sin riesgo y 100 es el máximo riesgo."),
  summary: z.string().describe("Un resumen conciso (2-3 frases) del comportamiento de pago del cliente."),
  recommendation: z.enum(["Excelente", "Bueno", "Regular", "Malo", "Muy Malo"]).describe("Una recomendación crediticia basada en el análisis."),
});
export type ClientReputationOutput = z.infer<typeof ClientReputationOutputSchema>;


// Función exportada que se llamará desde la acción del servidor.
export async function analyzeClientReputation(input: ClientReputationInput): Promise<ClientReputationOutput> {
  return analyzeClientReputationFlow(input);
}


// Define el prompt que se enviará al modelo de lenguaje.
const prompt = ai.definePrompt({
  name: 'analyzeClientReputationPrompt',
  input: { schema: ClientReputationInputSchema },
  output: { schema: ClientReputationOutputSchema },
  prompt: `Eres un analista de crédito experto para una plataforma de microcréditos llamada "Recaudo Seguro". Tu tarea es evaluar el historial crediticio de un cliente y determinar su reputación de pago.

  Analiza el siguiente historial de créditos para el cliente con ID: {{{clienteId}}}.

  Historial de Créditos:
  {{#each creditHistory}}
  - Crédito ID: {{id}}
    - Valor: {{valor}}
    - Estado: {{estado}} (Activo, Pagado, Renovado)
    - Cuotas Totales: {{cuotas}}
    - Cuotas Pagadas: {{paidInstallments}}
    - Días de Mora Registrados: {{missedPaymentDays}}
  {{/each}}

  Basado en este historial, evalúa los siguientes factores:
  1.  **Puntualidad:** ¿El cliente tiene un historial de días de mora (missedPaymentDays)? Muchos días de mora es un indicador de alto riesgo.
  2.  **Finalización:** ¿Cuántos créditos ha pagado por completo ("Pagado")? Un alto número de créditos pagados es una señal muy positiva.
  3.  **Renovaciones:** ¿El cliente ha renovado créditos ("Renovado")? Esto es una señal de confianza y buen comportamiento.
  4.  **Compromiso:** Compara las cuotas pagadas con las totales en los créditos activos.
  5.  **Volumen:** La cantidad total de créditos que ha manejado.

  Después de tu análisis, genera una respuesta estructurada con los siguientes campos:
  - **riskScore:** Asigna una puntuación de 0 (sin riesgo) a 100 (riesgo máximo). Un cliente perfecto que paga todo a tiempo debería tener una puntuación cercana a 0. Un cliente con múltiples moras y créditos sin pagar debería tener una puntuación cercana a 100.
  - **summary:** Escribe un resumen breve y profesional de su comportamiento.
  - **recommendation:** Clasifícalo estrictamente en una de estas categorías: "Excelente", "Bueno", "Regular", "Malo", "Muy Malo".`,
});

// Define el flujo de Genkit que orquesta la llamada a la IA.
const analyzeClientReputationFlow = ai.defineFlow(
  {
    name: 'analyzeClientReputationFlow',
    inputSchema: ClientReputationInputSchema,
    outputSchema: ClientReputationOutputSchema,
  },
  async (input) => {
    // Si no hay historial, devuelve un resultado por defecto de riesgo medio.
    if (input.creditHistory.length === 0) {
      return {
        riskScore: 50,
        summary: "El cliente no tiene historial crediticio en la plataforma. Se recomienda proceder con precaución y solicitar garantías adicionales.",
        recommendation: "Regular",
      };
    }
    
    const { output } = await prompt(input);
    return output!;
  }
);
