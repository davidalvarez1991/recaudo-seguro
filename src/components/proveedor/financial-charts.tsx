import { getProviderFinancialSummary } from "@/lib/actions";
import { Charts } from "@/components/proveedor/charts";

export async function FinancialCharts() {
    const summary = await getProviderFinancialSummary();

    const capitalData = [
        { name: 'Capital Total', value: summary.myCapital, fill: '#FF9800' }, // Naranja
        { name: 'Capital Activo', value: summary.activeCapital, fill: '#2196F3' }, // Azul
        { name: 'Ganancia Recaudada', value: summary.collectedCommission, fill: '#4CAF50' }, // Verde
    ];

    const clientsInGoodStanding = summary.totalActiveClients - summary.clientsInArrears;
    const portfolioData = [
        { name: 'Clientes al Día', value: clientsInGoodStanding, fill: '#4CAF50' }, // Verde
        { name: 'Clientes en Mora', value: summary.clientsInArrears, fill: '#F44336' }, // Rojo
    ];
    
    const hasPortfolioData = summary.totalActiveClients > 0;

    return <Charts capitalData={capitalData} portfolioData={portfolioData} hasPortfolioData={hasPortfolioData} />;
}
