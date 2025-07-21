
"use server";

import { z } from "zod";
import { LoginSchema, RegisterSchema, CobradorRegisterSchema, EditCobradorSchema, ClientCreditSchema } from "./schemas";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import bcrypt from 'bcryptjs';
import { db, storage } from "./firebase";
import { collection, query, where, getDocs, addDoc, doc, getDoc, updateDoc, writeBatch, deleteDoc, Timestamp } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

// --- Utility Functions ---
const findUserByIdNumber = async (idNumber: string) => {
    const usersRef = collection(db, "users");
    const q = query(usersRef, where("idNumber", "==", idNumber));
    const querySnapshot = await getDocs(q);
    if (querySnapshot.empty) {
        return null;
    }
    const userDoc = querySnapshot.docs[0];
    return { id: userDoc.id, ...userDoc.data() };
};

const findUserById = async (id: string) => {
    const userRef = doc(db, "users", id);
    const userSnap = await getDoc(userRef);
    if (!userSnap.exists()) {
        return null;
    }
    return { id: userSnap.id, ...userSnap.data() };
}

// --- Auth Actions ---
export async function login(values: z.infer<typeof LoginSchema>) {
  try {
    const validatedFields = LoginSchema.safeParse(values);

    if (!validatedFields.success) {
      return { error: "Campos inválidos." };
    }

    const { idNumber, password } = validatedFields.data;
    
    const usersRef = collection(db, "users");
    const q = query(usersRef, where("idNumber", "==", idNumber));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
        return { error: "Cédula o contraseña incorrecta." };
    }

    const userDoc = querySnapshot.docs[0];
    const existingUser = userDoc.data();

    const passwordsMatch = await bcrypt.compare(password, existingUser.password);

    if (!passwordsMatch) {
      return { error: "Cédula o contraseña incorrecta." };
    }
    
    cookies().set('loggedInUser', userDoc.id, { httpOnly: true, path: '/' });

    return { successUrl: `/dashboard/${existingUser.role}` };

  } catch (error) {
    console.error("Login error:", error);
    return { error: "Algo salió mal en el servidor." };
  }
}

export async function register(values: z.infer<typeof RegisterSchema>, role: 'cliente' | 'proveedor') {
    const validatedFields = RegisterSchema.safeParse(values);

    if (!validatedFields.success) {
        return { error: "Campos inválidos." };
    }

    const { idNumber, password, companyName, email, whatsappNumber } = validatedFields.data;

    const existingUser = await findUserByIdNumber(idNumber);
    if (existingUser) {
        return { error: "El número de identificación ya está registrado." };
    }
    
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const newUserRef = await addDoc(collection(db, "users"), {
        idNumber,
        password: hashedPassword,
        role,
        companyName: role === 'proveedor' ? companyName : "",
        name: role === 'proveedor' ? companyName : "Nuevo Cliente", // Asignar companyName a name para proveedor
        email,
        whatsappNumber,
        createdAt: new Date().toISOString()
    });
    
    cookies().set('loggedInUser', newUserRef.id, { httpOnly: true, path: '/' });

    return { successUrl: `/dashboard/${role}` };
}

export async function logout() {
  cookies().set('loggedInUser', '', { expires: new Date(0), path: '/' });
  return { successUrl: '/login' };
}

// --- Data Fetching Actions ---

export async function getUserRole(userId: string) {
    const user = await findUserById(userId);
    return user?.role || null;
}

export async function getUserData(userId: string) {
    const user = await findUserById(userId);
    if (user && user.createdAt && user.createdAt instanceof Timestamp) {
        return { ...user, createdAt: user.createdAt.toDate().toISOString() };
    }
    return user || null;
}


export async function getCobradoresByProvider() {
    const providerIdCookie = cookies().get('loggedInUser');
    if (!providerIdCookie) return [];
    
    const provider = await findUserById(providerIdCookie.value);
    if (!provider || provider.role !== 'proveedor') return [];

    const cobradoresRef = collection(db, "users");
    const q = query(cobradoresRef, where("role", "==", "cobrador"), where("providerId", "==", provider.idNumber));
    const querySnapshot = await getDocs(q);

    return querySnapshot.docs.map(doc => {
        const data = doc.data();
        // Convert Firestore Timestamp to a serializable format (ISO string)
        const createdAt = data.createdAt;
        let serializableCreatedAt;

        if (createdAt instanceof Timestamp) {
            serializableCreatedAt = createdAt.toDate().toISOString();
        } else if (typeof createdAt === 'string') {
            serializableCreatedAt = createdAt;
        } else {
            serializableCreatedAt = new Date().toISOString();
        }

        return { 
            id: doc.id, 
            ...data,
            createdAt: serializableCreatedAt
        };
    });
}

export async function getCreditsByProvider() {
    const providerIdCookie = cookies().get('loggedInUser');
    if (!providerIdCookie) return [];
    
    const provider = await findUserById(providerIdCookie.value);
    if (!provider || provider.role !== 'proveedor') return [];
    
    const creditsRef = collection(db, "credits");
    const q = query(creditsRef, where("providerId", "==", provider.idNumber));
    const querySnapshot = await getDocs(q);
    
    const credits = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    for (const credit of credits) {
        const cobrador = await findUserByIdNumber(credit.cobradorId as string);
        const cliente = await findUserByIdNumber(credit.clienteId as string);
        credit.cobradorName = cobrador?.name || 'No disponible';
        credit.clienteName = cliente?.name || 'No disponible';
    }
    
    return credits;
}

export async function getCreditsByCobrador() {
    const cobradorIdCookie = cookies().get('loggedInUser');
    if (!cobradorIdCookie) return [];

    const cobrador = await findUserById(cobradorIdCookie.value);
    if (!cobrador || cobrador.role !== 'cobrador') return [];
    
    const creditsRef = collection(db, "credits");
    const q = query(creditsRef, where("cobradorId", "==", cobrador.idNumber));
    const querySnapshot = await getDocs(q);

    const credits = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data()}));

     for (const credit of credits) {
        const cliente = await findUserByIdNumber(credit.clienteId as string);
        credit.clienteName = cliente?.name || 'No disponible';
    }

    return credits;
}

// --- Data Mutation Actions ---

export async function registerCobrador(values: z.infer<typeof CobradorRegisterSchema>) {
    const providerIdCookie = cookies().get('loggedInUser');
    if (!providerIdCookie) {
        return { error: "No se pudo identificar al proveedor." };
    }
    const provider = await findUserById(providerIdCookie.value);
    if (!provider || provider.role !== 'proveedor') {
        return { error: "Acción no autorizada." };
    }

    if (await findUserByIdNumber(values.idNumber)) {
        return { error: "El número de identificación ya está en uso." };
    }
    
    const hashedPassword = await bcrypt.hash(values.password, 10);

    await addDoc(collection(db, "users"), {
        idNumber: values.idNumber,
        name: values.name,
        password: hashedPassword,
        role: 'cobrador',
        providerId: provider.idNumber,
        createdAt: new Date().toISOString()
    });

    return { success: `Cobrador ${values.name} registrado exitosamente.` };
}

export async function updateCobrador(values: z.infer<typeof EditCobradorSchema>) {
    const { originalIdNumber, idNumber, name, password } = values;

    const usersRef = collection(db, "users");
    const q = query(usersRef, where("idNumber", "==", originalIdNumber));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
        return { error: "Cobrador no encontrado." };
    }

    if (originalIdNumber !== idNumber && await findUserByIdNumber(idNumber)) {
        return { error: "El nuevo número de identificación ya está en uso." };
    }
    
    const userDoc = querySnapshot.docs[0];
    const updateData: { idNumber: string; name: string; password?: string, updatedAt?: string } = { 
        idNumber, 
        name,
        updatedAt: new Date().toISOString()
    };

    if (password) {
        updateData.password = await bcrypt.hash(password, 10);
    }

    await updateDoc(doc(db, "users", userDoc.id), updateData);

    return { success: "Cobrador actualizado exitosamente." };
}

export async function deleteCobrador(idNumber: string) {
    const usersRef = collection(db, "users");
    const q = query(usersRef, where("idNumber", "==", idNumber), where("role", "==", "cobrador"));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
        return { error: "Cobrador no encontrado." };
    }
    
    const batch = writeBatch(db);
    querySnapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
    });
    await batch.commit();

    return { success: true };
}

export async function deleteClientAndCredits(clienteId: string) {
    const batch = writeBatch(db);

    // Delete client user
    const usersRef = collection(db, "users");
    const userQuery = query(usersRef, where("idNumber", "==", clienteId));
    const userSnapshot = await getDocs(userQuery);
    userSnapshot.forEach(doc => batch.delete(doc.ref));

    // Delete associated credits
    const creditsRef = collection(db, "credits");
    const creditQuery = query(creditsRef, where("clienteId", "==", clienteId));
    const creditSnapshot = await getDocs(creditQuery);
    creditSnapshot.forEach(doc => batch.delete(doc.ref));
    
    await batch.commit();
    return { success: true };
}

export async function createClientAndCredit(formData: FormData, onProgress: (progress: number) => void) {
    const cobradorIdCookie = cookies().get('loggedInUser');
    if (!cobradorIdCookie) return { error: "No se pudo identificar al cobrador." };

    const cobrador = await findUserById(cobradorIdCookie.value);
    if (!cobrador || cobrador.role !== 'cobrador') return { error: "Acción no autorizada." };
    
    const providerId = cobrador.providerId;
    if(!providerId) return { error: "El cobrador no tiene un proveedor asociado." };

    const rawData = Object.fromEntries(formData.entries());
    const validatedFields = ClientCreditSchema.safeParse(rawData);

    if (!validatedFields.success) {
        console.error(validatedFields.error.flatten().fieldErrors);
        return { error: "Datos del formulario inválidos." };
    }
    
    const { idNumber, name, address, contactPhone, guarantorName, guarantorPhone, creditAmount, installments, documents } = validatedFields.data;

    let totalFiles = Array.isArray(documents) ? documents.length : 0;
    let filesUploaded = 0;
    
    const updateProgress = () => {
        if (totalFiles > 0) {
            const progress = Math.round(((filesUploaded / totalFiles) * 0.9 + 0.1) * 100);
            onProgress(progress);
        } else {
             onProgress(50);
        }
    };
    
    updateProgress();
    
    let existingClient = await findUserByIdNumber(idNumber);
    if (!existingClient) {
        const defaultPassword = await bcrypt.hash('password123', 10);
        const newClientUserRef = await addDoc(collection(db, "users"),{
            idNumber,
            name,
            password: defaultPassword,
            role: 'cliente',
            providerId,
            address,
            contactPhone,
            createdAt: new Date().toISOString()
        });
        existingClient = { id: newClientUserRef.id, idNumber };
    }
    
    const documentUrls: string[] = [];
    if (documents && documents.length > 0) {
        totalFiles = documents.length;
        for (const file of documents) {
            const storageRef = ref(storage, `documents/${providerId}/${idNumber}/${file.name}`);
            await uploadBytes(storageRef, file);
            const url = await getDownloadURL(storageRef);
            documentUrls.push(url);
            filesUploaded++;
            updateProgress();
        }
    }

    await addDoc(collection(db, "credits"), {
        clienteId: idNumber,
        clienteName: name,
        cobradorId: cobrador.idNumber,
        providerId,
        valor: parseFloat(creditAmount.replace(/\./g, '').replace(',', '.')),
        cuotas: parseInt(installments, 10),
        fecha: new Date().toISOString(),
        estado: 'Activo',
        documentUrls,
        guarantor: {
            name: guarantorName,
            phone: guarantorPhone
        }
    });
    
    onProgress(100);

    return { success: true };
}
