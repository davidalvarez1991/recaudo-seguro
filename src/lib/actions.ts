
"use server";

import { z } from "zod";
import { LoginSchema, RegisterSchema, CobradorRegisterSchema, ClientCreditSchema, EditCobradorSchema } from "./schemas";
import { cookies } from 'next/headers';
import { db } from "./firebase";
import { doc, setDoc, getDoc, deleteDoc, collection, query, where, getDocs, writeBatch, getCountFromServer, updateDoc } from "firebase/firestore";
import bcrypt from 'bcryptjs';

export async function login(values: z.infer<typeof LoginSchema>) {
  const validatedFields = LoginSchema.safeParse(values);

  if (!validatedFields.success) {
    return { error: "Campos inválidos." };
  }
  
  const { idNumber, password } = validatedFields.data;
  
  // Hardcoded Admin check
  if (idNumber === "1143836674" && password === "1991070309") {
    cookies().set('loggedInUser', idNumber, { httpOnly: true, path: '/' });
    const userDocRef = doc(db, "users", idNumber);
    const userDoc = await getDoc(userDocRef);
    if (!userDoc.exists()) {
        await setDoc(userDocRef, {
            idNumber: idNumber,
            role: 'admin',
            name: 'Administrador Principal',
            createdAt: new Date(),
        });
    }
    return { successUrl: '/dashboard/admin' };
  }

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
  return { successUrl: `/dashboard/${userData.role}` };
}

export async function register(values: z.infer<typeof RegisterSchema>, role: "cliente" | "proveedor") {
  const validatedFields = RegisterSchema.safeParse(values);

  if (!validatedFields.success) {
    return { error: "Campos inválidos. Por favor, revisa los datos." };
  }
  
  const { idNumber, email, password, whatsappNumber, companyName } = validatedFields.data;
  
  if (role === 'proveedor' && (!companyName || companyName.trim() === '')) {
      return { error: "El nombre de la empresa es obligatorio para los proveedores." };
  }

  const userDocRef = doc(db, "users", idNumber);
  const userDoc = await getDoc(userDocRef);

  if (userDoc.exists()) {
    return { error: "El número de cédula ya está registrado." };
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const userData: any = {
      idNumber,
      email,
      whatsappNumber,
      password: hashedPassword,
      role: role,
      createdAt: new Date(),
  };
  
  if (role === 'proveedor' && companyName) {
      userData.companyName = companyName;
  }

  await setDoc(userDocRef, userData);
  
  cookies().set('loggedInUser', idNumber, { httpOnly: true, path: '/' });
  
  return { successUrl: `/dashboard/${role}` };
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
  
  const { idNumber, name, address, contactPhone, guarantorPhone, creditAmount, installments } = validatedFields.data;
  
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

  // 1. Set/update client details in 'clients' collection
  const clientDetailsDocRef = doc(db, "clients", idNumber);
  batch.set(clientDetailsDocRef, {
    idNumber,
    name,
    address,
    contactPhone,
    guarantorPhone,
    providerId: providerId,
    updatedAt: new Date(),
  }, { merge: true });

  // 2. Create a user account for the client in 'users' collection
  const clientUserDocRef = doc(db, "users", idNumber);
  const clientPassword = idNumber; // Password is the same as ID number
  const hashedPassword = await bcrypt.hash(clientPassword, 10);
  
  batch.set(clientUserDocRef, {
    idNumber,
    name,
    role: 'cliente',
    password: hashedPassword,
    providerId: providerId,
    createdBy: cobradorId,
    createdAt: new Date(),
  }, { merge: true });


  // 3. Create the credit record in 'credits' collection
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
        const creditsData = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        })) as any[];

        const creditsWithClientNames = await Promise.all(creditsData.map(async (credit) => {
            if (credit.clienteId) {
                const clientDocRef = doc(db, "users", credit.clienteId);
                const clientDoc = await getDoc(clientDocRef);
                if (clientDoc.exists()) {
                    return { ...credit, clienteName: clientDoc.data().name || 'Nombre no disponible' };
                }
            }
            return { ...credit, clienteName: 'Cliente no encontrado' };
        }));
        
        return creditsWithClientNames;
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
        const cobradores = querySnapshot.docs.map(doc => {
            const data = doc.data();
            
            const plainObject: {[key: string]: any} = {
                id: doc.id,
                ...data,
            };

            if (data.createdAt && typeof data.createdAt.toDate === 'function') {
                plainObject.createdAt = data.createdAt.toDate().toISOString();
            }
            if (data.updatedAt && typeof data.updatedAt.toDate === 'function') {
                plainObject.updatedAt = data.updatedAt.toDate().toISOString();
            }

            return plainObject;
        });
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
        const creditsData = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        })) as any[];

        const enrichedData = await Promise.all(creditsData.map(async (credit) => {
            let clienteName = 'Cliente no encontrado';
            let cobradorName = 'Cobrador no encontrado';

            if (credit.clienteId) {
                const clientDocRef = doc(db, "users", credit.clienteId);
                const clientDoc = await getDoc(clientDocRef);
                if (clientDoc.exists()) {
                    clienteName = clientDoc.data().name || 'Nombre no disponible';
                }
            }
            if (credit.cobradorId) {
                const cobradorDocRef = doc(db, "users", credit.cobradorId);
                const cobradorDoc = await getDoc(cobradorDocRef);
                if (cobradorDoc.exists()) {
                    cobradorName = cobradorDoc.data().name || 'Nombre no disponible';
                }
            }
            return { ...credit, clienteName, cobradorName };
        }));
        
        return enrichedData;
    } catch (error) {
        console.error("Error fetching provider credits:", error);
        return [];
    }
}


export async function deleteCobrador(idNumber: string) {
  const cookieStore = cookies();
  const providerId = cookieStore.get('loggedInUser')?.value;
  if (!providerId) {
    return { error: "El proveedor no está autenticado." };
  }

  const userDocRef = doc(db, "users", idNumber);
  const userDoc = await getDoc(userDocRef);

  if (!userDoc.exists() || userDoc.data().role !== 'cobrador' || userDoc.data().providerId !== providerId) {
    return { error: "El cobrador no existe o no tienes permiso para eliminarlo." };
  }

  await deleteDoc(userDocRef);
  
  return { success: true };
}

export async function updateCobrador(values: z.infer<typeof EditCobradorSchema>) {
  const validatedFields = EditCobradorSchema.safeParse(values);

  if (!validatedFields.success) {
    return { error: "Datos inválidos." };
  }
  
  const { originalIdNumber, idNumber, name, password } = validatedFields.data;

  const cookieStore = cookies();
  const providerId = cookieStore.get('loggedInUser')?.value;
  if (!providerId) {
    return { error: "El proveedor no está autenticado." };
  }

  const oldUserDocRef = doc(db, "users", originalIdNumber);
  const oldUserDoc = await getDoc(oldUserDocRef);

  if (!oldUserDoc.exists() || oldUserDoc.data().providerId !== providerId) {
    return { error: "No se encontró el cobrador o no tienes permiso para editarlo." };
  }

  // If the ID number is being changed, we need to check if the new ID is already taken.
  if (originalIdNumber !== idNumber) {
    const newUserDocRef = doc(db, "users", idNumber);
    const newUserDoc = await getDoc(newUserDocRef);
    if (newUserDoc.exists()) {
      return { error: "El nuevo número de identificación ya está en uso." };
    }
  }

  try {
    const batch = writeBatch(db);
    const oldData = oldUserDoc.data();
    
    const newData: any = {
      ...oldData,
      idNumber: idNumber,
      name: name,
      updatedAt: new Date(),
    };

    if (password) {
      newData.password = await bcrypt.hash(password, 10);
    }

    if (originalIdNumber !== idNumber) {
      // Create new document and delete old one
      const newUserDocRef = doc(db, "users", idNumber);
      batch.set(newUserDocRef, newData);
      batch.delete(oldUserDocRef);
    } else {
      // Just update the existing document
      batch.update(oldUserDocRef, newData);
    }
    
    await batch.commit();
    return { success: "El perfil del cobrador ha sido actualizado." };
  } catch (error) {
    console.error("Error updating cobrador:", error);
    return { error: "No se pudo actualizar el perfil del cobrador." };
  }
}

export async function deleteClientAndCredits(clienteId: string) {
  const cookieStore = cookies();
  const providerId = cookieStore.get('loggedInUser')?.value;
  if (!providerId) {
    return { error: "El proveedor no está autenticado." };
  }

  const clientDocRef = doc(db, "users", clienteId);
  const clientDoc = await getDoc(clientDocRef);

  if (!clientDoc.exists() || clientDoc.data().role !== 'cliente' || clientDoc.data().providerId !== providerId) {
    return { error: "El cliente no existe o no tienes permiso para eliminarlo." };
  }

  try {
    const batch = writeBatch(db);

    // Find and delete all credits for the client
    const creditsRef = collection(db, "credits");
    const q = query(creditsRef, where("clienteId", "==", clienteId), where("providerId", "==", providerId));
    const creditsSnapshot = await getDocs(q);
    creditsSnapshot.forEach((doc) => {
      batch.delete(doc.ref);
    });
    
    // Delete the client's user document
    batch.delete(clientDocRef);
    
    // Optionally, delete from the 'clients' collection if you have one
    const clientDetailsRef = doc(db, "clients", clienteId);
    if ((await getDoc(clientDetailsRef)).exists()) {
        batch.delete(clientDetailsRef);
    }

    await batch.commit();
    return { success: true };
  } catch (error) {
    console.error("Error deleting client and their credits:", error);
    return { error: "Ocurrió un error al eliminar al cliente y sus datos." };
  }
}

export async function getLoggedInUser() {
    const cookieStore = cookies();
    const loggedInUser = cookieStore.get('loggedInUser');
    return loggedInUser ? { id: loggedInUser.value } : null;
}

export async function getUserData(userId: string) {
    if (!userId) return null;
    try {
      const userDocRef = doc(db, "users", userId);
      const userDoc = await getDoc(userDocRef);
      if (userDoc.exists()) {
          return userDoc.data();
      }
      return null;
    } catch (error) {
      console.error("Error fetching user data:", error);
      return null;
    }
}

export async function getUserRole(userId: string): Promise<string | null> {
    const userData = await getUserData(userId);
    return userData ? userData.role : null;
}


export async function logout() {
    cookies().set('loggedInUser', '', { expires: new Date(0), path: '/' });
    return { successUrl: '/login' };
}
