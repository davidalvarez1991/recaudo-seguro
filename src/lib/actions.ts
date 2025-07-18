"use server";

import { z } from "zod";
import { LoginSchema, RegisterSchema } from "./schemas";
import { redirect } from "next/navigation";

// Mock user roles for demonstration purposes
const users: Record<string, string> = {
  "10000001": "admin",
  "20000002": "proveedor",
  "30000003": "cobrador",
  "40000004": "cliente",
};

export async function login(values: z.infer<typeof LoginSchema>) {
  const validatedFields = LoginSchema.safeParse(values);

  if (!validatedFields.success) {
    return { error: "Campos inválidos." };
  }
  
  const { idNumber } = validatedFields.data;
  
  const role = users[idNumber];

  if (role) {
    // In a real application, you would set a session cookie here.
    redirect(`/dashboard/${role}`);
  }

  return { error: "Credenciales inválidas." };
}

export async function register(values: z.infer<typeof RegisterSchema>, role: "cliente" | "proveedor" | "cobrador"): Promise<{ error?: string; successUrl?: string; success?: boolean; }> {
  const validatedFields = RegisterSchema.safeParse(values);

  if (!validatedFields.success) {
    return { error: "Campos inválidos. Por favor, revisa los datos." };
  }

  if (role === 'cobrador') {
    const cobradoresCount = Object.values(users).filter(userRole => userRole === 'cobrador').length;
    if (cobradoresCount >= 5) {
      return { error: "Se ha alcanzado el límite máximo de perfiles de cobrador." };
    }
  }

  // In a real application, you would create the user in the database here.
  // For now, we'll just log it. We should also add new users to our mock `users` object.
  console.log(`New ${role} registration:`, validatedFields.data.idNumber, validatedFields.data.email);
  users[validatedFields.data.idNumber] = role;

  if (role === 'cobrador') {
    return { success: true };
  }
  
  if (role === "proveedor") {
    // Return a success URL for the component to handle redirection.
    return { success: true, successUrl: `/dashboard/proveedor` };
  } else {
    // Return a success URL for other roles.
    return { success: true, successUrl: '/login?registered=true' };
  }
}


export async function logout() {
    // In a real application, you would clear the session cookie here.
    redirect('/login');
}
