"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { CalendarCheck, Hourglass, PartyPopper, CalendarClock } from 'lucide-react';
import { differenceInDays, startOfMonth, addMonths, startOfDay, format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Button } from '../ui/button';

const WhatsAppIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-message-circle"><path d="M12.02 2.01c-5.53 0-10.01 4.48-10.01 10.01 0 5.53 4.48 10.01 10.01 10.01 1.76 0 3.42-.46 4.88-1.28l4.11 1.28-1.28-4.11c.82-1.46 1.28-3.12 1.28-4.88.01-5.53-4.47-10.01-10-10.01Zm0 0"/></svg>
);

export function RenewalCountdown() {
    const [daysLeft, setDaysLeft] = useState<number | null>(null);
    const [isCollectionPeriod, setIsCollectionPeriod] = useState(false);
    const [nextCollectionDate, setNextCollectionDate] = useState<string>('');
    const [todayDate, setTodayDate] = useState<string>('');

    useEffect(() => {
        const today = startOfDay(new Date());
        const dayOfMonth = today.getDate();

        setTodayDate(format(today, "d 'de' MMMM", { locale: es }));

        if (dayOfMonth >= 1 && dayOfMonth <= 3) {
            setIsCollectionPeriod(true);
        } else {
            const currentMonthStart = startOfMonth(today);
            let nextCollectionStart: Date;

            if (today.getDate() > 3) {
                // Next collection is the 1st of next month
                nextCollectionStart = startOfMonth(addMonths(today, 1));
            } else {
                // This case handles if we are before the 1st (e.g., timezone issues), though less likely
                nextCollectionStart = currentMonthStart;
            }
            
            setDaysLeft(differenceInDays(nextCollectionStart, today));
            setNextCollectionDate(format(nextCollectionStart, "d 'de' MMMM", { locale: es }));
            setIsCollectionPeriod(false);
        }
    }, []);

    return (
        <Card className="border-dashed bg-muted/30">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    {isCollectionPeriod ? <PartyPopper className="text-accent" /> : <CalendarCheck className="text-primary" />}
                    Ciclo de Renovación de Suscripción
                </CardTitle>
                <CardDescription>
                    Recuerda que tu ciclo de pago es del 1 al 3 de cada mes para mantener tu cuenta activa.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {isCollectionPeriod ? (
                    <div className="p-6 rounded-lg bg-green-100 dark:bg-green-900/50 text-center">
                        <p className="text-sm font-semibold text-green-800 dark:text-green-200 uppercase">Período de Renovación Activo</p>
                        <p className="text-3xl font-bold text-green-700 dark:text-green-100">¡Es hora de renovar!</p>
                    </div>
                ) : (
                    <div className="p-6 rounded-lg bg-blue-100 dark:bg-blue-900/50 text-center space-y-4">
                        <div className="flex justify-around items-center text-blue-800 dark:text-blue-200">
                           <div className="text-center">
                                <p className="text-sm font-medium uppercase">Hoy es</p>
                                <p className="text-lg font-bold">{todayDate}</p>
                           </div>
                           <div className="text-center">
                                <p className="text-sm font-medium uppercase">Próximo Ciclo</p>
                                <p className="text-lg font-bold">{nextCollectionDate}</p>
                           </div>
                        </div>
                        <div className="flex items-center justify-center gap-3 pt-2 border-t border-blue-200/50 dark:border-blue-700/50">
                            <CalendarClock className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                            <p className="text-4xl font-bold text-blue-700 dark:text-blue-200">
                                {daysLeft !== null ? daysLeft : '...'}
                            </p>
                            <p className="text-xl text-blue-700/80 dark:text-blue-300 self-end pb-1">días restantes</p>
                        </div>
                    </div>
                )}
                 <Button asChild className="w-full bg-accent hover:bg-accent/90">
                     <a href="https://wa.me/573052353554" target="_blank" rel="noopener noreferrer" className="flex items-center justify-center">
                        <WhatsAppIcon />
                        Gestiona tu Renovación
                    </a>
                </Button>
            </CardContent>
        </Card>
    );
}
