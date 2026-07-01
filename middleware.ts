import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })
  const path = request.nextUrl.pathname

  try {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return request.cookies.getAll() },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
            supabaseResponse = NextResponse.next({ request })
            cookiesToSet.forEach(({ name, value, options }) =>
              supabaseResponse.cookies.set(name, value, options)
            )
          },
        },
      }
    )

    // Refresh session cookie on every request
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    // Protect /admin
    if (path.startsWith('/admin')) {
      // Not logged in → go to login
      if (userError || !user) {
        return NextResponse.redirect(new URL(`/login?redirect=${path}`, request.url))
      }
      // Logged in — check role in profiles table
      const { data: profile, error: profileError } = await supabase
        .from('profiles').select('role').eq('id', user.id).single()

      // If query failed, profile missing, or not admin → block
      if (profileError || !profile || profile.role !== 'admin') {
        return NextResponse.redirect(new URL('/?error=unauthorized', request.url))
      }
    }

    // Protect /checkout and /account
    if (path.startsWith('/checkout') || path.startsWith('/account')) {
      if (userError || !user) {
        return NextResponse.redirect(new URL(`/login?redirect=${path}`, request.url))
      }
    }

    // Protect /artisan — artisan role only
    if (path.startsWith('/artisan')) {
      if (userError || !user) {
        return NextResponse.redirect(new URL(`/login?redirect=${path}`, request.url))
      }
      const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
      if (!profile || (profile.role !== 'artisan' && profile.role !== 'admin')) {
        return NextResponse.redirect(new URL('/?error=unauthorized', request.url))
      }
    }

  } catch (err) {
    // Fail-secure: if middleware crashes, block access to protected routes
    console.error('Middleware error:', err)
    if (path.startsWith('/admin')) {
      return NextResponse.redirect(new URL('/?error=unauthorized', request.url))
    }
    if (path.startsWith('/checkout') || path.startsWith('/account')) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
