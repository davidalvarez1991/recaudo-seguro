"use server";

import { z } from "zod";
import { LoginSchema, RegisterSchema } from "./schemas";
import { redirect } from "next/navigation";

// Mock user roles for demonstration purposes
const users: Record<string, string> = {
  "admin@recaudo.seguro": "admin",
  "proveedor@recaudo.seguro": "proveedor",
  "cobrador@recaudo.seguro": "cobrador",
  "cliente@recaudo.seguro": "cliente",
};

export async function login(values: z.infer<typeof LoginSchema>) {
  const validatedFields = LoginSchema.safeParse(values);

  if (!validatedFields.success) {
    return { error: "Campos inválidos." };
  }
  
  const { email } = validatedFields.data;
  
  const role = users[email];

  if (role) {
    // In a real application, you would set a session cookie here.
    redirect(`/dashboard/${role}`);
  }

  return { error: "Credenciales inválidas." };
}

export async function register(values: z.infer<typeof RegisterSchema>, role: "cliente" | "proveedor") {
  const validatedFields = RegisterSchema.safeParse(values);

  if (!validatedFields.success) {
    return { error: "Campos inválidos. Por favor, revisa los datos." };
  }

  // In a real application, you would create the user in the database here.
  console.log(`New ${role} registration:`, validatedFields.data.email);

  // We redirect to the login page with a query param to show a toast.
  redirect('/login?registered=true');
}


export async function logout() {
    // In a real application, you would clear the session cookie here.
    redirect('/login');
}
