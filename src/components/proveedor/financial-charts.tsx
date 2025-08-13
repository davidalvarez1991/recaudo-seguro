
import { getProviderFinancialSummary } from "@/lib/actions";
import { Charts } from "@/components/proveedor/charts";

export async function FinancialCharts() {
    const summary = await getProviderFinancialSummary();

    const capitalData = [
        { name: 'Capital Total', value: summary.myCapital, fill: 'hsl(var(--orange-500))' },
        { name: 'Capital Activo', value: summary.activeCapital, fill: 'hsl(var(--blue-500))' },
        { name: 'Ganancia Recaudada', value: summary.collectedCommission, fill: 'hsl(var(--green-500))' },
    ];

    const clientsInGoodStanding = summary.totalActiveClients - summary.clientsInArrears;
    const portfolioData = [
        { name: 'Clientes al Día', value: clientsInGoodStanding, fill: 'hsl(var(--primary))' },
        { name: 'Clientes en Mora', value: summary.clientsInArrears, fill: 'hsl(var(--destructive))' },
    ];
    
    const hasPortfolioData = summary.totalActiveClients > 0;

    return <Charts capitalData={capitalData} portfolioData={portfolioData} hasPortfolioData={hasPortfolioData} />;
}
