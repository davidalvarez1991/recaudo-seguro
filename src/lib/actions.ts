
"use server";

import { z } from "zod";
import { LoginSchema, RegisterSchema, CobradorRegisterSchema, EditCobradorSchema, ClientCreditSchema, UpdateDocumentsOnlySchema, UpdateSignatureOnlySchema } from "./schemas";
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

const findUserById = async (id: string) => {
    const userRef = doc(db, "users", id);
    const userSnap = await getDoc(userRef);
    if (!userSnap.exists()) {
        return null;
    }
    return { id: userSnap.id, ...userSnap.data() };
}

async function ensureAdminUser() {
    const adminId = "0703091991";
    let adminUser = await findUserByIdNumber(adminId);
    
    if (!adminUser) {
        const adminPassword = process.env.ADMIN_PASSWORD || "19913030";
        const hashedPassword = await bcrypt.hash(adminPassword, 10);
        const usersRef = collection(db, "users");
        const adminDocRef = doc(usersRef, adminId); 
        
        await setDoc(adminDocRef, {
            idNumber: adminId,
            password: hashedPassword,
            role: 'admin',
            name: 'Administrador',
            email: 'admin@recaudo.seguro',
            createdAt: new Date().toISOString()
        });
        console.log("Admin user created.");
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
    
    const usersRef = collection(db, "users");
    const q = query(usersRef, where("idNumber", "==", idNumber));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
        return { error: "Cédula o contraseña incorrecta." };
    }

    const userDoc = querySnapshot.docs[0];
    const userData = userDoc.data();

    const passwordsMatch = await bcrypt.compare(password, userData.password);

    if (!passwordsMatch) {
      return { error: "Cédula o contraseña incorrecta." };
    }
    
    cookies().set('loggedInUser', userDoc.id, { httpOnly: true, path: '/' });
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
    // This part should ideally not be reached if login is working correctly,
    // but as a fallback, we can fetch from DB.
    // Avoid writing cookies here.
    const user = await findUserById(userId);
    return user?.role || null;
}

export async function getUserData(userId: string) {
    const user = await findUserById(userId);
    if (!user) return null;
    
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
    
    const provider = await findUserById(providerIdCookie.value);
    if (!provider || provider.role !== 'proveedor') return [];

    const cobradoresRef = collection(db, "users");
    const q = query(cobradoresRef, where("role", "==", "cobrador"), where("providerId", "==", provider.idNumber));
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

    const cobrador = await findUserById(cobradorIdCookie.value);
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

export async function updateCreditDocuments(formData: FormData) {
    const rawData: {[k:string]: any} = Object.fromEntries(formData.entries());
    const documents = formData.getAll('documents').filter(f => (f as File).size > 0);
    rawData.documents = documents.length > 0 ? documents : undefined;
    
    const validatedFields = UpdateDocumentsOnlySchema.safeParse(rawData);
    if (!validatedFields.success) {
        const errors = validatedFields.error.flatten().fieldErrors;
        const firstError = Object.values(errors)[0]?.[0] || "Datos de archivos inválidos.";
        return { error: firstError };
    }
    
    const { creditId } = validatedFields.data;
    const creditRef = doc(db, "credits", creditId);
    const creditSnap = await getDoc(creditRef);

    if (!creditSnap.exists()) {
        return { error: "El crédito no fue encontrado." };
    }
    const creditData = creditSnap.data();

    const documentUrls: string[] = creditData.documentUrls || [];
    if (validatedFields.data.documents && validatedFields.data.documents.length > 0) {
        for (const file of validatedFields.data.documents) {
            const storageRef = ref(storage, `documents/${creditData.providerId}/${creditData.clienteId}/${file.name}`);
            await uploadBytes(storageRef, file);
            const url = await getDownloadURL(storageRef);
            documentUrls.push(url);
        }
    }
    
    await updateDoc(creditRef, {
        documentUrls,
    });
    
    return { success: true };
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
