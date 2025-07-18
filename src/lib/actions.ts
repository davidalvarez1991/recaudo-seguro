
"use server";

import { z } from "zod";
import { LoginSchema, RegisterSchema, CobradorRegisterSchema } from "./schemas";
import { redirect } from "next/navigation";
import { cookies } from 'next/headers';

// Mock user roles and passwords for demonstration purposes
let users: Record<string, string> = {
  "10000001": "admin",
  "20000002": "proveedor",
  "40000004": "cliente",
  "30000003": "cobrador", // Initial cobrador for testing
};

let userPasswords: Record<string, string> = {
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
    // Simulate session by setting a cookie with the user's ID
    cookies().set('loggedInUser', idNumber, { httpOnly: true, path: '/' });
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

  // Check if user already exists
  if (users[idNumber]) {
    return { error: "El número de cédula ya está registrado." };
  }

  // In a real application, you would create the user in the database here.
  console.log(`New ${role} registration:`, idNumber, email);
  users[idNumber] = role;
  userPasswords[idNumber] = password;
  
  // Directly log in the new user by setting the cookie
  cookies().set('loggedInUser', idNumber, { httpOnly: true, path: '/' });
  
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

export async function deleteCobrador(idNumber: string): Promise<{ error?: string; success?: boolean; }> {
  if (!users[idNumber] || users[idNumber] !== 'cobrador') {
    return { error: "El cobrador no existe o no se puede eliminar." };
  }

  // In a real app, delete from DB. Here, we delete from our mock objects.
  delete users[idNumber];
  delete userPasswords[idNumber];
  
  console.log(`Cobrador with ID ${idNumber} has been deleted.`);
  
  return { success: true };
}

export async function getLoggedInUser() {
    const cookieStore = cookies();
    const loggedInUser = cookieStore.get('loggedInUser');
    return loggedInUser ? { id: loggedInUser.value } : null;
}

export async function logout() {
    // Clear the session cookie
    cookies().set('loggedInUser', '', { expires: new Date(0), path: '/' });
    redirect('/login');
}
