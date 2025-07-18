
"use server";

import { z } from "zod";
import { LoginSchema, RegisterSchema, CobradorRegisterSchema, ClientCreditSchema } from "./schemas";
import { redirect } from "next/navigation";
import { cookies } from 'next/headers';
import { db } from "./firebase";
import { doc, setDoc, getDoc, deleteDoc, collection, query, where, getDocs, writeBatch } from "firebase/firestore";
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

export async function register(values: z.infer<typeof RegisterSchema>, role: "cliente" | "proveedor"): Promise<{ error?: string; successUrl?: string; }> {
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
      idNumber,
      email,
      whatsappNumber,
      password: hashedPassword,
      role: role,
      createdAt: new Date(),
  });
  
  cookies().set('loggedInUser', idNumber, { httpOnly: true, path: '/' });
  
  return { successUrl: `/dashboard/${role}` };
}

export async function registerCobrador(values: z.infer<typeof CobradorRegisterSchema>): Promise<{ error?: string; success?: boolean; }> {
  const validatedFields = CobradorRegisterSchema.safeParse(values);

  if (!validatedFields.success) {
    return { error: "Campos inválidos. Por favor, revisa los datos." };
  }

  const cookieStore = cookies();
  const providerId = cookieStore.get('loggedInUser')?.value;

  if (!providerId) {
      return { error: "El proveedor no está autenticado." };
  }

  const { idNumber, password, name } = validatedFields.data;
  
  const userDocRef = doc(db, "users", idNumber);
  const userDoc = await getDoc(userDocRef);

  if (userDoc.exists()) {
    return { error: "El número de cédula ya está registrado." };
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  
  await setDoc(userDocRef, {
      idNumber,
      name: name,
      password: hashedPassword,
      role: 'cobrador',
      providerId: providerId,
      createdAt: new Date(),
  });

  return { success: true };
}


export async function createClientAndCredit(values: z.infer<typeof ClientCreditSchema>): Promise<{ error?: string; success?: boolean; }> {
  const validatedFields = ClientCreditSchema.safeParse(values);

  if (!validatedFields.success) {
    return { error: "Campos inválidos. Por favor, revisa los datos." };
  }
  
  const { idNumber, address, contactPhone, guarantorPhone, creditAmount, installments } = validatedFields.data;
  
  const cookieStore = cookies();
  const cobradorId = cookieStore.get('loggedInUser')?.value;

  if (!cobradorId) {
    return { error: "El cobrador no está autenticado." };
  }

  const batch = writeBatch(db);

  // 1. Create or update client in a 'clients' collection
  const clientDocRef = doc(db, "clients", idNumber);
  batch.set(clientDocRef, {
    idNumber,
    address,
    contactPhone,
    guarantorPhone,
    updatedAt: new Date(),
  }, { merge: true }); // Use merge to avoid overwriting existing client data if they take another credit


  // 2. Create the new credit in a 'credits' collection
  const creditDocRef = doc(collection(db, "credits")); // Auto-generate ID
  batch.set(creditDocRef, {
    clienteId: idNumber,
    valor: creditAmount,
    cuotas: installments,
    fecha: new Date().toISOString(),
    estado: "Activo",
    cobradorId: cobradorId,
  });

  try {
    await batch.commit();
    return { success: true };
  } catch (e) {
    console.error("Error creating client and credit:", e);
    return { error: "No se pudo registrar el crédito. Inténtalo de nuevo." };
  }
}


export async function getCreditsByCobrador(cobradorId: string) {
    if (!cobradorId) return [];

    const creditsRef = collection(db, "credits");
    const q = query(creditsRef, where("cobradorId", "==", cobradorId));
    
    try {
        const querySnapshot = await getDocs(q);
        const credits = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        })) as any[]; // TODO: Add proper typing
        
        return credits;
    } catch (error) {
        console.error("Error fetching credits:", error);
        return [];
    }
}

export async function getCobradoresByProvider(providerId: string) {
    if (!providerId) return [];

    const usersRef = collection(db, "users");
    const q = query(usersRef, where("providerId", "==", providerId), where("role", "==", "cobrador"));

    try {
        const querySnapshot = await getDocs(q);
        const cobradores = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        })) as any[]; // TODO: Add proper typing
        return cobradores;
    } catch (error) {
        console.error("Error fetching cobradores:", error);
        return [];
    }
}

export async function getCreditsByProvider() {
    const cookieStore = cookies();
    const providerId = cookieStore.get('loggedInUser')?.value;
    if (!providerId) return [];

    // 1. Get all cobradores for the current provider
    const cobradores = await getCobradoresByProvider(providerId);
    if (cobradores.length === 0) return [];

    const cobradorIds = cobradores.map(c => c.idNumber);

    // 2. Get all credits where the cobradorId is one of the provider's cobradores
    const creditsRef = collection(db, "credits");
    const q = query(creditsRef, where("cobradorId", "in", cobradorIds));
    
    try {
        const querySnapshot = await getDocs(q);
        const credits = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        })) as any[]; // TODO: Add proper typing
        return credits;
    } catch (error) {
        console.error("Error fetching provider credits:", error);
        return [];
    }
}


export async function deleteCobrador(idNumber: string): Promise<{ error?: string; success?: boolean; }> {
  const userDocRef = doc(db, "users", idNumber);
  const userDoc = await getDoc(userDocRef);

  if (!userDoc.exists() || userDoc.data().role !== 'cobrador') {
    return { error: "El cobrador no existe o no se puede eliminar." };
  }

  await deleteDoc(userDocRef);
  
  return { success: true };
}

export async function getLoggedInUser() {
    const cookieStore = cookies();
    const loggedInUser = cookieStore.get('loggedInUser');
    return loggedInUser ? { id: loggedInUser.value } : null;
}

export async function getUserRole(userId: string): Promise<string | null> {
    if (!userId) return null;
    const userDocRef = doc(db, "users", userId);
    const userDoc = await getDoc(userDocRef);
    if (userDoc.exists()) {
        return userDoc.data().role;
    }
    return null;
}


export async function logout() {
    cookies().set('loggedInUser', '', { expires: new Date(0), path: '/' });
    redirect('/login');
}
