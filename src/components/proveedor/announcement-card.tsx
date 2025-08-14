
"use client";

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Megaphone, X } from 'lucide-react';
import { format, toZonedTime } from 'date-fns-tz';
import { es } from 'date-fns/locale';
import { Button } from '../ui/button';

type Announcement = {
    id: string;
    message: string;
    createdAt: string;
};

type AnnouncementCardProps = {
    announcement: Announcement;
};

export function AnnouncementCard({ announcement }: AnnouncementCardProps) {
    const [isVisible, setIsVisible] = useState(true);

    if (!isVisible) {
        return null;
    }
    
    // Convert UTC date string to a specific timezone before formatting
    const zonedDate = toZonedTime(new Date(announcement.createdAt), 'America/Bogota');
    const formattedDate = format(zonedDate, "d 'de' MMMM, yyyy 'a las' HH:mm", { locale: es });


    return (
        <Card className="bg-primary/10 border-primary/20 relative">
            <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                    <div className="p-2 bg-background/50 rounded-full text-primary">
                       <Megaphone className="h-6 w-6" />
                    </div>
                    <div className="flex-1 space-y-2">
                        <h4 className="font-bold text-lg text-primary">Anuncio Importante</h4>
                        <p className="text-sm text-primary/90 whitespace-pre-wrap">{announcement.message}</p>
                        <p className="text-xs text-muted-foreground pt-1">
                            Publicado el: {formattedDate}
                        </p>
                    </div>
                </div>
            </CardContent>
            <Button
                variant="ghost"
                size="icon"
                className="absolute top-2 right-2 h-7 w-7 text-primary/60 hover:text-primary"
                onClick={() => setIsVisible(false)}
            >
                <X className="h-4 w-4" />
                <span className="sr-only">Cerrar anuncio</span>
            </Button>
        </Card>
    );
}
