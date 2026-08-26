import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// ---------------------------------------------------------------------------
// MIDDLEWARE DE AUTENTICAÇÃO — BUG 02 CORRIGIDO
// ---------------------------------------------------------------------------

// O middleware protege as rotas:
// - /dashboard
// - /criar-personagem
// - /personagem
//
// Se o usuário NÃO estiver logado, será redirecionado para /login.
// Se estiver logado, poderá acessar normalmente.
// ---------------------------------------------------------------------------

export function middleware(request: NextRequest) {
  // Verifica se existe o cookie de sessão
  const token = request.cookies.get("__session")?.value;

  // Lista de rotas que precisam de autenticação
  const rotasProtegidas = [
    "/dashboard",
    "/criar-personagem",
    "/personagem",
  ];

  // Verifica se o usuário está tentando acessar uma rota protegida
  const estaNaRotaProtegida = rotasProtegidas.some((r) =>
    request.nextUrl.pathname.startsWith(r)
  );

  // Se estiver em uma rota protegida
  if (estaNaRotaProtegida) {
    // Se NÃO possuir sessão, redireciona para o login
    if (!token) {
      return NextResponse.redirect(
        new URL("/login", request.url)
      );
    }
  }

  // Permite continuar normalmente
  return NextResponse.next();
}

// Define quais rotas serão verificadas pelo middleware
export const config = {
  matcher: [
    "/dashboard/:path*",
    "/criar-personagem/:path*",
    "/personagem/:path*",
  ],
};