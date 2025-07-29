
import type {Metadata} from 'next';
import { Toaster } from "@/components/ui/toaster"
import './globals.css';
import { cookies } from 'next/headers';
import { getUserData } from '@/lib/actions';
import { cn } from '@/lib/utils';


export const metadata: Metadata = {
  title: 'Recaudo Seguro',
  description: 'Gestión de recaudos segura y eficiente.',
};

// Define a mapping of font family names to Google Fonts URL strings
const fontMap: { [key: string]: string } = {
    'Roboto': 'Roboto:wght@400;700&display=swap',
    'Lato': 'Lato:wght@400;700&display=swap',
    'Montserrat': 'Montserrat:wght@400;700&display=swap',
    'Oswald': 'Oswald:wght@400;700&display=swap',
    'Playfair Display': 'Playfair+Display:wght@400;700&display=swap',
    'Merriweather': 'Merriweather:wght@400;700&display=swap',
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = cookies();
  const userId = cookieStore.get('loggedInUser')?.value;
  
  let fontUrl = null;
  let fontFamilyStyle = {};
  
  if (userId) {
      const userData = await getUserData(userId);
      const userFont = userData?.fontFamily;
      if (userFont && fontMap[userFont]) {
        fontUrl = `https://fonts.googleapis.com/css2?family=${fontMap[userFont].replace(/ /g, '+')}`;
        fontFamilyStyle = { fontFamily: `'${userFont}', sans-serif` };
      }
  }

  return (
    <html lang="es">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
        {fontUrl && <link href={fontUrl} rel="stylesheet" />}
      </head>
      <body className={cn("font-body antialiased bg-background")} style={fontFamilyStyle}>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
