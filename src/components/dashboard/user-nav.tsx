
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
import { useRouter } from "next/navigation";

export function UserNav() {
  const [isPending, startTransition] = useTransition();
  const [logo, setLogo] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState("usuario@recaudo.seguro");
  const [userId, setUserId] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const getCookie = (name: string): string | null => {
      const value = `; ${document.cookie}`;
      const parts = value.split(`; ${name}=`);
      if (parts.length === 2) return parts.pop()?.split(';').shift() || null;
      return null;
    };
    const currentUserId = getCookie('loggedInUser');
    setUserId(currentUserId);
    if(currentUserId) {
        // In a real app, you'd fetch user details from an API
        setUserEmail(`${currentUserId}@recaudo.seguro`);
    }

    const updateLogo = () => {
      if (currentUserId) {
        const savedLogo = localStorage.getItem(`company-logo_${currentUserId}`);
        setLogo(savedLogo);
      } else {
        setLogo(null);
      }
    };

    updateLogo();

    window.addEventListener('logo-updated', updateLogo);
    
    // Listen for storage changes in other tabs, which might indicate login/logout
    const handleStorageChange = () => {
        const updatedUserId = getCookie('loggedInUser');
        if (updatedUserId !== userId) {
            window.location.reload(); // Reload if user session changes
        }
    };
    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('logo-updated', updateLogo);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [userId]);

  const handleLogout = () => {
    startTransition(async () => {
        const result = await logout();
        if (result.successUrl) {
          router.push(result.successUrl);
        }
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
              {userEmail}
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
