
"use server";

import { z } from "zod";
import { LoginSchema, RegisterSchema, CobradorRegisterSchema } from "./schemas";
import { redirect } from "next/navigation";

// Mock user roles and passwords for demonstration purposes
const users: Record<string, string> = {
  "10000001": "admin",
  "20000002": "proveedor",
  "40000004": "cliente",
  "30000003": "cobrador", // Initial cobrador for testing
};

const userPasswords: Record<string, string> = {
    "10000001": "password123",
    "20000002": "password123",
    "40000004": "password123",
    "30000003": "password123", // Password for initial cobrador
};

export async function login(values: z.infer<typeof LoginSchema>) {
  const validatedFields = LoginSchema.safeParse(values);

  if (!validatedFields.success) {
    return { error: "Campos inválidos." };
  }
  
  const { idNumber, password } = validatedFields.data;
  
  const role = users[idNumber];
  const storedPassword = userPasswords[idNumber];

  if (role && password === storedPassword) {
    // In a real application, you would set a session cookie here.
    redirect(`/dashboard/${role}`);
  }

  return { error: "Credenciales inválidas." };
}

export async function register(values: z.infer<typeof RegisterSchema>, role: "cliente" | "proveedor"): Promise<{ error?: string; successUrl?: string; success?: boolean; }> {
  const validatedFields = RegisterSchema.safeParse(values);

  if (!validatedFields.success) {
    return { error: "Campos inválidos. Por favor, revisa los datos." };
  }
  
  const { idNumber, email, password } = validatedFields.data;

  // In a real application, you would create the user in the database here.
  console.log(`New ${role} registration:`, idNumber, email);
  users[idNumber] = role;
  userPasswords[idNumber] = password;
  
  if (role === "proveedor") {
    // Return a success URL for the component to handle redirection.
    return { success: true, successUrl: `/dashboard/proveedor` };
  } else {
    // Return a success URL for other roles.
    return { success: true, successUrl: '/login?registered=true' };
  }
}

export async function registerCobrador(values: z.infer<typeof CobradorRegisterSchema>): Promise<{ error?: string; success?: boolean; }> {
  const validatedFields = CobradorRegisterSchema.safeParse(values);

  if (!validatedFields.success) {
    return { error: "Campos inválidos. Por favor, revisa los datos." };
  }

  const { idNumber, password } = validatedFields.data;
  
  if (users[idNumber]) {
    return { error: "El número de cédula ya está registrado." };
  }

  // In a real application, you would create the user in the database here.
  console.log(`New cobrador registration:`, validatedFields.data.name, idNumber);
  users[idNumber] = 'cobrador';
  userPasswords[idNumber] = password;

  return { success: true };
}


export async function logout() {
    // In a real application, you would clear the session cookie here.
    redirect('/login');
}
