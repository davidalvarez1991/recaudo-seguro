

"use server";

import { z } from "zod";
import { LoginSchema, RegisterSchema, CobradorRegisterSchema, EditCobradorSchema, ClientCreditSchema, SavePaymentScheduleSchema, RenewCreditSchema, EditClientSchema, NewCreditSchema, EditProviderSchema } from "./schemas";
import { redirect } from "next/navigation";
import bcrypt from 'bcryptjs';
import { db } from "./firebase";
import { collection, query, where, getDocs, addDoc, doc, getDoc, updateDoc, writeBatch, deleteDoc, Timestamp, setDoc, increment, orderBy, limit } from "firebase/firestore";
import { startOfDay, differenceInDays, endOfDay, isWithinInterval, addDays, parseISO, isFuture, isToday, isSameDay, format } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';
import { analyzeClientReputation, ClientReputationInput } from '@/ai/flows/analyze-client-reputation';
import { es } from 'date-fns/locale';
import { getAuthenticatedUser } from "./auth";


const ADMIN_ID = "admin_0703091991";
const usersCache = new Map<string, any>();

type CommissionTier = {
  minAmount: number;
  maxAmount: number;
  percentage: number;
};

// --- Utility Functions ---
export const findUserByIdNumber = async (idNumber: string) => {
    if (usersCache.has(idNumber)) {
        return usersCache.get(idNumber);
    }
    
    const usersRef = collection(db, "users");
    const q = query(usersRef, where("idNumber", "==", idNumber), limit(1));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
        usersCache.set(idNumber, null);
        return null;
    }

    const userDoc = querySnapshot.docs[0];
    const data = userDoc.data();
    
    const serializableData: { [key: string]: any } = { id: userDoc.id };
    for (const key in data) {
        const value = data[key];
        if (value instanceof Timestamp) {
            serializableData[key] = value.toDate().toISOString();
        } else {
            serializableData[key] = value;
        }
    }
    
    usersCache.set(idNumber, serializableData);
    return serializableData;
};

const calculateCommission = (amount: number, tiers: CommissionTier[] | undefined): { commission: number, percentage: number } => {
    if (!tiers || tiers.length === 0) {
        // Fallback to a default 20% if no tiers are set
        return { commission: amount * 0.20, percentage: 20 };
    }
    
    // Sort tiers by minAmount to ensure correct matching
    const sortedTiers = [...tiers].sort((a, b) => a.minAmount - b.minAmount);
    
    const applicableTier = sortedTiers.find(tier => amount >= tier.minAmount && amount <= tier.maxAmount);

    if (applicableTier) {
        return { commission: amount * (applicableTier.percentage / 100), percentage: applicableTier.percentage };
    }

    // If no tier matches (e.g., gaps in ranges), fallback to the first tier's percentage or a default
    const fallbackPercentage = sortedTiers[0]?.percentage || 20;
    return { commission: amount * (fallbackPercentage / 100), percentage: fallbackPercentage };
};

const getPaymentFrequencyString = (dates: Date[]): string => {
    if (dates.length < 2) return "únicos";
    
    const sortedDates = [...dates].sort((a, b) => a.getTime() - b.getTime());
    const differences: number[] = [];
    for (let i = 1; i < sortedDates.length; i++) {
        differences.push(differenceInDays(sortedDates[i], sortedDates[i - 1]));
    }
    
    const avgDifference = differences.reduce((a, b) => a + b, 0) / differences.length;

    if (avgDifference <= 1.5) return "diarios";
    if (avgDifference > 1.5 && avgDifference <= 7.5) return "semanales";
    if (avgDifference > 7.5 && avgDifference <= 16) return "quincenales";
    if (avgDifference > 16 && avgDifference <= 31) return "mensuales";
    
    return "personalizados";
};


// --- Auth Actions ---
export async function login(values: z.infer<typeof LoginSchema>) {
  const { cookies } = await import('next/headers')
  try {
    const validatedFields = LoginSchema.safeParse(values);

    if (!validatedFields.success) {
      return { error: "Campos inválidos." };
    }

    const { idNumber, password } = validatedFields.data;
    
    // Check for a hardcoded admin user first
    if (idNumber === "0703091991" && password === "19913030") {
         await cookies().set('loggedInUser', ADMIN_ID, { httpOnly: true, path: '/' });
         await cookies().set('userRole', 'admin', { httpOnly: true, path: '/' });
         return { successUrl: `/dashboard/admin` };
    }
    
    const user = await findUserByIdNumber(idNumber);

    if (!user || !user.password) {
        return { error: "Cédula o contraseña incorrecta." };
    }

    // We don't check for isActive here anymore, we do it on the dashboard page
    // to show a specific message.
    
    const passwordsMatch = await bcrypt.compare(password, user.password);

    if (!passwordsMatch) {
      return { error: "Cédula o contraseña incorrecta." };
    }
    
    await cookies().set('loggedInUser', user.id, { httpOnly: true, path: '/' });
    await cookies().set('userRole', user.role, { httpOnly: true, path: '/' });

    return { successUrl: `/dashboard/${user.role}` };

  } catch (error) {
    console.error("Login error:", error);
    return { error: "Algo salió mal en el servidor." };
  }
}

export async function register(values: z.infer<typeof RegisterSchema>, role: 'proveedor') {
    const { cookies } = await import('next/headers')
    const validatedFields = RegisterSchema.safeParse(values);

    if (!validatedFields.success) {
        return { error: "Campos inválidos." };
    }

    const { idNumber, password, companyName, email, whatsappNumber, city } = validatedFields.data;

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
        city,
        isActive: false, // New providers start as inactive
        createdAt: Timestamp.now()
    });
    
    if (newUserRef) {
        await cookies().set('loggedInUser', newUserRef.id, { httpOnly: true, path: '/' });
        await cookies().set('userRole', role, { httpOnly: true, path: '/' });
        return { successUrl: `/dashboard/${role}` };
    }
    
    return { error: "No se pudo crear el usuario."};
}

export async function logout() {
  const { cookies } = await import('next/headers')
  await cookies().set('loggedInUser', '', { expires: new Date(0), path: '/' });
  await cookies().set('userRole', '', { expires: new Date(0), path: '/' });
  return { successUrl: '/login' };
}

// --- Data Fetching Actions ---

export async function getUserData(userId: string) {
    // Special case for hardcoded admin
    if (userId === ADMIN_ID) {
        return {
            id: ADMIN_ID,
            name: 'Administrador',
            role: 'admin',
            isActive: true,
        };
    }
    const userDocRef = doc(db, "users", userId);
    const userSnap = await getDoc(userDocRef);
    if (!userSnap.exists()) {
        return null;
    }
    
    const data = userSnap.data();
    const serializableUser: { [key: string]: any } = { id: userSnap.id };

    // Convert Timestamps to ISO strings to make them serializable
    for (const key in data) {
        const value = data[key];
        if (value instanceof Timestamp) {
            serializableUser[key] = value.toDate().toISOString();
        } else {
            serializableUser[key] = value;
        }
    }

    return serializableUser;
}


export async function getCobradoresByProvider() {
    const { userId } = await getAuthenticatedUser();
    if (!userId) return [];
    
    const providerDocRef = doc(db, "users", userId);
    const providerSnap = await getDoc(providerDocRef);
    if (!providerSnap.exists()) return [];
    const provider = providerSnap.data();

    if (!provider || provider.role !== 'proveedor') return [];

    const cobradoresRef = collection(db, "users");
    const q = query(cobradoresRef, where("role", "==", "cobrador"), where("providerId", "==", userId));
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

// Helper function to get full details for a credit
const getFullCreditDetails = async (creditData: any, providersMap: Map<string, any>) => {
    try {
        const serializableCreditData: {[key: string]: any} = { ...creditData };
        // Make sure all timestamps are converted
        for (const key in serializableCreditData) {
            if (serializableCreditData[key] instanceof Timestamp) {
                serializableCreditData[key] = serializableCreditData[key].toDate().toISOString();
            }
        }
        // Also handle nested arrays of timestamps
        serializableCreditData.paymentDates = (serializableCreditData.paymentDates || []).map((d: any) => 
            d instanceof Timestamp ? d.toDate().toISOString() : d
        );
        serializableCreditData.fecha = serializableCreditData.fecha ? new Date(serializableCreditData.fecha).toISOString() : new Date().toISOString();
        serializableCreditData.formattedDate = new Date(serializableCreditData.fecha).toLocaleString('es-CO', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });
        
        const cobradorData = await findUserByIdNumber(serializableCreditData.cobradorId as string);
        const clienteData = await findUserByIdNumber(serializableCreditData.clienteId as string);
        
        const paymentsRef = collection(db, "payments");
        const paymentsQuery = query(paymentsRef, where("creditId", "==", serializableCreditData.id));
        const paymentsSnapshot = await getDocs(paymentsQuery);
        const payments = paymentsSnapshot.docs.map(p => p.data());
        
        const capitalAndCommissionPayments = payments.filter(p => p.type === 'cuota' || p.type === 'total');
        const agreementPayments = payments.filter(p => p.type === 'acuerdo');

        const paidAmount = capitalAndCommissionPayments.reduce((sum, p) => sum + p.amount, 0);
        const agreementAmount = agreementPayments.reduce((sum, p) => sum + p.amount, 0);

        const totalLoanAmount = (serializableCreditData.valor || 0) + (serializableCreditData.commission || 0);
        const remainingBalance = totalLoanAmount - paidAmount;
        const paidInstallments = payments.filter(p => p.type === 'cuota').length;
        
        const providerSettings = providersMap.get(serializableCreditData.providerId) || { isLateInterestActive: false, lateInterestRate: 0 };
        const lateFee = calculateLateFee({
            ...serializableCreditData,
            lateInterestRate: providerSettings.isLateInterestActive ? (providerSettings.lateInterestRate || 0) : 0,
        });
        
        let endDate: string | undefined = undefined;
        if (serializableCreditData.paymentDates && serializableCreditData.paymentDates.length > 0) {
            const sortedDates = [...serializableCreditData.paymentDates].sort((a:string,b:string) => new Date(a).getTime() - new Date(b).getTime());
            endDate = sortedDates[sortedDates.length - 1];
        }

        const timeZone = 'America/Bogota';
        const todayStart = startOfDay(toZonedTime(new Date(), timeZone));
        const todayEnd = endOfDay(toZonedTime(new Date(), timeZone));
        const dailyCollectedAmount = payments.reduce((sum, p) => {
            if (!p.date || !(p.date instanceof Timestamp)) return sum;
            const paymentDateUTC = p.date.toDate();
            const paymentDateInTimeZone = toZonedTime(paymentDateUTC, timeZone);
            if (isWithinInterval(paymentDateInTimeZone, { start: todayStart, end: todayEnd })) {
                return sum + p.amount;
            }
            return sum;
        }, 0);

        return {
            ...serializableCreditData,
            cobradorName: cobradorData?.name || 'No disponible',
            clienteName: clienteData?.name || 'No disponible',
            clienteAddress: clienteData?.address || 'No disponible',
            clientePhone: clienteData?.contactPhone || 'No disponible',
            paidInstallments,
            paidAmount,
            agreementAmount,
            remainingBalance,
            lateFee,
            endDate,
            dailyCollectedAmount,
        };
    } catch(e) {
        console.error("Error in getFullCreditDetails for credit " + creditData.id, e);
        return null; // Return null on error to filter out later
    }
};

export async function getProviderActivityLog() {
    const { userId, role } = await getAuthenticatedUser();
    if (role !== 'proveedor' || !userId) return [];

    // --- Optimized Data Fetching ---
    // 1. Fetch all credits for the provider
    const creditsRef = collection(db, "credits");
    const creditsQuery = query(creditsRef, where("providerId", "==", userId));
    const creditsSnapshot = await getDocs(creditsQuery);
    const creditsMap = new Map(creditsSnapshot.docs.map(doc => [doc.id, { id: doc.id, ...doc.data() }]));

    // 2. Fetch all payments for the provider
    const paymentsRef = collection(db, "payments");
    const paymentsQuery = query(paymentsRef, where("providerId", "==", userId));
    const paymentsSnapshot = await getDocs(paymentsQuery);

    // Fetch provider settings once
    const providerData = await getUserData(userId);
    const providersMap = new Map();
    if (providerData) {
        providersMap.set(userId, providerData);
    }
    // --- End Optimized Data Fetching ---
    let activityLog: any[] = [];

    // Process credits
    for (const credit of creditsMap.values()) {
        const date = credit.fecha instanceof Timestamp ? credit.fecha.toDate() : new Date(credit.fecha);
        activityLog.push({
            id: credit.id,
            type: 'credit',
            date: date.toISOString(),
            formattedDate: date.toLocaleString('es-CO', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
            amount: credit.valor,
            creditId: credit.id,
            clienteId: credit.clienteId,
            creditState: credit.estado,
        });
    }

    // Process payments
    for (const doc of paymentsSnapshot.docs) {
        const payment = doc.data();
        const credit = creditsMap.get(payment.creditId);
        if (!credit) continue;

        const date = payment.date instanceof Timestamp ? payment.date.toDate() : new Date(payment.date);
        activityLog.push({
            id: doc.id,
            type: 'payment',
            date: date.toISOString(),
            formattedDate: date.toLocaleString('es-CO', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
            amount: payment.amount,
            creditId: payment.creditId,
            clienteId: payment.clienteId,
            paymentType: payment.type,
            creditState: credit.estado,
        });
    }

    // Sort by date descending
    activityLog.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    // Enrich with details using the cache
    const enrichedLogPromises = activityLog.map(async (entry) => {
        try {
            const creditData = creditsMap.get(entry.creditId);
            if (!creditData) return null;

            const cliente = await findUserByIdNumber(entry.clienteId);
            // This is still heavy, but we'll keep it for now as the main issue was the N+1 user queries.
            const fullCreditDetails = await getFullCreditDetails({ ...creditData, id: entry.creditId }, providersMap);
            
            if (!fullCreditDetails) return null;

            return {
                ...entry,
                clienteName: cliente?.name || 'No disponible',
                cobradorId: creditData.cobradorId,
                cobradorName: fullCreditDetails.cobradorName,
                fullCreditDetails,
            };
        } catch (error) {
            console.error(`Failed to process activity log entry ${entry.id}:`, error);
            return null; // Skip problematic entries
        }
    });

    const enrichedLog = (await Promise.all(enrichedLogPromises)).filter(Boolean) as any[];

    return enrichedLog;
}


export async function getCreditsByCobrador() {
    const { user: cobrador, userId } = await getAuthenticatedUser();
    if (!cobrador || cobrador.role !== 'cobrador' || !userId) return [];

    if (cobrador.providerId) {
        const provider = await getUserData(cobrador.providerId);
        if (provider && !provider.isActive) {
            return [];
        }
    }
    
    const providerDocRef = doc(db, "users", cobrador.providerId);
    const providerSnap = await getDoc(providerDocRef);
    const providerSettings = providerSnap.exists() ? providerSnap.data() : {};

    // 1. Fetch all credits for the cobrador
    const creditsRef = collection(db, "credits");
    const q = query(creditsRef, where("cobradorId", "==", cobrador.idNumber));
    const creditsSnapshot = await getDocs(q);
    const allCredits = creditsSnapshot.docs.map(docSnapshot => ({
        id: docSnapshot.id,
        ...docSnapshot.data()
    }));
    
    const creditIds = allCredits.map(c => c.id);
    if(creditIds.length === 0) return [];

    // 2. Fetch all payments for all those credits in one go
    const paymentsRef = collection(db, "payments");
    const paymentsQuery = query(paymentsRef, where("creditId", "in", creditIds));
    const paymentsSnapshot = await getDocs(paymentsQuery);
    const allPayments = paymentsSnapshot.docs.map(p => p.data());

    // 3. Process credits with fetched payments
    const creditsPromises = allCredits.map(async (creditData) => {
        const serializableData: { [key: string]: any } = { ...creditData };
        
        for (const key in serializableData) {
            if (serializableData[key] instanceof Timestamp) {
                serializableData[key] = serializableData[key].toDate().toISOString();
            }
        }
        
        serializableData.paymentDates = (serializableData.paymentDates || []).map((d: any) => 
            d instanceof Timestamp ? d.toDate().toISOString() : d
        );
        serializableData.fecha = serializableData.fecha ? new Date(serializableData.fecha).toISOString() : new Date().toISOString();


        const cliente = await findUserByIdNumber(creditData.clienteId as string);
        serializableData.clienteName = cliente?.name || 'No disponible';

        const creditPayments = allPayments.filter(p => p.creditId === creditData.id);
        
        const capitalAndCommissionPayments = creditPayments.filter(p => p.type === 'cuota' || p.type === 'total');
        const paidCapitalAndCommission = capitalAndCommissionPayments.reduce((sum, p) => sum + p.amount, 0);

        serializableData.paidInstallments = creditPayments.filter(p => p.type === 'cuota').length;
        serializableData.paidAmount = paidCapitalAndCommission;
        
        const totalLoanAmount = (creditData.valor || 0) + (creditData.commission || 0);
        const remainingBalance = totalLoanAmount - paidCapitalAndCommission;
        serializableData.remainingBalance = remainingBalance;

        serializableData.agreementAmount = creditPayments.filter(p => p.type === 'acuerdo').reduce((sum, p) => sum + p.amount, 0);
        
        serializableData.lateInterestRate = providerSettings.isLateInterestActive ? (providerSettings.lateInterestRate || 0) : 0;

        const lateFee = calculateLateFee(serializableData);
        serializableData.lateFee = lateFee;
        serializableData.totalDebt = remainingBalance + lateFee;
        
        return serializableData;
    });
    
    const results = await Promise.all(creditsPromises);

    // Remove updatedAt before sending to client
    const finalResults = results.map(credit => {
        const { updatedAt, ...rest } = credit;
        return rest;
    });

    return finalResults;
}


export async function getCreditsByCliente() {
    const { user: clienteData, userId } = await getAuthenticatedUser();
    if (!clienteData || clienteData.role !== 'cliente' || !userId) return [];

    const creditsRef = collection(db, "credits");
    const q = query(creditsRef, where("clienteId", "==", clienteData.idNumber), where("estado", "==", "Activo"));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
        return [];
    }

    const creditsPromises = querySnapshot.docs.map(async (creditDoc) => {
        const creditData = creditDoc.data();

        // Fetch provider data for each credit
        let providerName = "Proveedor Desconocido";
        if (creditData.providerId) {
            const providerDoc = await getDoc(doc(db, "users", creditData.providerId));
            if (providerDoc.exists()) {
                const providerData = providerDoc.data();
                providerName = providerData.companyName || providerData.name || providerName;
            }
        }

        const paymentsRef = collection(db, "payments");
        const paymentsQuery = query(paymentsRef, where("creditId", "==", creditDoc.id));
        const paymentsSnapshot = await getDocs(paymentsQuery);
        const payments = paymentsSnapshot.docs.map(p => p.data());
            
        const paidInstallments = payments.filter(p => p.type === 'cuota').length;
        
        // Payments that reduce capital and commission
        const capitalAndCommissionPayments = payments.filter(p => p.type === 'cuota' || p.type === 'total');
        const paidAmount = capitalAndCommissionPayments.reduce((sum, p) => sum + p.amount, 0);

        const totalLoanAmount = (creditData.valor || 0) + (creditData.commission || 0);
        const remainingBalance = totalLoanAmount - paidAmount;

        return {
            id: creditDoc.id,
            clienteName: clienteData.name,
            clienteId: clienteData.idNumber,
            providerName: providerName,
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
    // Sort credits by most recent first, using the credit ID which is a timestamp
    const sortedCredits = allCredits.sort((a,b) => {
        // This assumes credit IDs are sortable timestamps, which might not be the case.
        // A better approach is to sort by creation date if available.
        // Let's rely on Firestore's default ordering for now or add an client-side sort to avoid issues.
        return 0; // Keep original order
    });

    return sortedCredits;
}

export async function getHistoricalCreditsByCliente() {
    const { user: clienteData } = await getAuthenticatedUser();
    if (!clienteData || clienteData.role !== 'cliente') return [];

    const creditsRef = collection(db, "credits");
    const q = query(creditsRef, where("clienteId", "==", clienteData.idNumber), where("estado", "in", ["Pagado", "Renovado"]));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
        return [];
    }
    
    const creditsPromises = querySnapshot.docs.map(async (creditDoc) => {
        const creditData = creditDoc.data();

        let providerName = "Proveedor Desconocido";
        if (creditData.providerId) {
            const providerDoc = await getDoc(doc(db, "users", creditData.providerId));
            if (providerDoc.exists()) {
                providerName = (providerDoc.data().companyName || "Proveedor").toUpperCase();
            }
        }
        
        return {
            id: creditDoc.id,
            fecha: creditData.fecha instanceof Timestamp ? creditData.fecha.toDate().toISOString() : creditData.fecha,
            valor: creditData.valor,
            commission: creditData.commission,
            cuotas: creditData.cuotas,
            estado: creditData.estado,
            providerId: creditData.providerId,
            providerName,
            clienteId: clienteData.idNumber,
            clienteName: clienteData.name,
        };
    });

    const allCredits = await Promise.all(creditsPromises);
    return allCredits.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
}

export async function getPaymentsByCreditId(creditId: string) {
    if (!creditId) return [];
    
    const paymentsRef = collection(db, "payments");
    const q = query(paymentsRef, where("creditId", "==", creditId));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
        return [];
    }
    
    const payments = querySnapshot.docs.map(doc => {
        const data = doc.data();
        const dateValue = data.date;
        let isoDate;

        if (dateValue instanceof Timestamp) {
            isoDate = dateValue.toDate().toISOString();
        } else if (dateValue && typeof dateValue.toDate === 'function') { // Handle Firestore's object representation
            isoDate = dateValue.toDate().toISOString();
        } else if (typeof dateValue === 'string') {
            isoDate = dateValue;
        } else {
            isoDate = new Date().toISOString(); 
        }

        return {
            id: doc.id,
            amount: data.amount,
            date: isoDate,
            type: data.type,
        };
    });

    return payments.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}

export async function getDailyCollectionSummary() {
    const { userId } = await getAuthenticatedUser();
    if (!userId) {
        return { summary: [], totalCollected: 0 };
    }
    const providerId = userId;

    const timeZone = 'America/Bogota';
    const nowInTimeZone = toZonedTime(new Date(), timeZone);
    const todayStart = startOfDay(nowInTimeZone);
    const todayEnd = endOfDay(nowInTimeZone);

    const paymentsRef = collection(db, "payments");
    const paymentsQuery = query(paymentsRef, where("providerId", "==", providerId));
    const paymentsSnapshot = await getDocs(paymentsQuery);

    if (paymentsSnapshot.empty) {
        return { summary: [], totalCollected: 0 };
    }

    const cobradores = await getCobradoresByProvider();
    const cobradoresMap = new Map(cobradores.map(c => [c.idNumber, c.name]));

    const summaryMap = new Map<string, number>();
    let totalCollected = 0;

    paymentsSnapshot.forEach(doc => {
        const payment = doc.data();
        if (!payment.date) {
            return; // Skip record if date is missing
        }
        const paymentDateUTC = payment.date.toDate();
        const paymentDateInTimeZone = toZonedTime(paymentDateUTC, timeZone);
        
        if (isWithinInterval(paymentDateInTimeZone, { start: todayStart, end: todayEnd })) {
            const amount = payment.amount || 0;
            const cobradorId = payment.cobradorId;
            
            summaryMap.set(cobradorId, (summaryMap.get(cobradorId) || 0) + amount);
            totalCollected += amount;
        }
    });
    
    const summary = Array.from(summaryMap.entries()).map(([cobradorId, collectedAmount]) => ({
        cobradorId,
        cobradorName: cobradoresMap.get(cobradorId) || `Cobrador (${cobradorId})`,
        collectedAmount,
    }));

    return { summary, totalCollected };
}

export async function getPaymentRoute() {
    const { user: cobradorData } = await getAuthenticatedUser();
    if (!cobradorData || cobradorData.role !== 'cobrador') return { routes: [], dailyGoal: 0, collectedToday: 0 };
    
    const allCredits = await getCreditsByCobrador();
    const activeCredits = allCredits.filter(c => c.estado === 'Activo' && Array.isArray(c.paymentDates) && c.paymentDates.length > 0);
    const timeZone = 'America/Bogota';
    
    let dailyGoal = 0;
    
    // --- Optimized Data Fetching ---
    // 1. Fetch all payments for all active credits at once
    const activeCreditIds = activeCredits.map(c => c.id);
    let allPayments: any[] = [];
    if (activeCreditIds.length > 0) {
        const paymentsRef = collection(db, "payments");
        const paymentsQuery = query(paymentsRef, where("creditId", "in", activeCreditIds));
        const paymentsSnapshot = await getDocs(paymentsQuery);
        allPayments = paymentsSnapshot.docs.map(p => p.data());
    }
    // --- End Optimization ---
    
    const routeEntriesPromises = activeCredits.map(async (credit) => {
        if (!Array.isArray(credit.paymentDates)) return null;
        
        const sortedDates = credit.paymentDates
            .map(d => parseISO(d))
            .sort((a, b) => a.getTime() - b.getTime());

        const nextPaymentDate = sortedDates.find(date => isFuture(date) || isToday(toZonedTime(date, timeZone)));

        if (!nextPaymentDate) return null;
        
        const totalLoanAmount = (credit.valor || 0) + (credit.commission || 0);
        const installmentAmount = totalLoanAmount / credit.cuotas;
        
        const clienteData = await findUserByIdNumber(credit.clienteId);
        
        const todayStart = startOfDay(toZonedTime(new Date(), timeZone));
        const todayEnd = endOfDay(toZonedTime(new Date(), timeZone));

        // Use pre-fetched payments
        const creditPayments = allPayments.filter(p => p.creditId === credit.id);
        const isPaidToday = creditPayments.some(payment => {
            const paymentDateInTimeZone = toZonedTime(payment.date.toDate(), timeZone);
            return isWithinInterval(paymentDateInTimeZone, { start: todayStart, end: todayEnd });
        });
        
        const nextPaymentZoned = toZonedTime(nextPaymentDate, timeZone);
        if (isToday(nextPaymentZoned)) {
            dailyGoal += installmentAmount + credit.lateFee;
        }

        const serializableCredit = Object.fromEntries(
            Object.entries(credit).map(([key, value]) => {
                 if (value instanceof Timestamp) {
                    return [key, value.toDate().toISOString()];
                }
                return [key, value];
            })
        );

        return {
            ...serializableCredit,
            creditId: credit.id,
            clienteId: credit.clienteId,
            clienteName: credit.clienteName || 'N/A',
            clienteAddress: clienteData?.address || '',
            clientePhone: clienteData?.contactPhone || '',
            nextPaymentDate: nextPaymentDate.toISOString(),
            installmentAmount,
            isPaidToday,
        };
    });
    
    const routeEntries = (await Promise.all(routeEntriesPromises)).filter(Boolean);
    const sortedRoutes = (routeEntries as any[]).sort((a, b) => new Date(a.nextPaymentDate).getTime() - new Date(b.nextPaymentDate).getTime());

    // Calculate collected today
    const paymentsRef = collection(db, "payments");
    const today = toZonedTime(new Date(), timeZone);
    const paymentsQuery = query(paymentsRef, where("cobradorId", "==", cobradorData.idNumber));
    const paymentsSnapshot = await getDocs(paymentsQuery);
    
    let collectedToday = 0;
    paymentsSnapshot.forEach(doc => {
        const payment = doc.data();
        if (payment.date) {
            const paymentDate = toZonedTime(payment.date.toDate(), timeZone);
            if (isSameDay(today, paymentDate)) {
                 collectedToday += payment.amount || 0;
            }
        }
    });

    return { routes: sortedRoutes, dailyGoal, collectedToday };
}

async function getCreditsByProvider() {
    const { userId, role } = await getAuthenticatedUser();
    if (role !== 'proveedor' || !userId) return [];

    const creditsRef = collection(db, "credits");
    const q = query(creditsRef, where("providerId", "==", userId));
    const querySnapshot = await getDocs(q);

    const providersMap = new Map();
    const providerData = await getUserData(userId);
    if(providerData) {
        providersMap.set(userId, providerData);
    }
    
    const recordsPromises = querySnapshot.docs.map(doc => 
        getFullCreditDetails({ id: doc.id, ...doc.data() }, providersMap)
    );
    const allRecords = await Promise.all(recordsPromises);

    return allRecords.filter(Boolean);
}

export async function downloadProviderCredits() {
    return getCreditsByProvider();
}

// --- Data Mutation Actions ---

export async function registerCobrador(values: z.infer<typeof CobradorRegisterSchema>) {
    const { user: provider, userId: providerId } = await getAuthenticatedUser();
    if (!provider || provider.role !== 'proveedor' || !providerId) {
        return { error: "Acción no autorizada o proveedor no identificado." };
    }

    if (!provider.isActive) {
        return { error: "Tu cuenta de proveedor está inactiva. No puedes registrar cobradores." };
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
        providerId: providerId,
        createdAt: Timestamp.now()
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
    usersCache.delete(originalIdNumber);
    usersCache.delete(idNumber);

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
    
    usersCache.delete(originalIdNumber);
    usersCache.delete(idNumber);

    return { success: "Cliente actualizado exitosamente." };
}


export async function deleteCobrador(idNumber: string) {
    const batch = writeBatch(db);

    const usersRef = collection(db, "users");
    const qUser = query(usersRef, where("idNumber", "==", idNumber), where("role", "==", "cobrador"));
    const userSnapshot = await getDocs(qUser);

    if (userSnapshot.empty) {
        return { error: "Cobrador no encontrado." };
    }
    
    const cobradorDoc = userSnapshot.docs[0];
    batch.delete(cobradorDoc.ref);
    usersCache.delete(idNumber);

    const creditsRef = collection(db, "credits");
    const qCredits = query(creditsRef, where("cobradorId", "==", idNumber));
    const creditsSnapshot = await getDocs(qCredits);

    for (const creditDoc of creditsSnapshot.docs) {
        const paymentsRef = collection(db, "payments");
        const qPayments = query(paymentsRef, where("creditId", "==", creditDoc.id));
        const paymentsSnapshot = await getDocs(qPayments);
        paymentsSnapshot.forEach(paymentDoc => batch.delete(paymentDoc.ref));
        
        const contractsRef = collection(db, "contracts");
        const qContracts = query(contractsRef, where("creditId", "==", creditDoc.id));
        const contractsSnapshot = await getDocs(qContracts);
        contractsSnapshot.forEach(contractDoc => batch.delete(contractDoc.ref));
        
        batch.delete(creditDoc.ref);
    }
    
    try {
        await batch.commit();
        return { success: true };
    } catch (e) {
        console.error(e);
        return { error: "No se pudo eliminar al cobrador y todos sus datos asociados." };
    }
}

export async function deleteClientAndCredits(clienteId: string) {
    const batch = writeBatch(db);

    const usersRef = collection(db, "users");
    const userQuery = query(usersRef, where("idNumber", "==", clienteId));
    const userSnapshot = await getDocs(userQuery);
    userSnapshot.forEach(doc => batch.delete(doc.ref));
    usersCache.delete(clienteId);

    const creditsRef = collection(db, "credits");
    const creditQuery = query(creditsRef, where("clienteId", "==", clienteId));
    const creditSnapshot = await getDocs(creditQuery);
    
    for (const creditDoc of creditSnapshot.docs) {
        const paymentsRef = collection(db, "payments");
        const paymentsQuery = query(paymentsRef, where("creditId", "==", creditDoc.id));
        const paymentsSnapshot = await getDocs(paymentsQuery);
        paymentsSnapshot.forEach(paymentDoc => batch.delete(paymentDoc.ref));
        
        const contractsRef = collection(db, "contracts");
        const qContracts = query(contractsRef, where("creditId", "==", creditDoc.id));
        const contractsSnapshot = await getDocs(qContracts);
        contractsSnapshot.forEach(contractDoc => batch.delete(contractDoc.ref));
        
        batch.delete(creditDoc.ref);
    }
    
    await batch.commit();
    return { success: true };
}

const generateAndSaveContract = async (creditId: string, providerId: string, creditData: any, clienteData: any, paymentDates: Date[]) => {
    const providerSnap = await getDoc(doc(db, "users", providerId));
    if (!providerSnap.exists()) return;
    
    const providerData = providerSnap.data();
    if (!providerData.isContractGenerationActive || !providerData.contractTemplate) return;

    let contractText = providerData.contractTemplate;

    const totalLoanAmount = (creditData.valor || 0) + (creditData.commission || 0);
    const installmentAmount = creditData.cuotas > 0 ? totalLoanAmount / creditData.cuotas : 0;
    
    const sortedDates = [...paymentDates].sort((a, b) => a.getTime() - b.getTime());
    const firstPaymentDate = sortedDates.length > 0
        ? format(sortedDates[0], "d 'de' MMMM 'de' yyyy", { locale: es })
        : "Fecha no definida";
    
    const paymentFrequency = getPaymentFrequencyString(sortedDates);
        
    const replacements: Record<string, string> = {
        '“NOMBRE DE LA EMPRESA”': providerData.companyName?.toUpperCase() || 'EMPRESA NO DEFINIDA',
        '“NOMBRE DEL CLIENTE”': (clienteData.name || 'CLIENTE NO DEFINIDO').toUpperCase(),
        '“CEDULA DEL CLIENTE”': clienteData.idNumber || 'DOCUMENTO NO DEFINIDO',
        '“CIUDAD”': clienteData.city || 'CIUDAD NO DEFINIDA',
        '“VALOR PRESTAMO”': (creditData.valor || 0).toLocaleString('es-CO'),
        '“CUOTAS DEL CREDITO”': creditData.cuotas?.toString() || '0',
        '“DIA DONDE EL COBRADOR SELECIONA EL PAGO DE LA CUOTA”': firstPaymentDate,
        '“DIAS DEL RECAUDO”': paymentFrequency,
        '“VALOR DE LA CUOTA”': installmentAmount.toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 0 }),
        '“INTERES”': `${creditData.commissionPercentage || 0}`,
    };
    
    for (const [key, value] of Object.entries(replacements)) {
        contractText = contractText.replace(new RegExp(key, 'g'), value);
    }
    
    const contractQuery = query(collection(db, "contracts"), where("creditId", "==", creditId), limit(1));
    const contractSnapshot = await getDocs(contractQuery);

    if (contractSnapshot.empty) {
        await addDoc(collection(db, "contracts"), {
            creditId: creditId,
            providerId: providerId,
            clienteId: clienteData.idNumber,
            contractText: contractText,
            createdAt: Timestamp.now(),
            acceptedAt: null,
        });
    } else {
        const contractRef = contractSnapshot.docs[0].ref;
        await updateDoc(contractRef, { contractText });
    }
};


export async function createClientAndCredit(values: z.infer<typeof ClientCreditSchema>) {
    const { user: cobrador } = await getAuthenticatedUser();
    if (!cobrador || cobrador.role !== 'cobrador') return { error: "Acción no autorizada." };
    
    const providerId = cobrador.providerId;
    if(!providerId) return { error: "El cobrador no tiene un proveedor asociado." };

    const providerDocRef = doc(db, "users", providerId);
    const providerSnap = await getDoc(providerDocRef);
    if (!providerSnap.exists()) return { error: "Proveedor no encontrado."};
    const provider = providerSnap.data();

    if (!provider.isActive) {
        return { error: "La cuenta de tu proveedor está inactiva. No puedes crear nuevos créditos." };
    }
    
    const validatedFields = ClientCreditSchema.safeParse(values);

    if (!validatedFields.success) {
        const errors = validatedFields.error.flatten().fieldErrors;
        const firstError = Object.values(errors)[0]?.[0] || "Datos del formulario inválidos.";
        return { error: firstError };
    }
    
    const { 
        idNumber, firstName, secondName, firstLastName, secondLastName, address, contactPhone, 
        creditAmount, installments, requiresGuarantor, requiresReferences,
        guarantorName, guarantorIdNumber, guarantorAddress, guarantorPhone,
        familyReferenceName, familyReferencePhone, familyReferenceAddress,
        personalReferenceName, personalReferencePhone, personalReferenceAddress
    } = validatedFields.data;
    
    let clienteData = await findUserByIdNumber(idNumber);
    if (clienteData) {
        return { error: "Ya existe un cliente con este número de cédula. Utilice la opción de renovar o crear un nuevo crédito desde el historial del cliente." };
    }
    
    const fullName = [firstName, secondName, firstLastName, secondLastName].filter(Boolean).join(" ");

    const hashedPassword = await bcrypt.hash(idNumber, 10);
    const newUserDocRef = await addDoc(collection(db, "users"),{
        idNumber,
        name: fullName,
        firstName,
        secondName,
        firstLastName,
        secondLastName,
        password: hashedPassword,
        role: 'cliente',
        providerId,
        address,
        contactPhone,
        createdAt: Timestamp.now(),
        city: provider.city || 'N/A'
    });
    usersCache.delete(idNumber);


    const valor = parseFloat(creditAmount.replace(/\./g, '').replace(',', '.'));
    const { commission, percentage } = calculateCommission(valor, provider.commissionTiers);

    const creditDataForContract = {
        valor,
        cuotas: parseInt(installments, 10),
        commission: commission,
        commissionPercentage: percentage,
    };
    
    const creditRef = await addDoc(collection(db, "credits"), {
        ...creditDataForContract,
        clienteId: idNumber,
        cobradorId: cobrador.idNumber,
        providerId,
        fecha: Timestamp.now(),
        estado: 'Activo',
        guarantor: requiresGuarantor ? {
            name: guarantorName,
            idNumber: guarantorIdNumber,
            address: guarantorAddress,
            phone: guarantorPhone,
        } : null,
        references: requiresReferences ? {
            familiar: {
                name: familyReferenceName,
                phone: familyReferencePhone,
                address: familyReferenceAddress
            },
            personal: {
                name: personalReferenceName,
                phone: personalReferencePhone,
                address: personalReferenceAddress
            }
        } : null,
        missedPaymentDays: 0,
    });
    
    return { success: true, creditId: creditRef.id };
}

export async function createNewCreditForClient(values: z.infer<typeof NewCreditSchema>) {
    const { user: cobrador } = await getAuthenticatedUser();
    if (!cobrador || cobrador.role !== 'cobrador') return { error: "Acción no autorizada." };

    const providerId = cobrador.providerId;
    if (!providerId) return { error: "El cobrador no tiene un proveedor asociado." };

    const providerDocRef = doc(db, "users", providerId);
    const providerSnap = await getDoc(providerDocRef);
    if (!providerSnap.exists()) return { error: "Proveedor no encontrado." };
    const provider = providerSnap.data();
    
    if (!provider.isActive) {
        return { error: "La cuenta de tu proveedor está inactiva. No puedes crear nuevos créditos." };
    }

    const { clienteId, creditAmount, installments } = values;

    const cliente = await findUserByIdNumber(clienteId);
    if (!cliente) {
        return { error: "Cliente no encontrado. No se puede crear el crédito." };
    }

    const valor = parseFloat(creditAmount.replace(/\./g, '').replace(',', '.'));
    const { commission, percentage } = calculateCommission(valor, provider.commissionTiers);

    const creditDataForContract = {
        valor,
        cuotas: parseInt(installments, 10),
        commission,
        commissionPercentage: percentage,
    };
    
    const newCreditRef = await addDoc(collection(db, "credits"), {
        ...creditDataForContract,
        clienteId,
        cobradorId: cobrador.idNumber,
        providerId,
        fecha: Timestamp.now(),
        estado: 'Activo',
        paymentScheduleSet: false,
        missedPaymentDays: 0,
    });
    
    return { success: true, newCreditId: newCreditRef.id };
}

export async function renewCredit(values: z.infer<typeof RenewCreditSchema>) {
    const { user: cobrador } = await getAuthenticatedUser();
    if (!cobrador || cobrador.role !== 'cobrador') return { error: "Acción no autorizada." };

    const providerId = cobrador.providerId;
    if(!providerId) return { error: "El cobrador no tiene un proveedor asociado." };
    
    const providerDocRef = doc(db, "users", providerId);
    const providerSnap = await getDoc(providerDocRef);
    if (!providerSnap.exists()) return { error: "Proveedor no encontrado."};
    const provider = providerSnap.data();
    
    if (!provider.isActive) {
        return { error: "La cuenta de tu proveedor está inactiva. No puedes renovar créditos." };
    }

    const { clienteId, oldCreditId, additionalAmount, installments } = values;

    // Recalculate remaining balance on the server for security
    const oldCreditRef = doc(db, "credits", oldCreditId);
    const oldCreditSnap = await getDoc(oldCreditRef);
    if (!oldCreditSnap.exists()) {
        return { error: "El crédito anterior no fue encontrado." };
    }
    const oldCreditData = oldCreditSnap.data();
    const paymentsRef = collection(db, "payments");
    const paymentsQuery = query(paymentsRef, where("creditId", "==", oldCreditId));
    const paymentsSnapshot = await getDocs(paymentsQuery);
    
    const capitalAndCommissionPayments = paymentsSnapshot.docs.map(p => p.data()).filter(p => p.type === 'cuota' || p.type === 'total');
    const paidCapitalAndCommission = capitalAndCommissionPayments.reduce((sum, p) => sum + p.amount, 0);
    const totalOldLoanAmount = (oldCreditData.valor || 0) + (oldCreditData.commission || 0);
    const remainingBalance = totalOldLoanAmount - paidCapitalAndCommission;

    const additionalValue = parseFloat(additionalAmount.replace(/\./g, '').replace(',', '.'));
    const newTotalValue = additionalValue + remainingBalance;

    const { commission, percentage } = calculateCommission(newTotalValue, provider.commissionTiers);
    
    const creditDataForContract = {
        valor: newTotalValue,
        cuotas: parseInt(installments, 10),
        commission,
        commissionPercentage: percentage,
    };

    const batch = writeBatch(db);

    // 1. Create the new credit
    const newCreditRef = doc(collection(db, "credits")); // Generate a ref with a new ID
    batch.set(newCreditRef, {
        ...creditDataForContract,
        clienteId,
        cobradorId: cobrador.idNumber,
        providerId,
        fecha: Timestamp.now(),
        estado: 'Activo',
        paymentScheduleSet: false,
        missedPaymentDays: 0,
        renewedFrom: oldCreditId,
    });

    // 2. Mark the old credit as 'Renovado'
    batch.update(oldCreditRef, {
        estado: 'Renovado',
        updatedAt: Timestamp.now(),
        renewedWithCreditId: newCreditRef.id,
    });
    
    await batch.commit();

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
        const creditSnap = await getDoc(creditRef);
        if (!creditSnap.exists()) {
            return { error: "Crédito no encontrado." };
        }
        const creditData = creditSnap.data();

        const dateObjects = paymentDates.map(dateStr => new Date(dateStr));
        const timestampDates = dateObjects.map(d => Timestamp.fromDate(d));
        
        await updateDoc(creditRef, {
            paymentDates: timestampDates,
            paymentScheduleSet: true,
            updatedAt: Timestamp.now(),
        });
        
        const clienteData = await findUserByIdNumber(creditData.clienteId);
        if (clienteData) {
            await generateAndSaveContract(creditId, creditData.providerId, creditData, clienteData, dateObjects);
        }
        
        return { success: true };
    } catch (error) {
        console.error("Error saving payment schedule:", error);
        return { error: "No se pudo guardar el calendario de pagos." };
    }
}

export async function registerPayment(creditId: string, amount: number, type: "cuota" | "total" | "comision") {
    const { user: cobradorData } = await getAuthenticatedUser();
    if (!cobradorData || cobradorData.role !== 'cobrador') return { error: "Acción no autorizada." };

    const creditRef = doc(db, "credits", creditId);
    const creditSnap = await getDoc(creditRef);
    if (!creditSnap.exists()) {
        return { error: "Crédito no encontrado." };
    }
    const creditData = creditSnap.data();

    await addDoc(collection(db, "payments"), {
        creditId,
        amount,
        type,
        date: Timestamp.now(),
        cobradorId: cobradorData.idNumber,
        providerId: creditData.providerId,
        clienteId: creditData.clienteId,
        reinvested: false, // Add this flag
    });
    
    if (type === 'cuota' || type === 'total') {
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
            
            const freshCreditSnap = await getDoc(creditRef);
            const freshCreditData = freshCreditSnap.data();
            if (!freshCreditData) return { error: "Error al recargar el crédito." };

            const totalLoanAmount = (freshCreditData.valor || 0) + (freshCreditData.commission || 0);
            const remainingBalance = totalLoanAmount - paidCapitalAndCommission;
            
            const providerDocRef = doc(db, "users", freshCreditData.providerId);
            const providerSnap = await getDoc(providerDocRef);
            const providerSettings = providerSnap.exists() ? providerSnap.data() : {};
            const lateInterestRate = providerSettings.isLateInterestActive ? (providerSettings.lateInterestRate || 0) : 0;
            
            const lateFee = calculateLateFee({ ...freshCreditData, lateInterestRate });
            const totalDebt = remainingBalance + lateFee;

            if (totalDebt <= 1) {
                 isPaidOff = true;
            }
        }

        if (isPaidOff) {
            await updateDoc(creditRef, { estado: 'Pagado', updatedAt: Timestamp.now(), missedPaymentDays: 0 });
            // Delete contract on payoff
            const contractsRef = collection(db, "contracts");
            const qContracts = query(contractsRef, where("creditId", "==", creditId));
            const contractsSnapshot = await getDocs(qContracts);
            const batch = writeBatch(db);
            contractsSnapshot.forEach(contractDoc => batch.delete(contractDoc.ref));
            await batch.commit();
        } else {
             await updateDoc(creditRef, { updatedAt: Timestamp.now(), missedPaymentDays: 0 });
        }
    } else {
        await updateDoc(creditRef, { updatedAt: Timestamp.now() });
    }

    return { success: `Pago de ${amount.toLocaleString('es-CO')} registrado.` };
}

export async function registerPaymentAgreement(creditId: string, amount: number) {
    const { user: cobradorData } = await getAuthenticatedUser();
    if (!cobradorData || cobradorData.role !== 'cobrador') return { error: "Acción no autorizada." };

    const creditRef = doc(db, "credits", creditId);
    const creditSnap = await getDoc(creditRef);
    if (!creditSnap.exists()) return { error: "Crédito no encontrado." };
    
    const creditData = creditSnap.data();
    if (!creditData.paymentDates || creditData.paymentDates.length < 2) {
        return { error: "El calendario de pagos no es válido para reprogramar." };
    }

    const dates = creditData.paymentDates.map((ts: Timestamp) => ts.toDate()).sort((a: Date, b: Date) => a.getTime() - b.getTime());
    const frequencyDays = differenceInDays(dates[1], dates[0]);

    const paymentsSnapshot = await getDocs(query(collection(db, "payments"), where("creditId", "==", creditId)));
    const paidInstallments = paymentsSnapshot.docs.filter(p => p.data().type === 'cuota').length;
    
    if (paidInstallments >= dates.length) {
        return { error: "El crédito ya ha sido pagado en su totalidad." };
    }
    
    const remainingDates = dates.slice(paidInstallments);
    const newPaymentDates = remainingDates.map(date => addDays(date, frequencyDays));

    const finalSchedule = [
        ...dates.slice(0, paidInstallments),
        ...newPaymentDates
    ];

    await updateDoc(creditRef, {
        paymentDates: finalSchedule.map(d => Timestamp.fromDate(d)),
        missedPaymentDays: 0,
        updatedAt: Timestamp.now(),
    });

    if (amount > 0) {
      await addDoc(collection(db, "payments"), {
          creditId,
          amount,
          type: "acuerdo",
          date: Timestamp.now(),
          cobradorId: cobradorData.idNumber,
          providerId: creditData.providerId,
          clienteId: creditData.clienteId,
          reinvested: false, // Also flag this
      });
    }
    
    return { success: "Acuerdo registrado. El calendario de pagos ha sido actualizado." };
}

export async function saveProviderSettings(providerId: string, settings: { baseCapital?: number, commissionTiers?: CommissionTier[], lateInterestRate?: number, isLateInterestActive?: boolean, isContractGenerationActive?: boolean, contractTemplate?: string }) {
  if (!providerId) return { error: "ID de proveedor no válido." };
  
  const providerRef = doc(db, "users", providerId);
  try {
      const providerSnap = await getDoc(providerRef);
      if(!providerSnap.exists() || providerSnap.data().role !== 'proveedor') {
        return { error: "Proveedor no encontrado o no autorizado." };
      }

      const updateData: any = {};
      if (settings.baseCapital !== undefined) {
          updateData.baseCapital = settings.baseCapital;
      }
      if (settings.commissionTiers !== undefined) {
        updateData.commissionTiers = settings.commissionTiers;
      }
      if (settings.lateInterestRate !== undefined) {
        updateData.lateInterestRate = settings.lateInterestRate;
      }
      if (settings.isLateInterestActive !== undefined) {
        updateData.isLateInterestActive = settings.isLateInterestActive;
      }
      if (settings.isContractGenerationActive !== undefined) {
        updateData.isContractGenerationActive = settings.isContractGenerationActive;
      }
       if (settings.contractTemplate !== undefined) {
        updateData.contractTemplate = settings.contractTemplate;
      }
      
      if (Object.keys(updateData).length > 0) {
        updateData.updatedAt = Timestamp.now();
        await updateDoc(providerRef, updateData);
        usersCache.delete(providerSnap.data().idNumber);
        return { success: true };
      }

      return { success: true };

  } catch (error) {
      console.error("Error saving provider settings:", error);
      return { error: "No se pudo guardar la configuración." };
  }
}

export async function registerMissedPayment(creditId: string) {
  const { user } = await getAuthenticatedUser();
  if (!user) return { error: "Acceso no autorizado." };

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

export async function getContractForAcceptance(creditId: string) {
    if (!creditId) return { error: "ID de crédito no válido." };
    const q = query(collection(db, "contracts"), where("creditId", "==", creditId), limit(1));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
        return { contractText: null };
    }

    const contract = snapshot.docs[0].data();
    return { contractText: contract.contractText };
}

export async function acceptContract(creditId: string) {
    if (!creditId) return { error: "ID de crédito no válido." };
    
    const q = query(collection(db, "contracts"), where("creditId", "==", creditId), limit(1));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
        return { error: "No se encontró el contrato para este crédito." };
    }

    const contractRef = snapshot.docs[0].ref;
    try {
        await updateDoc(contractRef, {
            acceptedAt: Timestamp.now()
        });
        return { success: true };
    } catch (e) {
        console.error("Error accepting contract:", e);
        return { error: "No se pudo actualizar el estado de aceptación del contrato." };
    }
}

export async function getClientContracts() {
    const { user: clienteData } = await getAuthenticatedUser();
    if (!clienteData || clienteData.role !== 'cliente') return [];
    
    const contractsRef = collection(db, "contracts");
    const q = query(contractsRef, where("clienteId", "==", clienteData.idNumber));
    const contractSnapshot = await getDocs(q);

    if (contractSnapshot.empty) {
        return [];
    }

    const acceptedContracts = contractSnapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(c => c.acceptedAt !== null);

    if (acceptedContracts.length === 0) {
        return [];
    }
    
    const contractsPromises = acceptedContracts.map(async (contractData) => {
        const creditDoc = await getDoc(doc(db, "credits", contractData.creditId));
        if (!creditDoc.exists()) return null;

        const creditData = creditDoc.data();
        const providerDoc = await getDoc(doc(db, "users", creditData.providerId));
        const providerName = providerDoc.exists() ? providerDoc.data().companyName : "Proveedor Desconocido";

        return {
            id: contractData.id,
            creditId: contractData.creditId,
            providerName: providerName,
            creditAmount: creditData.valor,
            acceptedAt: (contractData.acceptedAt as Timestamp).toDate().toISOString(),
            contractText: contractData.contractText,
        };
    });

    const contracts = (await Promise.all(contractsPromises)).filter(Boolean);
    return contracts.sort((a,b) => new Date(b!.acceptedAt).getTime() - new Date(a!.acceptedAt).getTime()) as any[];
}


// --- AI Actions ---

export async function getClientReputationData(clienteId: string) {
    try {
        const client = await findUserByIdNumber(clienteId);
        if (!client || client.role !== 'cliente') {
            return { error: "No se encontró un cliente con esa cédula." };
        }

        const allCreditsSnapshot = await getDocs(collection(db, "credits"));
        const clientCreditsDocs = allCreditsSnapshot.docs.filter(doc => doc.data().clienteId === clienteId);

        if (clientCreditsDocs.length === 0) {
             const analysis = await analyzeClientReputation({ clienteId, creditHistory: [] });
             return { analysis, clientName: client.name };
        }

        const creditsPromises = clientCreditsDocs.map(async (creditDoc) => {
            const creditData = creditDoc.data();
            const paymentsRef = collection(db, "payments");
            const paymentsQuery = query(paymentsRef, where("creditId", "==", creditDoc.id));
            const paymentsSnapshot = await getDocs(paymentsQuery);
            const paidInstallments = paymentsSnapshot.docs.filter(p => p.data().type === 'cuota').length;

            return {
                id: creditDoc.id,
                valor: creditData.valor || 0,
                estado: creditData.estado || 'Desconocido',
                cuotas: creditData.cuotas || 0,
                paidInstallments: paidInstallments,
                missedPaymentDays: creditData.missedPaymentDays || 0,
            };
        });
        
        const creditHistory = await Promise.all(creditsPromises);

        const analysis = await analyzeClientReputation({
            clienteId: clienteId,
            creditHistory: creditHistory,
        });

        return { analysis, clientName: client.name };
    } catch (error) {
        console.error("Error getting client reputation data:", error);
        return { error: "Ocurrió un error al consultar la reputación del cliente." };
    }
}

export async function getCobradoresDailySummary() {
    const { userId: providerId } = await getAuthenticatedUser();
    if (!providerId) return [];

    const timeZone = 'America/Bogota';
    const today = toZonedTime(new Date(), timeZone);
    const todayStart = startOfDay(today);
    const todayEnd = endOfDay(today);

    const cobradoresList = await getCobradoresByProvider();

    const paymentsRef = collection(db, "payments");
    const paymentsQuery = query(paymentsRef, where("providerId", "==", providerId));
    const paymentsSnapshot = await getDocs(paymentsQuery);
    
    const todayPayments = paymentsSnapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(p => p.date && isWithinInterval(toZonedTime(p.date.toDate(), timeZone), { start: todayStart, end: todayEnd }));

    const creditsRef = collection(db, "credits");
    const creditsQuery = query(creditsRef, where("providerId", "==", providerId));
    const creditsSnapshot = await getDocs(creditsQuery);
    
    const todayRenewedCredits = creditsSnapshot.docs
        .map(doc => doc.data())
        .filter(c => c.estado === 'Renovado' && c.updatedAt && isWithinInterval(toZonedTime(c.updatedAt.toDate(), timeZone), { start: todayStart, end: todayEnd }));
        
    const todayMissedPaymentCredits = creditsSnapshot.docs
        .map(doc => doc.data())
        .filter(c => c.missedPaymentDays > 0 && c.updatedAt && isWithinInterval(toZonedTime(c.updatedAt.toDate(), timeZone), { start: todayStart, end: todayEnd }));

    const summaryPromises = cobradoresList.map(async (cobrador) => {
        const cobradorId = cobrador.idNumber;

        const cobradorPayments = todayPayments.filter(p => p.cobradorId === cobradorId);
        const totalCollected = cobradorPayments.reduce((sum, p) => sum + p.amount, 0);

        const successfulPayments = new Set(cobradorPayments.filter(p => p.type === 'cuota' || p.type === 'total').map(p => p.clienteId)).size;
        
        const renewedCredits = todayRenewedCredits.filter(c => c.cobradorId === cobradorId).length;
        
        const missedPayments = new Set(todayMissedPaymentCredits.filter(c => c.cobradorId === cobradorId).map(c => c.clienteId)).size;

        return {
            ...cobrador,
            totalCollected,
            successfulPayments,
            renewedCredits,
            missedPayments,
        };
    });

    return Promise.all(summaryPromises);
}

export async function getCobradorSelfDailySummary() {
    const { user: cobrador } = await getAuthenticatedUser();
    if (!cobrador || cobrador.role !== 'cobrador') {
        return { successfulPayments: 0, renewedCredits: 0, missedPayments: 0 };
    }
    const cobradorId = cobrador.idNumber;

    const timeZone = 'America/Bogota';
    const today = toZonedTime(new Date(), timeZone);
    const todayStart = startOfDay(today);
    const todayEnd = endOfDay(today);

    const paymentsRef = collection(db, "payments");
    const paymentsQuery = query(paymentsRef, where("cobradorId", "==", cobradorId));
    const paymentsSnapshot = await getDocs(paymentsQuery);
    const todayPayments = paymentsSnapshot.docs
        .map(doc => doc.data())
        .filter(p => p.date && isWithinInterval(toZonedTime(p.date.toDate(), timeZone), { start: todayStart, end: todayEnd }));
    const successfulPayments = new Set(todayPayments.filter(p => p.type === 'cuota' || p.type === 'total').map(p => p.clienteId)).size;

    const creditsRef = collection(db, "credits");
    const creditsQuery = query(creditsRef, where("cobradorId", "==", cobradorId));
    const creditsSnapshot = await getDocs(creditsQuery);
    
    let renewedCredits = 0;
    const missedClients = new Set();

    creditsSnapshot.docs.forEach(doc => {
        const credit = doc.data();
        if (credit.updatedAt && credit.updatedAt instanceof Timestamp && isWithinInterval(toZonedTime(credit.updatedAt.toDate(), timeZone), { start: todayStart, end: todayEnd })) {
            if (credit.estado === 'Renovado') {
                renewedCredits++;
            }
            if (credit.missedPaymentDays > 0) {
                missedClients.add(credit.clienteId);
            }
        }
    });
    
    const missedPayments = missedClients.size;
    
    const summary = { successfulPayments, renewedCredits, missedPayments };
    
    const serializableSummary = JSON.parse(JSON.stringify(summary));
    
    return serializableSummary;
}

export async function getProviderFinancialSummary() {
  const { userId: providerId, user: providerData } = await getAuthenticatedUser();
  if (!providerId || !providerData) {
      return { activeCapital: 0, collectedCommission: 0, uniqueClientCount: 0, myCapital: 0 };
  }

  // Load all credits and payments first
  const creditsRef = collection(db, "credits");
  const creditsQuery = query(creditsRef, where("providerId", "==", providerId));
  const creditsSnapshot = await getDocs(creditsQuery);
  const allProviderCredits = creditsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

  const paymentsRef = collection(db, "payments");
  const paymentsQuery = query(paymentsRef, where("providerId", "==", providerId));
  const paymentsSnapshot = await getDocs(paymentsQuery);
  const allProviderPayments = paymentsSnapshot.docs.map(doc => doc.data());

  let activeCapital = 0;
  let collectedCommission = 0; // This will be the available-to-reinvest amount
  const uniqueClientIds = new Set<string>();
  let paidOffCommission = 0;

  for (const credit of allProviderCredits) {
    uniqueClientIds.add(credit.clienteId);

    const creditPayments = allProviderPayments.filter(p => p.creditId === credit.id);
    const capitalAndCommissionPayments = creditPayments.filter(p => p.type === 'cuota' || p.type === 'total');
    const totalPaidAmount = capitalAndCommissionPayments.reduce((sum, p) => sum + p.amount, 0);
    const totalLoanAmount = (credit.valor || 0) + (credit.commission || 0);

    if (totalLoanAmount > 0) {
      const paidProportion = Math.min(1, totalPaidAmount / totalLoanAmount);
      
      // Calculate only commission from payments that have NOT been reinvested
      const unreinvestedPayments = capitalAndCommissionPayments.filter(p => !p.reinvested);
      const unreinvestedPaidAmount = unreinvestedPayments.reduce((sum, p) => sum + p.amount, 0);
      const unreinvestedPaidProportion = Math.min(1, unreinvestedPaidAmount / totalLoanAmount);
      collectedCommission += (credit.commission || 0) * unreinvestedPaidProportion;
    }

    if (credit.estado === 'Activo') {
      const capitalProportionInLoan = totalLoanAmount > 0 ? (credit.valor || 0) / totalLoanAmount : 0;
      const totalCapitalPaid = totalPaidAmount * capitalProportionInLoan;
      activeCapital += (credit.valor || 0) - totalCapitalPaid;
    }
    
    if (credit.estado === 'Pagado') {
        paidOffCommission += credit.commission || 0;
    }
  }

  const finalActiveCapital = Math.max(0, activeCapital);
  
  const myCapital = (providerData.baseCapital || 0);

  return { 
    activeCapital: finalActiveCapital,
    collectedCommission,
    uniqueClientCount: uniqueClientIds.size,
    myCapital,
  };
}

export async function reinvestCommission() {
    const { userId: providerId } = await getAuthenticatedUser();
    if (!providerId) return { error: "Proveedor no autenticado." };

    try {
        const providerRef = doc(db, "users", providerId);
        const providerSnap = await getDoc(providerRef);
        if (!providerSnap.exists()) {
            return { error: "Proveedor no encontrado." };
        }
        const providerData = providerSnap.data();

        // 1. Get all unreinvested payments for the provider
        const paymentsRef = collection(db, "payments");
        
        // This is a more compatible way to query for "not true"
        const q1 = query(paymentsRef, where("providerId", "==", providerId), where("reinvested", "==", false));
        const q2 = query(paymentsRef, where("providerId", "==", providerId), where("reinvested", "==", null));
        
        const [snapshot1, snapshot2] = await Promise.all([getDocs(q1), getDocs(q2)]);
        
        const unreinvestedPaymentsDocs = [...snapshot1.docs, ...snapshot2.docs];
        // Deduplicate in case a document matches both (though it shouldn't)
        const uniqueDocs = Array.from(new Map(unreinvestedPaymentsDocs.map(d => [d.id, d])).values());

        if (uniqueDocs.length === 0) {
            return { success: true, newCapital: providerData.baseCapital || 0 }; // Nothing to do
        }
        
        let commissionToReinvest = 0;
        const batch = writeBatch(db);
        const creditsMap = new Map();

        for(const paymentDoc of uniqueDocs) {
            const payment = paymentDoc.data();
            let creditData = creditsMap.get(payment.creditId);
            if (!creditData) {
                const creditSnap = await getDoc(doc(db, "credits", payment.creditId));
                if (creditSnap.exists()) {
                    creditData = creditSnap.data();
                    creditsMap.set(payment.creditId, creditData);
                }
            }
            
            if (creditData && (payment.type === 'cuota' || payment.type === 'total' || payment.type === 'acuerdo')) {
                 const totalLoanAmount = (creditData.valor || 0) + (creditData.commission || 0);
                 if (totalLoanAmount > 0) {
                     const commissionProportion = (creditData.commission || 0) / totalLoanAmount;
                     commissionToReinvest += payment.amount * commissionProportion;
                 }
            }
            
            // Mark payment as reinvested
            batch.update(paymentDoc.ref, { reinvested: true });
        };
        
        if (commissionToReinvest <= 0) {
            // Still commit the batch to mark any zero-amount payments as reinvested
            await batch.commit();
            return { error: "No hay comisiones para reinvertir." };
        }

        // 2. Add commission to base capital
        const currentBaseCapital = providerData.baseCapital || 0;
        const newBaseCapital = currentBaseCapital + commissionToReinvest;
        batch.update(providerRef, { baseCapital: newBaseCapital, updatedAt: Timestamp.now() });
        
        // 3. Commit all changes
        await batch.commit();

        return { success: true, newCapital: newBaseCapital };

    } catch (e) {
        console.error("Error reinvesting commission:", e);
        return { error: "Ocurrió un error en el servidor al reinvertir." };
    }
}



// --- Admin Actions ---

export async function getAllProviders() {
    const providersRef = collection(db, "users");
    const providersQuery = query(providersRef, where("role", "==", "proveedor"));
    const providersSnapshot = await getDocs(providersQuery);

    const creditsRef = collection(db, "credits");
    const creditsSnapshot = await getDocs(creditsRef);
    const allCredits = creditsSnapshot.docs.map(doc => doc.data());

    const providersData = providersSnapshot.docs.map(providerDoc => {
        const providerData = providerDoc.data();
        const providerId = providerDoc.id;

        const uniqueClientIds = new Set(
            allCredits
                .filter(credit => credit.providerId === providerId)
                .map(credit => credit.clienteId)
        );

        return {
            id: providerId,
            companyName: providerData.companyName || 'Sin Nombre',
            email: providerData.email || 'Sin Correo',
            whatsappNumber: providerData.whatsappNumber || 'Sin Teléfono',
            idNumber: providerData.idNumber,
            isActive: providerData.isActive !== false,
            uniqueClientCount: uniqueClientIds.size,
            activatedAt: providerData.activatedAt instanceof Timestamp ? providerData.activatedAt.toDate().toISOString() : undefined,
        };
    });

    return providersData;
}

export async function toggleProviderStatus(providerId: string, newStatus: boolean) {
    const { role } = await getAuthenticatedUser();
    if (role !== 'admin') return { error: "Acción no autorizada." };

    const providerRef = doc(db, "users", providerId);
    try {
        const updateData: { isActive: boolean; activatedAt?: Timestamp } = { isActive: newStatus };
        if (newStatus) {
            updateData.activatedAt = Timestamp.now();
        }
        await updateDoc(providerRef, updateData);
        usersCache.clear();
        return { success: true };
    } catch (e) {
        console.error(e);
        return { error: "No se pudo actualizar el estado." };
    }
}

export async function deleteProvider(providerId: string) {
    const { role } = await getAuthenticatedUser();
    if (role !== 'admin') return { error: "Acción no autorizada." };

    const batch = writeBatch(db);

    const providerRef = doc(db, "users", providerId);
    const providerSnap = await getDoc(providerRef);
    
    // Invalidate provider cache
    if (providerSnap.exists()) {
        const providerData = providerSnap.data();
        if (providerData) {
            usersCache.delete(providerData.idNumber);
        }
        batch.delete(providerRef);
    }
    
    const cobradoresRef = collection(db, "users");
    const cobradoresQuery = query(cobradoresRef, where("providerId", "==", providerId));
    const cobradoresSnapshot = await getDocs(cobradoresQuery);
    
    // Invalidate cobrador caches
    cobradoresSnapshot.forEach(doc => {
        const cobradorData = doc.data();
        if (cobradorData) {
            usersCache.delete(cobradorData.idNumber);
        }
        batch.delete(doc.ref);
    });
    
    const creditsRef = collection(db, "credits");
    const creditsQuery = query(creditsRef, where("providerId", "==", providerId));
    const creditsSnapshot = await getDocs(creditsQuery);
    
    for (const creditDoc of creditsSnapshot.docs) {
        const paymentsRef = collection(db, "payments");
        const paymentsQuery = query(paymentsRef, where("creditId", "==", creditDoc.id));
        const paymentsSnapshot = await getDocs(paymentsQuery);
        paymentsSnapshot.forEach(paymentDoc => batch.delete(paymentDoc.ref));

        const contractsRef = collection(db, "contracts");
        const qContracts = query(contractsRef, where("creditId", "==", creditDoc.id));
        const contractsSnapshot = await getDocs(qContracts);
        contractsSnapshot.forEach(contractDoc => batch.delete(contractDoc.ref));
        
        batch.delete(creditDoc.ref);
    }

    try {
        await batch.commit();
        return { success: true };
    } catch (e) {
        console.error(e);
        return { error: "No se pudo eliminar el proveedor y todos sus datos asociados." };
    }
}

export async function updateProvider(values: z.infer<typeof EditProviderSchema>) {
    const { role } = await getAuthenticatedUser();
    if (role !== 'admin') return { error: "Acción no autorizada." };
    
    const { originalIdNumber, idNumber, companyName, email, whatsappNumber, password } = values;

    const usersRef = collection(db, "users");
    const q = query(usersRef, where("idNumber", "==", originalIdNumber), where("role", "==", "proveedor"));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
        return { error: "Proveedor no encontrado." };
    }

    if (originalIdNumber !== idNumber && await findUserByIdNumber(idNumber)) {
        return { error: "El nuevo número de identificación ya está en uso." };
    }
    
    const userDoc = querySnapshot.docs[0];
    const updateData: { [key: string]: any } = {
        idNumber,
        companyName,
        name: companyName,
        email,
        whatsappNumber,
        updatedAt: Timestamp.now()
    };

    if (password) {
        updateData.password = await bcrypt.hash(password, 10);
    }

    await updateDoc(doc(db, "users", userDoc.id), updateData);
    usersCache.delete(originalIdNumber);
    usersCache.delete(idNumber);

    return { success: "Proveedor actualizado exitosamente." };
}

export async function getAdminSettings() {
    const settingsRef = doc(db, "settings", "app_config");
    const settingsSnap = await getDoc(settingsRef);
    if (!settingsSnap.exists()) {
        return { pricePerClient: 3500 }; // Default value
    }
    return settingsSnap.data() as { pricePerClient: number };
}

export async function saveAdminSettings(settings: { pricePerClient: number }) {
    const { role } = await getAuthenticatedUser();
    if (role !== 'admin') return { error: "Acción no autorizada." };

    const settingsRef = doc(db, "settings", "app_config");
    try {
        await setDoc(settingsRef, settings, { merge: true });
        return { success: true };
    } catch (e) {
        console.error("Error saving admin settings:", e);
        return { error: "No se pudo guardar la configuración." };
    }
}

    

    












