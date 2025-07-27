
"use server";

import { z } from "zod";
import { LoginSchema, RegisterSchema, CobradorRegisterSchema, EditCobradorSchema, ClientCreditSchema, UploadSingleDocumentSchema, SavePaymentScheduleSchema, RenewCreditSchema, EditClientSchema } from "./schemas";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import bcrypt from 'bcryptjs';
import { db, storage } from "./firebase";
import { collection, query, where, getDocs, addDoc, doc, getDoc, updateDoc, writeBatch, deleteDoc, Timestamp, setDoc, increment, orderBy, limit } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { startOfDay, differenceInDays } from 'date-fns';

const ADMIN_ID = "admin_0703091991";

// --- Utility Functions ---
const findUserByIdNumber = async (idNumber: string) => {
    const usersRef = collection(db, "users");
    const q = query(usersRef, where("idNumber", "==", idNumber));
    const querySnapshot = await getDocs(q);
    if (querySnapshot.empty) {
        return null;
    }
    const userDoc = querySnapshot.docs[0];
    const data = userDoc.data();
     const serializableData: { [key: string]: any } = { id: userDoc.id, ...data };
    // Convert Timestamps to strings
    if (data.createdAt && data.createdAt instanceof Timestamp) {
        serializableData.createdAt = data.createdAt.toDate().toISOString();
    }
     if (data.updatedAt && data.updatedAt instanceof Timestamp) {
        serializableData.updatedAt = data.updatedAt.toDate().toISOString();
    }
    return serializableData;
};

// --- Auth Actions ---
export async function login(values: z.infer<typeof LoginSchema>) {
  try {
    const validatedFields = LoginSchema.safeParse(values);

    if (!validatedFields.success) {
      return { error: "Campos inválidos." };
    }

    const { idNumber, password } = validatedFields.data;
    
    // Check for a hardcoded admin user first
    if (idNumber === "0703091991" && password === "19913030") {
         cookies().set('loggedInUser', ADMIN_ID, { httpOnly: true, path: '/' });
         cookies().set('userRole', 'admin', { httpOnly: true, path: '/' });
         return { successUrl: `/dashboard/admin` };
    }
    
    const user = await findUserByIdNumber(idNumber);

    if (!user || !user.password) {
        return { error: "Cédula o contraseña incorrecta." };
    }
    
    const passwordsMatch = await bcrypt.compare(password, user.password);

    if (!passwordsMatch) {
      return { error: "Cédula o contraseña incorrecta." };
    }
    
    cookies().set('loggedInUser', user.id, { httpOnly: true, path: '/' });
    cookies().set('userRole', user.role, { httpOnly: true, path: '/' });

    return { successUrl: `/dashboard/${user.role}` };

  } catch (error) {
    console.error("Login error:", error);
    return { error: "Algo salió mal en el servidor." };
  }
}

export async function register(values: z.infer<typeof RegisterSchema>, role: 'proveedor') {
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
    
    if (newUserRef) {
        cookies().set('loggedInUser', newUserRef.id, { httpOnly: true, path: '/' });
        cookies().set('userRole', role, { httpOnly: true, path: '/' });
        return { successUrl: `/dashboard/${role}` };
    }
    
    return { error: "No se pudo crear el usuario."};
}

export async function logout() {
  cookies().set('loggedInUser', '', { expires: new Date(0), path: '/' });
  cookies().set('userRole', '', { expires: new Date(0), path: '/' });
  return { successUrl: '/login' };
}

// --- Data Fetching Actions ---

export async function getUserRole(userId: string) {
    // Special case for hardcoded admin
    if (userId === ADMIN_ID) {
        return 'admin';
    }
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
    // Special case for hardcoded admin
    if (userId === ADMIN_ID) {
        return {
            id: ADMIN_ID,
            name: 'Administrador',
            role: 'admin'
        };
    }
    const userDocRef = doc(db, "users", userId);
    const userSnap = await getDoc(userDocRef);
    if (!userSnap.exists()) {
        return null;
    }
    const user = { id: userSnap.id, ...userSnap.data() };
    
    const serializableUser: { [key: string]: any } = { ...user };
    
    // Convert Timestamps to ISO strings to make them serializable
    for (const key in serializableUser) {
        if (serializableUser[key] instanceof Timestamp) {
            serializableUser[key] = serializableUser[key].toDate().toISOString();
        }
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

const calculateLateFee = (credit: any) => {
    if (!credit.lateInterestRate || credit.lateInterestRate === 0) {
        return 0;
    }
    const missedDays = credit.missedPaymentDays || 0;
    if (missedDays <= 0) {
        return 0;
    }
    
    const dailyRate = credit.lateInterestRate / 100;
    // Simple interest on the base loan amount for each missed day
    const lateFee = credit.valor * dailyRate * missedDays;
    
    return lateFee;
};

export async function getCreditsByProvider() {
    const userIdCookie = cookies().get('loggedInUser');
    if (!userIdCookie) return [];
    const userId = userIdCookie.value;

    const userRole = await getUserRole(userId);
    
    let creditsQuery;
    const creditsRef = collection(db, "credits");
    
    if (userRole === 'admin') {
        // Admin sees all credits
        creditsQuery = query(creditsRef);
    } else if (userRole === 'proveedor') {
        // Provider sees only their credits
        creditsQuery = query(creditsRef, where("providerId", "==", userId));
    } else {
        // No other role should be calling this
        return [];
    }

    const querySnapshot = await getDocs(creditsQuery);
    
    // Fetch all providers in one go to minimize reads
    const providersSnapshot = await getDocs(query(collection(db, "users"), where("role", "==", "proveedor")));
    const providersMap = new Map(providersSnapshot.docs.map(doc => [doc.id, doc.data()]));

    const creditsPromises = querySnapshot.docs.map(async (docSnapshot) => {
        const creditData: any = { id: docSnapshot.id, ...docSnapshot.data() };
        
        // Use a new field for formatted date and keep original for sorting
        creditData.formattedDate = creditData.fecha instanceof Timestamp ? creditData.fecha.toDate().toLocaleString('es-CO', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : new Date(creditData.fecha).toLocaleString('es-CO');
        
        // Ensure original date field is a serializable ISO string for filtering
        creditData.fecha = creditData.fecha instanceof Timestamp ? creditData.fecha.toDate().toISOString() : creditData.fecha;
        creditData.updatedAt = creditData.updatedAt instanceof Timestamp ? creditData.updatedAt.toDate().toISOString() : creditData.updatedAt;
        creditData.createdAt = creditData.createdAt instanceof Timestamp ? creditData.createdAt.toDate().toISOString() : creditData.createdAt;

        creditData.paymentDates = (creditData.paymentDates || []).map((d: any) => 
            d instanceof Timestamp ? d.toDate().toISOString() : d
        );

        const cobradorData = await findUserByIdNumber(creditData.cobradorId as string);
        const clienteData = await findUserByIdNumber(creditData.clienteId as string);
        
        const paymentsRef = collection(db, "payments");
        const paymentsQuery = query(paymentsRef, where("creditId", "==", creditData.id));
        const paymentsSnapshot = await getDocs(paymentsQuery);
        const payments = paymentsSnapshot.docs.map(p => p.data());
        
        const paidAmount = payments.reduce((sum, p) => sum + p.amount, 0);
        
        const capitalAndCommissionPayments = payments.filter(p => p.type === 'cuota' || p.type === 'total');
        const paidCapitalAndCommission = capitalAndCommissionPayments.reduce((sum, p) => sum + p.amount, 0);

        const totalLoanAmount = (creditData.valor || 0) + (creditData.commission || 0);
        const remainingBalance = totalLoanAmount - paidCapitalAndCommission;
        const paidInstallments = payments.filter(p => p.type === 'cuota').length;
        
        const providerSettings = providersMap.get(creditData.providerId) || {};

        const lateFee = calculateLateFee({
            ...creditData,
            lateInterestRate: providerSettings.isLateInterestActive ? (providerSettings.lateInterestRate || 0) : 0,
        });
        
        let endDate: string | undefined = undefined;
        if (creditData.paymentDates && creditData.paymentDates.length > 0) {
            const sortedDates = [...creditData.paymentDates].sort((a:string,b:string) => new Date(a).getTime() - new Date(b).getTime());
            endDate = sortedDates[sortedDates.length - 1];
        }

        return {
            ...creditData,
            cobradorName: cobradorData?.name || 'No disponible',
            clienteName: clienteData?.name || 'No disponible',
            clienteAddress: clienteData?.address || 'No disponible',
            clientePhone: clienteData?.contactPhone || 'No disponible',
            paidInstallments,
            paidAmount,
            remainingBalance,
            lateFee,
            endDate,
        };
    });
    
    // Filter out admin's "own" records if any exist.
    const allCredits = await Promise.all(creditsPromises);
    if (userRole === 'admin') {
      return allCredits.filter(c => c.cobradorId !== ADMIN_ID);
    }
    return allCredits;
}


export async function getCreditsByCobrador() {
    const cobradorIdCookie = cookies().get('loggedInUser');
    if (!cobradorIdCookie) return [];

    const cobradorDocRef = doc(db, "users", cobradorIdCookie.value);
    const cobradorSnap = await getDoc(cobradorDocRef);
    if (!cobradorSnap.exists()) return [];
    const cobrador = cobradorSnap.data();
    
    if (!cobrador || cobrador.role !== 'cobrador') return [];
    
    const providerDocRef = doc(db, "users", cobrador.providerId);
    const providerSnap = await getDoc(providerDocRef);
    const providerSettings = providerSnap.exists() ? providerSnap.data() : {};

    const creditsRef = collection(db, "credits");
    const q = query(creditsRef, where("cobradorId", "==", cobrador.idNumber));
    const querySnapshot = await getDocs(q);

    const creditsPromises = querySnapshot.docs.map(async (docSnapshot) => {
        const creditData = docSnapshot.data();
        
        const serializableData: { [key: string]: any } = { id: docSnapshot.id, ...creditData };
        
        // Convert Timestamps to strings
        serializableData.paymentDates = (serializableData.paymentDates || []).map((d: any) => 
            d instanceof Timestamp ? d.toDate().toISOString() : d
        );
        serializableData.fecha = serializableData.fecha instanceof Timestamp ? serializableData.fecha.toDate().toISOString() : serializableData.fecha;
        serializableData.updatedAt = serializableData.updatedAt instanceof Timestamp ? serializableData.updatedAt.toDate().toISOString() : serializableData.updatedAt;
        serializableData.createdAt = serializableData.createdAt instanceof Timestamp ? serializableData.createdAt.toDate().toISOString() : serializableData.createdAt;

        const cliente = await findUserByIdNumber(creditData.clienteId as string);
        serializableData.clienteName = cliente?.name || 'No disponible';

        // Fetch payments for this credit
        const paymentsRef = collection(db, "payments");
        const paymentsQuery = query(paymentsRef, where("creditId", "==", serializableData.id));
        const paymentsSnapshot = await getDocs(paymentsQuery);
        const payments = paymentsSnapshot.docs.map(p => p.data());
        
        const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
        
        // Payments of type 'cuota' or 'total' reduce the principal debt (which includes commission). 'interes' does not.
        const capitalAndCommissionPayments = payments.filter(p => p.type === 'cuota' || p.type === 'total');
        const paidCapitalAndCommission = capitalAndCommissionPayments.reduce((sum, p) => sum + p.amount, 0);

        serializableData.paidInstallments = payments.filter(p => p.type === 'cuota').length;
        serializableData.paidAmount = totalPaid;
        
        const totalLoanAmount = (creditData.valor || 0) + (creditData.commission || 0);
        const remainingBalance = totalLoanAmount - paidCapitalAndCommission;
        serializableData.remainingBalance = remainingBalance;
        
        serializableData.lateInterestRate = providerSettings.isLateInterestActive ? (providerSettings.lateInterestRate || 0) : 0;

        const lateFee = calculateLateFee(serializableData);
        serializableData.lateFee = lateFee;
        serializableData.totalDebt = remainingBalance + lateFee;
        
        return serializableData;
    });
    
    const credits = await Promise.all(creditsPromises);

    return credits;
}


export async function getCreditsByCliente() {
    const clienteIdCookie = cookies().get('loggedInUser');
    if (!clienteIdCookie) return [];

    const clienteDocRef = doc(db, "users", clienteIdCookie.value);
    const clienteSnap = await getDoc(clienteDocRef);
    if (!clienteSnap.exists() || clienteSnap.data().role !== 'cliente') {
        return [];
    }
    const clienteData = clienteSnap.data();

    const creditsRef = collection(db, "credits");
    const q = query(creditsRef, where("clienteId", "==", clienteData.idNumber), where("estado", "in", ["Activo", "Pagado"]));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
        return [];
    }

    const creditsPromises = querySnapshot.docs.map(async (creditDoc) => {
        const creditData = creditDoc.data();

        // Fetch provider data for each credit
        let providerName = "Proveedor Desconocido";
        let providerLogoUrl = null;
        if (creditData.providerId) {
            const providerDoc = await getDoc(doc(db, "users", creditData.providerId));
            if (providerDoc.exists()) {
                const providerData = providerDoc.data();
                providerName = providerData.companyName || providerData.name || providerName;
                providerLogoUrl = providerData.companyLogoUrl || null;
            }
        }

        const paymentsRef = collection(db, "payments");
        const paymentsQuery = query(paymentsRef, where("creditId", "==", creditDoc.id));
        const paymentsSnapshot = await getDocs(paymentsQuery);
        const payments = paymentsSnapshot.docs.map(p => p.data());
            
        const paidAmount = payments.reduce((sum, p) => sum + p.amount, 0);
        const paidInstallments = payments.filter(p => p.type === 'cuota').length;
        
        const capitalAndCommissionPayments = payments.filter(p => p.type === 'cuota' || p.type === 'total');
        const paidCapitalAndCommission = capitalAndCommissionPayments.reduce((sum, p) => sum + p.amount, 0);

        const totalLoanAmount = (creditData.valor || 0) + (creditData.commission || 0);
        const remainingBalance = totalLoanAmount - paidCapitalAndCommission;

        return {
            id: creditDoc.id,
            clienteName: clienteData.name,
            clienteId: clienteData.idNumber,
            providerName: providerName,
            providerLogoUrl: providerLogoUrl,
            valor: creditData.valor,
            commission: creditData.commission,
            cuotas: creditData.cuotas,
            paidInstallments,
            paymentDates: (creditData.paymentDates || []).map((d: any) => d instanceof Timestamp ? d.toDate().toISOString() : d).sort((a: string, b: string) => new Date(a).getTime() - new Date(b).getTime()),
            totalLoanAmount,
            installmentAmount: totalLoanAmount / creditData.cuotas,
            remainingBalance,
            paidAmount,
            estado: creditData.estado,
        };
    });
    
    const allCredits = await Promise.all(creditsPromises);
    // Sort credits by most recent first
    return allCredits.sort((a,b) => new Date(b.id).getTime() - new Date(a.id).getTime());
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

export async function updateClient(values: z.infer<typeof EditClientSchema>) {
    const { originalIdNumber, idNumber, name, address, contactPhone } = values;

    const usersRef = collection(db, "users");
    const q = query(usersRef, where("idNumber", "==", originalIdNumber), where("role", "==", "cliente"));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
        return { error: "Cliente no encontrado." };
    }

    if (originalIdNumber !== idNumber && await findUserByIdNumber(idNumber)) {
        return { error: "El nuevo número de identificación ya está en uso por otro usuario." };
    }
    
    const userDoc = querySnapshot.docs[0];
    const updateData: { [key: string]: any } = {
        name,
        idNumber,
        address,
        contactPhone,
        updatedAt: Timestamp.now()
    };

    await updateDoc(doc(db, "users", userDoc.id), updateData);

    // If idNumber changed, update all credits associated with this client
    if (originalIdNumber !== idNumber) {
        const creditsRef = collection(db, "credits");
        const creditsQuery = query(creditsRef, where("clienteId", "==", originalIdNumber));
        const creditsSnapshot = await getDocs(creditsQuery);
        
        const batch = writeBatch(db);
        creditsSnapshot.forEach(creditDoc => {
            batch.update(creditDoc.ref, { clienteId: idNumber });
        });
        await batch.commit();
    }

    return { success: "Cliente actualizado exitosamente." };
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
    
    // Also delete payments associated with each credit
    for (const creditDoc of creditSnapshot.docs) {
        const paymentsRef = collection(db, "payments");
        const paymentsQuery = query(paymentsRef, where("creditId", "==", creditDoc.id));
        const paymentsSnapshot = await getDocs(paymentsQuery);
        paymentsSnapshot.forEach(paymentDoc => batch.delete(paymentDoc.ref));
        batch.delete(creditDoc.ref);
    }
    
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

    const providerDocRef = doc(db, "users", providerId);
    const providerSnap = await getDoc(providerDocRef);
    if (!providerSnap.exists()) return { error: "Proveedor no encontrado."};
    const provider = providerSnap.data();
    const commissionPercentage = provider.commissionPercentage || 20;

    const validatedFields = ClientCreditSchema.safeParse(values);

    if (!validatedFields.success) {
        const errors = validatedFields.error.flatten().fieldErrors;
        const firstError = Object.values(errors)[0]?.[0] || "Datos del formulario inválidos.";
        return { error: firstError };
    }
    
    const { idNumber, name, address, contactPhone, guarantorName, guarantorPhone, guarantorAddress, creditAmount, installments, requiresGuarantor } = validatedFields.data;
    
    let existingClient = await findUserByIdNumber(idNumber);
    if (!existingClient) {
        const hashedPassword = await bcrypt.hash(idNumber, 10);
        await addDoc(collection(db, "users"),{
            idNumber,
            name,
            password: hashedPassword,
            role: 'cliente',
            providerId,
            address,
            contactPhone,
            createdAt: new Date().toISOString()
        });
    }

    const valor = parseFloat(creditAmount.replace(/\./g, '').replace(',', '.'));
    const commission = valor * (commissionPercentage / 100);

    const creditRef = await addDoc(collection(db, "credits"), {
        clienteId: idNumber,
        cobradorId: cobrador.idNumber,
        providerId,
        valor,
        commission,
        cuotas: parseInt(installments, 10),
        fecha: Timestamp.now(),
        estado: 'Activo',
        documentUrls: [],
        guarantor: requiresGuarantor ? {
            name: guarantorName,
            phone: guarantorPhone,
            address: guarantorAddress
        } : null,
        missedPaymentDays: 0,
    });

    return { success: true, creditId: creditRef.id };
}

export async function renewCredit(values: z.infer<typeof RenewCreditSchema>) {
    const cobradorIdCookie = cookies().get('loggedInUser');
    if (!cobradorIdCookie) return { error: "No se pudo identificar al cobrador." };

    const cobradorDocRef = doc(db, "users", cobradorIdCookie.value);
    const cobradorSnap = await getDoc(cobradorDocRef);
    if (!cobradorSnap.exists() || cobradorSnap.data().role !== 'cobrador') {
        return { error: "Acción no autorizada." };
    }
    const cobrador = cobradorSnap.data();

    const providerId = cobrador.providerId;
    if(!providerId) return { error: "El cobrador no tiene un proveedor asociado." };
    
    const providerDocRef = doc(db, "users", providerId);
    const providerSnap = await getDoc(providerDocRef);
    if (!providerSnap.exists()) return { error: "Proveedor no encontrado."};
    const provider = providerSnap.data();
    const commissionPercentage = provider.commissionPercentage || 20;

    const { clienteId, oldCreditId, creditAmount, installments } = values;

    const valor = parseFloat(creditAmount.replace(/\./g, '').replace(',', '.'));
    const commission = valor * (commissionPercentage / 100);

    // 1. Create the new credit
    const newCreditRef = await addDoc(collection(db, "credits"), {
        clienteId,
        cobradorId: cobrador.idNumber,
        providerId,
        valor,
        commission,
        cuotas: parseInt(installments, 10),
        fecha: Timestamp.now(),
        estado: 'Activo',
        documentUrls: [],
        guarantor: null, // Assuming renewal doesn't require guarantor re-entry for simplicity
        paymentScheduleSet: false, // Will need a schedule
        missedPaymentDays: 0,
    });

    // 2. Mark the old credit as 'Renovado'
    const oldCreditRef = doc(db, "credits", oldCreditId);
    await updateDoc(oldCreditRef, {
        estado: 'Renovado',
        updatedAt: Timestamp.now(),
        renewedWithCreditId: newCreditRef.id,
    });

    return { success: true, newCreditId: newCreditRef.id };
}


export async function savePaymentSchedule(values: z.infer<typeof SavePaymentScheduleSchema>) {
    const validatedFields = SavePaymentScheduleSchema.safeParse(values);
    if (!validatedFields.success) {
        return { error: "Datos del calendario inválidos." };
    }

    const { creditId, paymentDates } = validatedFields.data;
    const creditRef = doc(db, "credits", creditId);

    try {
        await updateDoc(creditRef, {
            paymentDates: paymentDates.map(dateStr => Timestamp.fromDate(new Date(dateStr))),
            paymentScheduleSet: true,
            updatedAt: Timestamp.now(),
        });
        return { success: true };
    } catch (error) {
        console.error("Error saving payment schedule:", error);
        return { error: "No se pudo guardar el calendario de pagos." };
    }
}

export async function uploadSingleDocument(formData: FormData) {
    try {
        const rawData: {[k:string]: any} = Object.fromEntries(formData.entries());
        const validatedFields = UploadSingleDocumentSchema.safeParse(rawData);
        
        if (!validatedFields.success) {
            return { error: "Datos de subida inválidos." };
        }
        
        const { creditId, document } = validatedFields.data;

        const creditRef = doc(db, "credits", creditId);
        const creditSnap = await getDoc(creditRef);
        if (!creditSnap.exists()) {
            return { error: "El crédito no fue encontrado." };
        }
        const creditData = creditSnap.data();
        
        const providerId = creditData.providerId;
        const cobradorId = creditData.cobradorId;
        const clienteId = creditData.clienteId;

        if (!providerId || !cobradorId || !clienteId) {
             return { error: "Información de asociación incompleta en el crédito." };
        }

        const storagePath = `proveedores/${providerId}/cobradores/${cobradorId}/clientes/${clienteId}/${Date.now()}_${document.name}`;
        const storageRef = ref(storage, storagePath);
        
        const buffer = await document.arrayBuffer();
        await uploadBytes(storageRef, buffer);
        const url = await getDownloadURL(storageRef);

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

export async function registerPayment(creditId: string, amount: number, type: "cuota" | "total" | "interes") {
    const cobradorIdCookie = cookies().get('loggedInUser');
    if (!cobradorIdCookie) return { error: "Acceso no autorizado." };

    const cobradorDocRef = doc(db, "users", cobradorIdCookie.value);
    const cobradorSnap = await getDoc(cobradorDocRef);
    if (!cobradorSnap.exists() || cobradorSnap.data().role !== 'cobrador') {
        return { error: "Acción no autorizada." };
    }
    const cobradorData = cobradorSnap.data();

    const creditRef = doc(db, "credits", creditId);
    const creditSnap = await getDoc(creditRef);
    if (!creditSnap.exists()) {
        return { error: "Crédito no encontrado." };
    }
    const creditData = creditSnap.data();

    // Add payment to payments collection
    await addDoc(collection(db, "payments"), {
        creditId,
        amount,
        type,
        date: Timestamp.now(),
        cobradorId: cobradorData.idNumber,
        providerId: creditData.providerId,
    });
    
    // Update credit status
    const paymentsRef = collection(db, "payments");
    const q = query(paymentsRef, where("creditId", "==", creditId));
    const paymentsSnapshot = await getDocs(q);
    const allPayments = paymentsSnapshot.docs.map(doc => doc.data());
    
    let isPaidOff = false;
    if (type === 'total') {
        isPaidOff = true;
    } else {
        const capitalAndCommissionPayments = allPayments.filter(p => p.type === 'cuota' || p.type === 'total');
        const paidCapitalAndCommission = capitalAndCommissionPayments.reduce((sum,p) => sum + p.amount, 0);
        
        // Fetch the credit again to get the most up-to-date values
        const freshCreditSnap = await getDoc(creditRef);
        const freshCreditData = freshCreditSnap.data();
        if (!freshCreditData) return { error: "Error al recargar el crédito." };

        const totalLoanAmount = (freshCreditData.valor || 0) + (freshCreditData.commission || 0);
        
        const remainingBalance = totalLoanAmount - paidCapitalAndCommission;
        
        const providerDocRef = doc(db, "users", freshCreditData.providerId);
        const providerSnap = await getDoc(providerDocRef);
        const providerSettings = providerSnap.exists() ? providerSnap.data() : {};
        const lateInterestRate = providerSettings.isLateInterestActive ? (providerSettings.lateInterestRate || 0) : 0;
        
        const lateFee = calculateLateFee({
            ...freshCreditData,
            lateInterestRate,
        });

        const totalDebt = remainingBalance + lateFee;

        // Using a small threshold for floating point comparisons
        if (totalDebt <= 1) {
             isPaidOff = true;
        }
    }

    if (isPaidOff) {
        await updateDoc(creditRef, { estado: 'Pagado', updatedAt: Timestamp.now(), missedPaymentDays: 0 });
    } else {
         await updateDoc(creditRef, { updatedAt: Timestamp.now(), missedPaymentDays: 0 }); // Reset missed days if a quota payment is made
    }

    return { success: `Pago de ${amount.toLocaleString('es-CO')} registrado.` };
}


export async function saveProviderSettings(providerId: string, settings: { commissionPercentage?: number, lateInterestRate?: number, isLateInterestActive?: boolean, companyLogoUrl?: string }) {
  if (!providerId) return { error: "ID de proveedor no válido." };
  
  const providerRef = doc(db, "users", providerId);
  const providerSnap = await getDoc(providerRef);
  if(!providerSnap.exists() || providerSnap.data().role !== 'proveedor') {
    return { error: "Proveedor no encontrado o no autorizado." };
  }

  const updateData: any = {};
  if (settings.commissionPercentage !== undefined) {
    updateData.commissionPercentage = settings.commissionPercentage;
  }
  if (settings.lateInterestRate !== undefined) {
    updateData.lateInterestRate = settings.lateInterestRate;
  }
   if (settings.isLateInterestActive !== undefined) {
    updateData.isLateInterestActive = settings.isLateInterestActive;
  }
   if (settings.companyLogoUrl !== undefined) {
    updateData.companyLogoUrl = settings.companyLogoUrl;
  }
  updateData.updatedAt = Timestamp.now();

  await updateDoc(providerRef, updateData);

  return { success: "Configuración guardada exitosamente." };
}

export async function registerMissedPayment(creditId: string) {
  const cobradorIdCookie = cookies().get('loggedInUser');
  if (!cobradorIdCookie) return { error: "Acceso no autorizado." };

  const creditRef = doc(db, "credits", creditId);
  try {
    await updateDoc(creditRef, {
      missedPaymentDays: increment(1),
      updatedAt: Timestamp.now()
    });
    return { success: true };
  } catch (error) {
    console.error("Error registering missed payment:", error);
    return { error: "No se pudo registrar el día de mora." };
  }
}

    
