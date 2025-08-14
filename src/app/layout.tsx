
import type {Metadata} from 'next';
import { Toaster } from "@/components/ui/toaster"
import './globals.css';
import { cn } from '@/lib/utils';
import { InstallPWA } from '@/components/install-pwa';
import { SubscriptionHandler } from '@/components/notifications/subscription-handler';


export const metadata: Metadata = {
  title: 'Recaudo Seguro',
  description: 'Gestión de recaudos segura y eficiente.',
   manifest: "/manifest.json",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {

  return (
    <html lang="es">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta name="theme-color" content="#2962FF" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
        <link rel="icon" href="/icon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/icon.svg" />
      </head>
      <body className={cn("font-body antialiased bg-background")}>
        {children}
        <Toaster />
        <InstallPWA />
        <SubscriptionHandler />
      </body>
    </html>
  );
}
