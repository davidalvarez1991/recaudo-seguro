
"use server";

import { z } from "zod";
import { LoginSchema, RegisterSchema, CobradorRegisterSchema, ClientCreditSchema } from "./schemas";
import { redirect } from "next/navigation";
import { cookies } from 'next/headers';
import { db } from "./firebase";
import { doc, setDoc, getDoc, deleteDoc, collection, query, where, getDocs, writeBatch, getCountFromServer } from "firebase/firestore";
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

  if (!isPasswordValid) {
    return { error: "Credenciales inválidas." };
  }
    
  cookies().set('loggedInUser', idNumber, { httpOnly: true, path: '/' });
  redirect(`/dashboard/${userData.role}`);
}

export async function register(values: z.infer<typeof RegisterSchema>, role: "cliente" | "proveedor") {
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
  
  redirect(`/dashboard/${role}`);
}


export async function registerCobrador(values: z.infer<typeof CobradorRegisterSchema>) {
  const validatedFields = CobradorRegisterSchema.safeParse(values);

  if (!validatedFields.success) {
    return { error: "Datos inválidos. Por favor revise el formulario." };
  }
  
  const cookieStore = cookies();
  const providerIdNumber = cookieStore.get('loggedInUser')?.value;

  if (!providerIdNumber) {
    return { error: "El proveedor no está autenticado. Por favor inicie sesión de nuevo." };
  }

  const { idNumber, password, name } = validatedFields.data;
  
  const cobradorDocRef = doc(db, "users", idNumber);
  const cobradorDoc = await getDoc(cobradorDocRef);

  if (cobradorDoc.exists()) {
    return { error: "El número de cédula del cobrador ya está registrado." };
  }

  const cobradoresCollection = collection(db, "users");
  const q = query(cobradoresCollection, where("providerId", "==", providerIdNumber), where("role", "==", "cobrador"));
  const countSnapshot = await getCountFromServer(q);
  const cobradoresCount = countSnapshot.data().count;

  if (cobradoresCount >= 5) {
    return { error: "Ha alcanzado el límite de 5 cobradores por proveedor." };
  }
  
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    
    await setDoc(cobradorDocRef, {
        idNumber,
        name,
        password: hashedPassword,
        role: 'cobrador',
        providerId: providerIdNumber,
        createdAt: new Date(),
    });

    return { success: `El perfil de cobrador para ${name} ha sido creado.` };
  } catch (error) {
    console.error("Error al registrar cobrador:", error);
    return { error: "No se pudo crear la cuenta del cobrador en la base de datos." };
  }
}


export async function createClientAndCredit(values: z.infer<typeof ClientCreditSchema>) {
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
  
  const cobradorDocRef = doc(db, "users", cobradorId);
  const cobradorDoc = await getDoc(cobradorDocRef);
  const providerId = cobradorDoc.exists() ? cobradorDoc.data().providerId : null;

  if (!providerId) {
      return { error: "No se pudo encontrar el proveedor asociado al cobrador." };
  }

  const batch = writeBatch(db);

  const clientDocRef = doc(db, "clients", idNumber);
  batch.set(clientDocRef, {
    idNumber,
    address,
    contactPhone,
    guarantorPhone,
    providerId: providerId,
    updatedAt: new Date(),
  }, { merge: true });


  const creditDocRef = doc(collection(db, "credits")); 
  batch.set(creditDocRef, {
    clienteId: idNumber,
    valor: creditAmount,
    cuotas: installments,
    fecha: new Date().toISOString(),
    estado: "Activo",
    cobradorId: cobradorId,
    providerId: providerId,
  });

  try {
    await batch.commit();
    return { success: true };
  } catch (e) {
    console.error("Error creating client and credit:", e);
    return { error: "No se pudo registrar el crédito. Inténtalo de nuevo." };
  }
}


export async function getCreditsByCobrador() {
    const cookieStore = cookies();
    const cobradorId = cookieStore.get('loggedInUser')?.value;
    if (!cobradorId) return [];

    const creditsRef = collection(db, "credits");
    const q = query(creditsRef, where("cobradorId", "==", cobradorId));
    
    try {
        const querySnapshot = await getDocs(q);
        const credits = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        })) as any[]; 
        
        return credits;
    } catch (error) {
        console.error("Error fetching credits:", error);
        return [];
    }
}

export async function getCobradoresByProvider() {
    const cookieStore = cookies();
    const providerId = cookieStore.get('loggedInUser')?.value;
    if (!providerId) return [];

    const usersRef = collection(db, "users");
    const q = query(usersRef, where("providerId", "==", providerId), where("role", "==", "cobrador"));

    try {
        const querySnapshot = await getDocs(q);
        const cobradores = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        })) as any[]; 
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

    const creditsRef = collection(db, "credits");
    const q = query(creditsRef, where("providerId", "==", providerId));
    
    try {
        const querySnapshot = await getDocs(q);
        const credits = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        })) as any[]; 
        return credits;
    } catch (error) {
        console.error("Error fetching provider credits:", error);
        return [];
    }
}


export async function deleteCobrador(idNumber: string) {
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
    try {
      const userDocRef = doc(db, "users", userId);
      const userDoc = await getDoc(userDocRef);
      if (userDoc.exists()) {
          return userDoc.data().role;
      }
      return null;
    } catch (error) {
      console.error("Error fetching user role:", error);
      return null;
    }
}


export async function logout() {
    cookies().set('loggedInUser', '', { expires: new Date(0), path: '/' });
    redirect('/login');
}
