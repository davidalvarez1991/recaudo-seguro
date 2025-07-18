
"use server";

import { z } from "zod";
import { LoginSchema, RegisterSchema, CobradorRegisterSchema } from "./schemas";
import { redirect } from "next/navigation";
import { cookies } from 'next/headers';
import { db } from "./firebase";
import { doc, setDoc, getDoc, deleteDoc } from "firebase/firestore";
import bcrypt from 'bcryptjs';

// Mock user roles for demonstration purposes. This will be replaced by Firestore logic.
let users: Record<string, string> = {
  "10000001": "admin",
  "20000002": "proveedor", // Will be created in DB on first login if not exists
  "40000004": "cliente",
  "30000003": "cobrador", 
};

// This will be replaced by storing hashed passwords in Firestore.
let userPasswords: Record<string, string> = {
    "10000001": "password123",
    "20000002": "password123",
    "40000004": "password123",
    "30000003": "password123",
};

export async function login(values: z.infer<typeof LoginSchema>) {
  const validatedFields = LoginSchema.safeParse(values);

  if (!validatedFields.success) {
    return { error: "Campos inválidos." };
  }
  
  const { idNumber, password } = validatedFields.data;
  
  // --- Firestore Login Logic (Future implementation) ---
  // const userDocRef = doc(db, "users", idNumber);
  // const userDoc = await getDoc(userDocRef);
  // if (userDoc.exists()) {
  //   const userData = userDoc.data();
  //   const isPasswordValid = await bcrypt.compare(password, userData.password);
  //   if (isPasswordValid) {
  //     cookies().set('loggedInUser', idNumber, { httpOnly: true, path: '/' });
  //     cookies().set('userRole', userData.role, { httpOnly: true, path: '/' });
  //     redirect(`/dashboard/${userData.role}`);
  //   }
  // }
  
  // --- Mock Login Logic (Current) ---
  const role = users[idNumber];
  const storedPassword = userPasswords[idNumber];
  if (role && password === storedPassword) {
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
  
  const { idNumber, email, password, whatsappNumber } = validatedFields.data;

  // Check if user already exists in Firestore
  const userDocRef = doc(db, "users", idNumber);
  const userDoc = await getDoc(userDocRef);

  if (userDoc.exists()) {
    return { error: "El número de cédula ya está registrado." };
  }

  // Hash the password before storing
  const hashedPassword = await bcrypt.hash(password, 10);

  // Create user in Firestore
  await setDoc(userDocRef, {
      email,
      whatsappNumber,
      password: hashedPassword,
      role: role,
      createdAt: new Date(),
  });
  
  // Also update mock data to keep login working during transition
  users[idNumber] = role;
  userPasswords[idNumber] = password; // Note: Storing plain text in mock, but hashed in DB
  
  cookies().set('loggedInUser', idNumber, { httpOnly: true, path: '/' });
  
  if (role === "proveedor") {
    return { success: true, successUrl: `/dashboard/proveedor` };
  } else {
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

  users[idNumber] = 'cobrador';
  userPasswords[idNumber] = password;

  return { success: true };
}

export async function deleteCobrador(idNumber: string): Promise<{ error?: string; success?: boolean; }> {
  if (!users[idNumber] || users[idNumber] !== 'cobrador') {
    return { error: "El cobrador no existe o no se puede eliminar." };
  }

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
    cookies().set('loggedInUser', '', { expires: new Date(0), path: '/' });
    redirect('/login');
}
