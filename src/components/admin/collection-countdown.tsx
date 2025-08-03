
"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { CalendarCheck, Hourglass, PartyPopper } from 'lucide-react';
import { differenceInDays, startOfMonth, addMonths, startOfDay } from 'date-fns';

export function CollectionCountdown() {
    const [daysLeft, setDaysLeft] = useState<number | null>(null);
    const [isCollectionPeriod, setIsCollectionPeriod] = useState(false);

    useEffect(() => {
        const today = startOfDay(new Date());
        const dayOfMonth = today.getDate();

        if (dayOfMonth >= 1 && dayOfMonth <= 3) {
            setIsCollectionPeriod(true);
        } else {
            const currentMonthStart = startOfMonth(today);
            let nextCollectionStart: Date;

            if (today > currentMonthStart) {
                // Next collection is the 1st of next month
                nextCollectionStart = startOfMonth(addMonths(today, 1));
            } else {
                // This case handles if we are before the 1st (e.g., timezone issues), though less likely
                nextCollectionStart = currentMonthStart;
            }
            
            setDaysLeft(differenceInDays(nextCollectionStart, today));
            setIsCollectionPeriod(false);
        }
    }, []);

    return (
        <Card className="border-dashed bg-muted/30">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    {isCollectionPeriod ? <PartyPopper className="text-accent" /> : <CalendarCheck className="text-primary" />}
                    Ciclo de Recaudo de Suscripciones
                </CardTitle>
                <CardDescription>
                    {isCollectionPeriod 
                        ? "Actualmente es el período para gestionar el recaudo de las suscripciones de los proveedores."
                        : "Aquí puedes ver cuánto falta para el próximo período de recaudo de suscripciones (días 1, 2 y 3 de cada mes)."
                    }
                </CardDescription>
            </CardHeader>
            <CardContent>
                {isCollectionPeriod ? (
                    <div className="p-6 rounded-lg bg-green-100 dark:bg-green-900/50 text-center">
                        <p className="text-sm font-semibold text-green-800 dark:text-green-200 uppercase">Período de Recaudo Activo</p>
                        <p className="text-3xl font-bold text-green-700 dark:text-green-100">¡Es hora de recaudar!</p>
                    </div>
                ) : (
                    <div className="p-6 rounded-lg bg-blue-100 dark:bg-blue-900/50 text-center">
                         <p className="text-sm font-semibold text-blue-800 dark:text-blue-200 uppercase">Próximo Recaudo en:</p>
                        <div className="flex items-center justify-center gap-3">
                            <Hourglass className="h-10 w-10 text-blue-600 dark:text-blue-400" />
                            <p className="text-5xl font-bold text-blue-700 dark:text-blue-200">
                                {daysLeft !== null ? daysLeft : '...'}
                            </p>
                            <p className="text-2xl text-blue-700/80 dark:text-blue-300 self-end pb-1">días</p>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
