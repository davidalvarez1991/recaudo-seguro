
"use server";

import { z } from "zod";
import { LoginSchema, RegisterSchema, CobradorRegisterSchema } from "./schemas";
import { redirect } from "next/navigation";
import { cookies } from 'next/headers';
import { db } from "./firebase";
import { doc, setDoc, getDoc, deleteDoc } from "firebase/firestore";
import bcrypt from 'bcryptjs';

export async function login(values: z.infer<typeof LoginSchema>) {
  const validatedFields = LoginSchema.safeParse(values);

  if (!validatedFields.success) {
    return { error: "Campos inválidos." };
  }
  
  const { idNumber, password } = validatedFields.data;
  
  const userDocRef = doc(db, "users", idNumber);
  const userDoc = await getDoc(userDocRef);

  if (!userDoc.exists()) {
      return { error: "Credenciales inválidas." };
  }

  const userData = userDoc.data();
  const isPasswordValid = await bcrypt.compare(password, userData.password);

  if (isPasswordValid) {
    cookies().set('loggedInUser', idNumber, { httpOnly: true, path: '/' });
    redirect(`/dashboard/${userData.role}`);
  } else {
    return { error: "Credenciales inválidas." };
  }
}

export async function register(values: z.infer<typeof RegisterSchema>, role: "cliente" | "proveedor"): Promise<{ error?: string; successUrl?: string; success?: boolean; }> {
  const validatedFields = RegisterSchema.safeParse(values);

  if (!validatedFields.success) {
    return { error: "Campos inválidos. Por favor, revisa los datos." };
  }
  
  const { idNumber, email, password, whatsappNumber } = validatedFields.data;

  const userDocRef = doc(db, "users", idNumber);
  const userDoc = await getDoc(userDocRef);

  if (userDoc.exists()) {
    return { error: "El número de cédula ya está registrado." };
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  await setDoc(userDocRef, {
      email,
      whatsappNumber,
      password: hashedPassword,
      role: role,
      createdAt: new Date(),
  });
  
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

  const { idNumber, password, name } = validatedFields.data;
  
  const userDocRef = doc(db, "users", idNumber);
  const userDoc = await getDoc(userDocRef);

  if (userDoc.exists()) {
    return { error: "El número de cédula ya está registrado." };
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  
  await setDoc(userDocRef, {
      name: name,
      password: hashedPassword,
      role: 'cobrador',
      createdAt: new Date(),
  });

  return { success: true };
}

export async function deleteCobrador(idNumber: string): Promise<{ error?: string; success?: boolean; }> {
  const userDocRef = doc(db, "users", idNumber);
  const userDoc = await getDoc(userDocRef);

  if (!userDoc.exists() || userDoc.data().role !== 'cobrador') {
    return { error: "El cobrador no existe o no se puede eliminar." };
  }

  await deleteDoc(userDocRef);
  
  console.log(`Cobrador with ID ${idNumber} has been deleted from Firestore.`);
  
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
