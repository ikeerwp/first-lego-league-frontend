/ ============================================================
// PATRÓN STRATEGY — AuthProvider
// ============================================================
//
// Componentes del patrón:
//   • AuthStrategy      → interfaz Strategy
//   • ServerAuthStrategy, ClientAuthStrategy
//                       → ConcreteStrategy
//   • halClient.ts      → Context (usa la estrategia sin conocer su detalle)
// ============================================================

export const AUTH_COOKIE_NAME = "APP_AUTH";

// ------------------------------------------------------------------
// Strategy (interfaz)
// ------------------------------------------------------------------
export interface AuthStrategy {
  getAuth(): Promise<string | null>;
}

// ------------------------------------------------------------------
// ConcreteStrategy A — Lee la cookie desde el servidor (Next.js SSR)
// ------------------------------------------------------------------
export class ServerAuthStrategy implements AuthStrategy {
  async getAuth(): Promise<string | null> {
    const { cookies } = await import("next/headers");
    const cookieStore = await cookies();
    return cookieStore.get(AUTH_COOKIE_NAME)?.value ?? null;
  }
}

// ------------------------------------------------------------------
// ConcreteStrategy B — Lee la cookie / localStorage desde el cliente
// ------------------------------------------------------------------
export class ClientAuthStrategy implements AuthStrategy {
  async getAuth(): Promise<string | null> {
    const cookie = new RegExp(`${AUTH_COOKIE_NAME}=([^;]+)`).exec(
      document.cookie
    )?.[1];
    if (cookie) return decodeURIComponent(cookie);
    return localStorage.getItem(AUTH_COOKIE_NAME) ?? null;
  }
}

// ------------------------------------------------------------------
// Factories de conveniencia (compatibilidad con el código existente)
// ------------------------------------------------------------------

/** Para uso en Server Components / API routes de Next.js */
export const serverAuthProvider: AuthStrategy = new ServerAuthStrategy();

/** Para uso en Client Components */
export function clientAuthProvider(): AuthStrategy {
  return new ClientAuthStrategy();
}
