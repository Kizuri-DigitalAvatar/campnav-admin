import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function proxy(request: NextRequest) {
    const session = request.cookies.get('campnav_admin_session')
    const { pathname } = request.nextUrl

    // Helper to check if session is valid JSON
    const isValidSession = session && session.value && session.value.startsWith('{')

    // Define public paths that don't require authentication
    const isPublicPath =
        pathname === '/login' ||
        pathname.startsWith('/_next') ||
        pathname.startsWith('/api') ||
        pathname.includes('.')

    // 1. If user is authenticated and visits /login, redirect to Dashboard
    if (isValidSession && pathname === '/login') {
        return NextResponse.redirect(new URL('/', request.url))
    }

    // 2. If user is NOT authenticated and visits a protected path, redirect to /login
    if (!isValidSession && !isPublicPath) {
        // Clear the invalid session cookie if it exists
        const response = NextResponse.redirect(new URL('/login', request.url))
        if (session) response.cookies.delete('campnav_admin_session')
        return response
    }

    // 3. Role-based access control
    if (isValidSession) {
        try {
            const sessionData = JSON.parse(session!.value)
            const userRole = sessionData.role

            const restrictedPaths = ['/users', '/access-control']
            if (userRole !== 'camp_manager' && restrictedPaths.some(path => pathname === path || pathname.startsWith(path + '/'))) {
                return NextResponse.redirect(new URL('/', request.url))
            }
        } catch (e) {
            console.error("Middleware session parse error:", e)
            const response = NextResponse.redirect(new URL('/login', request.url))
            response.cookies.delete('campnav_admin_session')
            return response
        }
    }

    return NextResponse.next()
}

export const config = {
    matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
