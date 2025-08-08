
"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { getFinancialAdviceForProvider } from '@/lib/actions';
import { Lightbulb, AlertTriangle, BadgePercent, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

type Advice = {
    type: "warning" | "suggestion" | "info";
    title: string;
    message: string;
} | null;

const adviceConfig = {
    warning: {
        icon: AlertTriangle,
        className: "bg-red-100 dark:bg-red-900/30 border-red-200 text-red-800 dark:text-red-200",
    },
    suggestion: {
        icon: BadgePercent,
        className: "bg-green-100 dark:bg-green-900/30 border-green-200 text-green-800 dark:text-green-200",
    },
    info: {
        icon: Lightbulb,
        className: "bg-blue-100 dark:bg-blue-900/30 border-blue-200 text-blue-800 dark:text-blue-200",
    }
};

export function FinancialAdvisor() {
    const [advice, setAdvice] = useState<Advice>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAdvice = async () => {
            setLoading(true);
            try {
                const result = await getFinancialAdviceForProvider();
                if (result.advice) {
                    setAdvice(result.advice);
                }
            } catch (error) {
                console.error("Failed to fetch financial advice:", error);
                setAdvice(null); // Clear advice on error
            } finally {
                setLoading(false);
            }
        };
        
        fetchAdvice();
    }, []);

    if (loading) {
        return (
            <Card className="border-dashed bg-muted/30">
                <CardContent className="pt-6">
                    <div className="flex items-center gap-3 text-muted-foreground">
                        <Loader2 className="h-5 w-5 animate-spin" />
                        <p>Analizando tus finanzas...</p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    if (!advice) {
        return null; // Don't render anything if there's no advice or an error
    }

    const config = adviceConfig[advice.type];
    const Icon = config.icon;

    return (
        <Card className={cn("border-dashed", config.className)}>
            <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                    <div className="p-2 bg-background/50 rounded-full">
                       <Icon className="h-6 w-6" />
                    </div>
                    <div className="flex-1">
                        <h4 className="font-bold text-lg">{advice.title}</h4>
                        <p className="text-sm">{advice.message}</p>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
