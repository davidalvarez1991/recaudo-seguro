
import 'server-only'
import { cookies } from 'next/headers'
import { getUserData } from './actions'

const ADMIN_ID = "admin_0703091991";

type User = {
    [key: string]: any;
} | null

type AuthResult = {
    userId: string | null,
    user: User,
    role: string | null
}

export async function getAuthenticatedUser(): Promise<AuthResult> {
    const cookieStore = cookies()
    const userId = cookieStore.get('loggedInUser')?.value
    const role = cookieStore.get('userRole')?.value
    
    if (!userId || !role) {
        return { userId: null, user: null, role: null }
    }

    if (userId === ADMIN_ID && role === 'admin') {
        const adminUser = {
            id: ADMIN_ID,
            name: 'Administrador',
            role: 'admin'
        }
        return { userId: ADMIN_ID, user: adminUser, role: 'admin' }
    }

    const user = await getUserData(userId);
    if (!user || user.role !== role) {
        // Clear potentially invalid cookies
        cookieStore.set('loggedInUser', '', { expires: new Date(0), path: '/' });
        cookieStore.set('userRole', '', { expires: new Date(0), path: '/' });
        return { userId: null, user: null, role: null }
    }

    return { userId, user, role: user.role }
}
