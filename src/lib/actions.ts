
"use server";

import { z } from "zod";
import { LoginSchema, RegisterSchema, CobradorRegisterSchema, EditCobradorSchema, ClientCreditSchema } from "./schemas";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import bcrypt from 'bcryptjs';

// --- Mock Database ---
let mockUsers = [
    { id: '1', idNumber: '123456', password: 'password123', role: 'proveedor', companyName: 'Mi Empresa SAS', whatsappNumber: '3001112233', email: 'proveedor@test.com', createdAt: new Date().toISOString() },
    { id: '2', idNumber: '789012', password: 'password123', role: 'cobrador', name: 'Carlos Cobrador', providerId: '123456', createdAt: new Date().toISOString() },
    { id: '3', idNumber: '111222', password: 'password123', role: 'cliente', name: 'Ana Cliente', whatsappNumber: '3003334455', email: 'cliente@test.com', providerId: '123456', createdAt: new Date().toISOString() },
    { id: '4', idNumber: '1143836674', password: 'password123', role: 'admin', name: 'Admin User', email: 'admin@test.com', createdAt: new Date().toISOString() }
];

let mockCredits = [
    { id: 'cred001', clienteId: '111222', clienteName: 'Ana Cliente', cobradorId: '789012', providerId: '123456', valor: 500000, cuotas: 12, fecha: new Date('2024-05-01T10:00:00Z').toISOString(), estado: 'Activo' },
    { id: 'cred002', clienteId: '111222', clienteName: 'Ana Cliente', cobradorId: '789012', providerId: '123456', valor: 200000, cuotas: 6, fecha: new Date('2024-06-15T14:30:00Z').toISOString(), estado: 'Activo' },
];

let mockCobradores = [
    { id: 'cob001', idNumber: '789012', name: 'Carlos Cobrador', role: 'cobrador', providerId: '123456', createdAt: new Date().toISOString() }
];

// --- Utility Functions ---
const findUserByIdNumber = (idNumber: string) => mockUsers.find(u => u.idNumber === idNumber);
const findUserById = (id: string) => mockUsers.find(u => u.id === id);


// --- Auth Actions ---
export async function login(values: z.infer<typeof LoginSchema>) {
  try {
    const validatedFields = LoginSchema.safeParse(values);

    if (!validatedFields.success) {
      return { error: "Campos inválidos." };
    }

    const { idNumber, password } = validatedFields.data;
    const existingUser = findUserByIdNumber(idNumber);

    if (!existingUser || existingUser.password !== password) {
      return { error: "Cédula o contraseña incorrecta." };
    }
    
    // Set cookie
    cookies().set('loggedInUser', existingUser.id, { httpOnly: true, path: '/' });

    return { successUrl: `/dashboard/${existingUser.role}` };

  } catch (error) {
    return { error: "Algo salió mal en el servidor." };
  }
}

export async function register(values: z.infer<typeof RegisterSchema>, role: 'cliente' | 'proveedor') {
    const validatedFields = RegisterSchema.safeParse(values);

    if (!validatedFields.success) {
        return { error: "Campos inválidos." };
    }

    const { idNumber, password, companyName, email, whatsappNumber } = validatedFields.data;

    if (findUserByIdNumber(idNumber)) {
        return { error: "El número de identificación ya está registrado." };
    }
    
    const newUser = {
        id: (mockUsers.length + 1).toString(),
        idNumber,
        password, // In a real app, hash this!
        role,
        companyName: role === 'proveedor' ? companyName : undefined,
        name: role === 'cliente' ? 'Nuevo Cliente' : undefined,
        email,
        whatsappNumber,
        createdAt: new Date().toISOString()
    };
    mockUsers.push(newUser);
    
    cookies().set('loggedInUser', newUser.id, { httpOnly: true, path: '/' });

    return { successUrl: `/dashboard/${role}` };
}

export async function logout() {
  cookies().set('loggedInUser', '', { expires: new Date(0), path: '/' });
  return { successUrl: '/login' };
}

// --- Data Fetching Actions ---

export async function getUserRole(userId: string) {
    const user = findUserById(userId);
    return user?.role || null;
}

export async function getUserData(userId: string) {
    const user = findUserById(userId);
    if (!user) return null;
    // Return a copy to avoid mutating the mock DB
    return { ...user };
}

export async function getCobradoresByProvider() {
    const providerIdCookie = cookies().get('loggedInUser');
    if (!providerIdCookie) return [];
    
    const provider = findUserById(providerIdCookie.value);
    if (!provider || provider.role !== 'proveedor') return [];

    return mockCobradores.filter(c => c.providerId === provider.idNumber);
}

export async function getCreditsByProvider() {
    const providerIdCookie = cookies().get('loggedInUser');
    if (!providerIdCookie) return [];
    
    const provider = findUserById(providerIdCookie.value);
    if (!provider || provider.role !== 'proveedor') return [];

    return mockCredits
        .filter(c => c.providerId === provider.idNumber)
        .map(c => ({
            ...c,
            cobradorName: mockCobradores.find(cob => cob.idNumber === c.cobradorId)?.name,
            clienteName: mockUsers.find(cli => cli.idNumber === c.clienteId)?.name
        }));
}

export async function getCreditsByCobrador() {
    const cobradorIdCookie = cookies().get('loggedInUser');
    if (!cobradorIdCookie) return [];

    const cobrador = findUserById(cobradorIdCookie.value);
    if (!cobrador || cobrador.role !== 'cobrador') return [];
    
    return mockCredits
      .filter(c => c.cobradorId === cobrador.idNumber)
      .map(c => ({
        ...c,
        clienteName: mockUsers.find(cli => cli.idNumber === c.clienteId)?.name
      }));
}

// --- Data Mutation Actions ---

export async function registerCobrador(values: z.infer<typeof CobradorRegisterSchema>) {
    const providerIdCookie = cookies().get('loggedInUser');
    if (!providerIdCookie) {
        return { error: "No se pudo identificar al proveedor." };
    }
    const provider = findUserById(providerIdCookie.value);
    if (!provider || provider.role !== 'proveedor') {
        return { error: "Acción no autorizada." };
    }

    if (findUserByIdNumber(values.idNumber)) {
        return { error: "El número de identificación ya está en uso." };
    }

    const newCobrador = {
        id: `cob${mockCobradores.length + 1}`,
        idNumber: values.idNumber,
        name: values.name,
        role: 'cobrador',
        providerId: provider.idNumber,
        createdAt: new Date().toISOString()
    };
    mockCobradores.push(newCobrador);

    const newUser = {
        id: (mockUsers.length + 1).toString(),
        idNumber: values.idNumber,
        password: values.password,
        role: 'cobrador',
        name: values.name,
        providerId: provider.idNumber,
        createdAt: new Date().toISOString()
    };
    mockUsers.push(newUser);

    return { success: `Cobrador ${values.name} registrado exitosamente.` };
}

export async function updateCobrador(values: z.infer<typeof EditCobradorSchema>) {
    const { originalIdNumber, idNumber, name, password } = values;

    const cobradorIndex = mockCobradores.findIndex(c => c.idNumber === originalIdNumber);
    const userIndex = mockUsers.findIndex(u => u.idNumber === originalIdNumber);

    if (cobradorIndex === -1 || userIndex === -1) {
        return { error: "Cobrador no encontrado." };
    }

    if (originalIdNumber !== idNumber && findUserByIdNumber(idNumber)) {
        return { error: "El nuevo número de identificación ya está en uso." };
    }
    
    mockCobradores[cobradorIndex] = { ...mockCobradores[cobradorIndex], idNumber, name };
    mockUsers[userIndex] = { ...mockUsers[userIndex], idNumber, name };

    if (password) {
        mockUsers[userIndex].password = password;
    }

    return { success: "Cobrador actualizado exitosamente." };
}

export async function deleteCobrador(idNumber: string) {
    mockCobradores = mockCobradores.filter(c => c.idNumber !== idNumber);
    mockUsers = mockUsers.filter(u => u.idNumber !== idNumber);
    return { success: true };
}

export async function deleteClientAndCredits(clienteId: string) {
    mockUsers = mockUsers.filter(u => u.idNumber !== clienteId);
    mockCredits = mockCredits.filter(c => c.clienteId !== clienteId);
    return { success: true };
}

export async function createClientAndCredit(formData: FormData, onProgress: (progress: number) => void) {
    const cobradorIdCookie = cookies().get('loggedInUser');
    if (!cobradorIdCookie) return { error: "No se pudo identificar al cobrador." };

    const cobrador = findUserById(cobradorIdCookie.value);
    if (!cobrador || cobrador.role !== 'cobrador') return { error: "Acción no autorizada." };
    
    const providerId = cobrador.providerId;
    if(!providerId) return { error: "El cobrador no tiene un proveedor asociado." };

    const rawData = Object.fromEntries(formData.entries());
    const validatedFields = ClientCreditSchema.safeParse(rawData);

    if (!validatedFields.success) {
        console.error(validatedFields.error.flatten().fieldErrors);
        return { error: "Datos del formulario inválidos." };
    }
    
    const { idNumber, name, creditAmount, installments } = validatedFields.data;

    // Simulate file upload progress
    onProgress(25);
    await new Promise(resolve => setTimeout(resolve, 250));
    onProgress(50);
    await new Promise(resolve => setTimeout(resolve, 250));
    onProgress(75);
    await new Promise(resolve => setTimeout(resolve, 250));
    
    // Check if client user already exists
    if (!findUserByIdNumber(idNumber)) {
        const newClientUser = {
            id: (mockUsers.length + 1).toString(),
            idNumber,
            name,
            password: 'password123', // Default password
            role: 'cliente',
            providerId,
            createdAt: new Date().toISOString()
        };
        mockUsers.push(newClientUser);
    }
    
    const newCredit = {
        id: `cred${mockCredits.length + 1}`,
        clienteId: idNumber,
        clienteName: name,
        cobradorId: cobrador.idNumber,
        providerId,
        valor: parseFloat(creditAmount.replace(/\\./g, '').replace(',', '.')),
        cuotas: parseInt(installments, 10),
        fecha: new Date().toISOString(),
        estado: 'Activo'
    };
    mockCredits.push(newCredit);
    
    onProgress(100);

    return { success: true };
}
