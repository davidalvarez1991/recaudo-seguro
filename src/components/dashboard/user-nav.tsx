
"use client"

import { Button } from "@/components/ui/button";
import { logout } from "@/lib/actions";
import { LogOut, Loader2 } from "lucide-react";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";


export function UserNav() {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleLogout = () => {
    startTransition(async () => {
        const result = await logout();
        if (result.successUrl) {
          router.push(result.successUrl);
        }
    });
  }

  return (
    <TooltipProvider>
        <Tooltip>
            <TooltipTrigger asChild>
                <Button 
                    variant="ghost" 
                    size="icon" 
                    className="relative h-9 w-9 rounded-full" 
                    onClick={handleLogout} 
                    disabled={isPending}
                    aria-label="Cerrar sesión"
                >
                    {isPending ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                        <LogOut className="h-5 w-5" />
                    )}
                    <span className="sr-only">Cerrar sesión</span>
                </Button>
            </TooltipTrigger>
            <TooltipContent>
                <p>Cerrar sesión</p>
            </TooltipContent>
        </Tooltip>
    </TooltipProvider>
  );
}
