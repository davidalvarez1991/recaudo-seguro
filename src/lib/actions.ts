
"use server";

import { z } from "zod";
import { LoginSchema, RegisterSchema, CobradorRegisterSchema, EditCobradorSchema, ClientCreditSchema, UpdateSignatureOnlySchema, UploadSingleDocumentSchema } from "./schemas";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import bcrypt from 'bcryptjs';
import { db, storage } from "./firebase";
import { collection, query, where, getDocs, addDoc, doc, getDoc, updateDoc, writeBatch, deleteDoc, Timestamp, setDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL, uploadString } from "firebase/storage";

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

async function ensureAdminUser() {
    const adminId = "0703091991";
    const adminPassword = process.env.ADMIN_PASSWORD || "19913030";
    const hashedPassword = await bcrypt.hash(adminPassword, 10);
    const usersRef = collection(db, "users");
    
    // Check if admin exists by idNumber
    const q = query(usersRef, where("idNumber", "==", adminId));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
        // Admin doesn't exist, create it. Use the ID number as the document ID for consistency.
        const adminDocRef = doc(db, "users", adminId);
        await setDoc(adminDocRef, {
            idNumber: adminId,
            password: hashedPassword,
            role: 'admin',
            name: 'Administrador',
            email: 'admin@recaudo.seguro',
            createdAt: new Date().toISOString()
        });
        console.log("Admin user created.");
    } else {
        // Admin exists, ensure password is correct.
        const adminDocRef = querySnapshot.docs[0].ref;
        await updateDoc(adminDocRef, {
            password: hashedPassword
        });
        console.log("Admin user password reset for safety.");
    }
}


// --- Auth Actions ---
export async function login(values: z.infer<typeof LoginSchema>) {
  try {
    await ensureAdminUser();

    const validatedFields = LoginSchema.safeParse(values);

    if (!validatedFields.success) {
      return { error: "Campos inválidos." };
    }

    const { idNumber, password } = validatedFields.data;
    
    const user = await findUserByIdNumber(idNumber);

    if (!user) {
        return { error: "Cédula o contraseña incorrecta." };
    }
    
    const userData: any = user; // To access password field
    const passwordsMatch = await bcrypt.compare(password, userData.password);

    if (!passwordsMatch) {
      return { error: "Cédula o contraseña incorrecta." };
    }
    
    cookies().set('loggedInUser', user.id, { httpOnly: true, path: '/' });
    cookies().set('userRole', userData.role, { httpOnly: true, path: '/' });

    return { successUrl: `/dashboard/${userData.role}` };

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
        name: role === 'proveedor' ? companyName : "Nuevo Cliente",
        email,
        whatsappNumber,
        createdAt: new Date().toISOString()
    });
    
    cookies().set('loggedInUser', newUserRef.id, { httpOnly: true, path: '/' });
    cookies().set('userRole', role, { httpOnly: true, path: '/' });

    return { successUrl: `/dashboard/${role}` };
}

export async function logout() {
  cookies().set('loggedInUser', '', { expires: new Date(0), path: '/' });
  cookies().set('userRole', '', { expires: new Date(0), path: '/' });
  return { successUrl: '/login' };
}

// --- Data Fetching Actions ---

export async function getUserRole(userId: string) {
    const cookieRole = cookies().get('userRole')?.value;
    if (cookieRole) {
      return cookieRole;
    }
    // Fallback in case cookie is missing, but do not set it here.
    const userDocRef = doc(db, "users", userId);
    const userSnap = await getDoc(userDocRef);
    if (!userSnap.exists()) return null;
    return userSnap.data().role || null;
}

export async function getUserData(userId: string) {
    const userDocRef = doc(db, "users", userId);
    const userSnap = await getDoc(userDocRef);
    if (!userSnap.exists()) {
        return null;
    }
    const user = { id: userSnap.id, ...userSnap.data() };
    
    const serializableUser: { [key: string]: any } = { ...user };
    
    if (user.createdAt && user.createdAt instanceof Timestamp) {
        serializableUser.createdAt = user.createdAt.toDate().toISOString();
    }
     if (user.updatedAt && user.updatedAt instanceof Timestamp) {
        serializableUser.updatedAt = user.updatedAt.toDate().toISOString();
    }

    return serializableUser;
}


export async function getCobradoresByProvider() {
    const providerIdCookie = cookies().get('loggedInUser');
    if (!providerIdCookie) return [];
    
    const providerDocRef = doc(db, "users", providerIdCookie.value);
    const providerSnap = await getDoc(providerDocRef);
    if (!providerSnap.exists()) return [];
    const provider = providerSnap.data();

    if (!provider || provider.role !== 'proveedor') return [];

    const cobradoresRef = collection(db, "users");
    const q = query(cobradoresRef, where("role", "==", "cobrador"), where("providerId", "==", providerIdCookie.value));
    const querySnapshot = await getDocs(q);

    return querySnapshot.docs.map(doc => {
        const data = doc.data();
        const serializableData: { [key: string]: any } = { id: doc.id, ...data };

        if (data.createdAt && data.createdAt instanceof Timestamp) {
            serializableData.createdAt = data.createdAt.toDate().toISOString();
        }
        if (data.updatedAt && data.updatedAt instanceof Timestamp) {
            serializableData.updatedAt = data.updatedAt.toDate().toISOString();
        }

        return serializableData;
    });
}

export async function getCreditsByProvider() {
    const providerIdCookie = cookies().get('loggedInUser');
    if (!providerIdCookie) return [];
    
    const providerDocRef = doc(db, "users", providerIdCookie.value);
    const providerSnap = await getDoc(providerDocRef);
    if (!providerSnap.exists()) return [];
    
    if (providerSnap.data().role !== 'proveedor') return [];
    
    const creditsRef = collection(db, "credits");
    const q = query(creditsRef, where("providerId", "==", providerIdCookie.value));
    const querySnapshot = await getDocs(q);
    
    const credits = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    for (const credit of credits) {
        const cobradorData = await findUserByIdNumber(credit.cobradorId as string);
        const clienteData = await findUserByIdNumber(credit.clienteId as string);
        credit.cobradorName = cobradorData?.name || 'No disponible';
        credit.clienteName = clienteData?.name || 'No disponible';
    }
    
    return credits;
}

export async function getCreditsByCobrador() {
    const cobradorIdCookie = cookies().get('loggedInUser');
    if (!cobradorIdCookie) return [];

    const cobradorDocRef = doc(db, "users", cobradorIdCookie.value);
    const cobradorSnap = await getDoc(cobradorDocRef);
    if (!cobradorSnap.exists()) return [];
    const cobrador = cobradorSnap.data();
    
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
    const providerDocRef = doc(db, "users", providerIdCookie.value);
    const providerSnap = await getDoc(providerDocRef);
    if (!providerSnap.exists()) return { error: "Proveedor no encontrado."};
    const provider = providerSnap.data();

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
        providerId: providerIdCookie.value,
        createdAt: new Date().toISOString()
    });

    return { success: `Cobrador ${values.name} registrado exitosamente.` };
}

export async function updateCobrador(values: z.infer<typeof EditCobradorSchema>) {
    const { originalIdNumber, idNumber, name, password } = values;

    if (originalIdNumber === '0703091991') {
        return { error: "La cuenta de administrador no puede ser modificada." };
    }

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
    const updateData: { idNumber: string; name: string; password?: string, updatedAt?: Timestamp } = { 
        idNumber, 
        name,
        updatedAt: Timestamp.now()
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

    const usersRef = collection(db, "users");
    const userQuery = query(usersRef, where("idNumber", "==", clienteId));
    const userSnapshot = await getDocs(userQuery);
    userSnapshot.forEach(doc => batch.delete(doc.ref));

    const creditsRef = collection(db, "credits");
    const creditQuery = query(creditsRef, where("clienteId", "==", clienteId));
    const creditSnapshot = await getDocs(creditQuery);
    creditSnapshot.forEach(doc => batch.delete(doc.ref));
    
    await batch.commit();
    return { success: true };
}

export async function createClientAndCredit(values: z.infer<typeof ClientCreditSchema>) {
    const cobradorIdCookie = cookies().get('loggedInUser');
    if (!cobradorIdCookie) return { error: "No se pudo identificar al cobrador." };

    const cobradorDocRef = doc(db, "users", cobradorIdCookie.value);
    const cobradorSnap = await getDoc(cobradorDocRef);
    if (!cobradorSnap.exists()) return { error: "Cobrador no encontrado."};
    const cobrador = cobradorSnap.data();

    if (!cobrador || cobrador.role !== 'cobrador') return { error: "Acción no autorizada." };
    
    const providerId = cobrador.providerId;
    if(!providerId) return { error: "El cobrador no tiene un proveedor asociado." };

    const validatedFields = ClientCreditSchema.safeParse(values);

    if (!validatedFields.success) {
        const errors = validatedFields.error.flatten().fieldErrors;
        const firstError = Object.values(errors)[0]?.[0] || "Datos del formulario inválidos.";
        return { error: firstError };
    }
    
    const { idNumber, name, address, contactPhone, guarantorName, guarantorPhone, guarantorAddress, creditAmount, installments, requiresGuarantor } = validatedFields.data;
    
    let existingClient = await findUserByIdNumber(idNumber);
    if (!existingClient) {
        const defaultPassword = await bcrypt.hash('password123', 10);
        await addDoc(collection(db, "users"),{
            idNumber,
            name,
            password: defaultPassword,
            role: 'cliente',
            providerId,
            address,
            contactPhone,
            createdAt: new Date().toISOString()
        });
    }

    const creditRef = await addDoc(collection(db, "credits"), {
        clienteId: idNumber,
        cobradorId: cobrador.idNumber,
        providerId,
        valor: parseFloat(creditAmount.replace(/\./g, '').replace(',', '.')),
        cuotas: parseInt(installments, 10),
        fecha: new Date().toISOString(),
        estado: 'Activo',
        documentUrls: [],
        signatureUrl: null,
        guarantor: requiresGuarantor ? {
            name: guarantorName,
            phone: guarantorPhone,
            address: guarantorAddress
        } : null,
    });

    return { success: true, creditId: creditRef.id };
}

export async function uploadSingleDocument(formData: FormData) {
    try {
        const rawData: {[k:string]: any} = Object.fromEntries(formData.entries());
        const validatedFields = UploadSingleDocumentSchema.safeParse(rawData);
        
        if (!validatedFields.success) {
            return { error: "Datos de subida inválidos." };
        }
        
        const { creditId, document } = validatedFields.data;

        // 1. Get Credit Data
        const creditRef = doc(db, "credits", creditId);
        const creditSnap = await getDoc(creditRef);
        if (!creditSnap.exists()) {
            return { error: "El crédito no fue encontrado." };
        }
        const creditData = creditSnap.data();
        
        // 2. Get Provider ID
        const providerId = creditData.providerId;
        if (!providerId) {
             return { error: "El crédito no tiene un proveedor asociado." };
        }

        // 3. Construct storage path and upload
        const storageRef = ref(storage, `documents/${providerId}/${creditData.clienteId}/${Date.now()}_${document.name}`);
        const buffer = await document.arrayBuffer();
        await uploadBytes(storageRef, buffer);
        const url = await getDownloadURL(storageRef);

        // 4. Update Firestore with the new URL
        const documentUrls = creditData.documentUrls || [];
        documentUrls.push(url);
        await updateDoc(creditRef, { documentUrls });

        return { success: true, url };

    } catch (error: any) {
        console.error("Upload error:", error);
        if (error.code) { // Firebase storage errors have a code property
            return { error: `Error de Firebase Storage: ${error.code}` };
        }
        return { error: "Error interno: no se pudo subir el archivo." };
    }
}


export async function updateCreditSignature(formData: FormData) {
    const rawData: {[k:string]: any} = Object.fromEntries(formData.entries());
    const validatedFields = UpdateSignatureOnlySchema.safeParse(rawData);

    if (!validatedFields.success) {
        const errors = validatedFields.error.flatten().fieldErrors;
        const firstError = Object.values(errors)[0]?.[0] || "Datos de la firma inválidos.";
        return { error: firstError };
    }

    const { creditId, signature } = validatedFields.data;
    const creditRef = doc(db, "credits", creditId);
    const creditSnap = await getDoc(creditRef);

    if (!creditSnap.exists()) {
        return { error: "El crédito no fue encontrado." };
    }
    const creditData = creditSnap.data();
    
    let signatureUrl: string | null = creditData.signatureUrl || null;
    if (signature) {
        const signatureRef = ref(storage, `signatures/${creditData.providerId}/${creditData.clienteId}/${creditId}.png`);
        const snapshot = await uploadString(signatureRef, signature, 'data_url');
        signatureUrl = await getDownloadURL(snapshot.ref);
    }
    
    await updateDoc(creditRef, {
        signatureUrl,
    });
    
    return { success: true };
}
