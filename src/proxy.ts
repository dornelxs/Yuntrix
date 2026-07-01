import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

const ADMIN_ONLY_ROUTES = ['/importar', '/relatorios', '/equipe', '/nichos']
const ROTAS_PUBLICAS = ['/login', '/recuperar-senha', '/atualizar-senha']

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl

  if (!user && !ROTAS_PUBLICAS.includes(pathname) && !pathname.startsWith('/auth/')) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  if (user) {
    const { data: perfil } = await supabase
      .from('users')
      .select('role, ativo')
      .eq('id', user.id)
      .single()

    if (perfil?.ativo === false) {
      await supabase.auth.signOut()
      return NextResponse.redirect(new URL('/login', request.url))
    }

    const isAdminRoute = ADMIN_ONLY_ROUTES.some((rota) => pathname.startsWith(rota))
    if (isAdminRoute && perfil?.role !== 'admin') {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  }

  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.png$).*)'],
}
