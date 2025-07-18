
"use client"

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { logout } from "@/lib/actions";
import { User, LogOut, Loader2 } from "lucide-react";
import { useTransition, useState, useEffect } from "react";

export function UserNav() {
  const [isPending, startTransition] = useTransition();
  const [logo, setLogo] = useState<string | null>(null);

  useEffect(() => {
    const updateLogo = () => {
      const savedLogo = localStorage.getItem('company-logo');
      setLogo(savedLogo);
    };

    updateLogo(); // Initial load

    window.addEventListener('logo-updated', updateLogo);
    window.addEventListener('storage', updateLogo); // Listen for changes from other tabs

    return () => {
      window.removeEventListener('logo-updated', updateLogo);
      window.removeEventListener('storage', updateLogo);
    };
  }, []);

  const handleLogout = () => {
    startTransition(() => {
        logout();
    });
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-9 w-9 rounded-full">
          <Avatar className="h-9 w-9">
            <AvatarImage src={logo || "https://placehold.co/100x100.png"} data-ai-hint="user avatar" alt="@user" />
            <AvatarFallback>U</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">Usuario</p>
            <p className="text-xs leading-none text-muted-foreground">
              usuario@recaudo.seguro
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem>
            <User className="mr-2 h-4 w-4" />
            <span>Mi Perfil</span>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout} disabled={isPending}>
            {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <LogOut className="mr-2 h-4 w-4" />}
          <span>Cerrar sesión</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
