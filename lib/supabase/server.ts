import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "@/types/database.types";

/**
 * Server-side Supabase client — for Server Components, Server Actions, and
 * Route Handlers. Reads/writes the session via Next.js cookies, so RLS is
 * enforced using the logged-in user's identity.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // Called from a Server Component — safe to ignore since
            // middleware handles session refresh on every request.
          }
        },
      },
    }
  );
}

/**
 * Admin client using the service-role key. SERVER-ONLY — never import this
 * from a Client Component or expose the key via NEXT_PUBLIC_*. Used only for
 * operations RLS can't express for the current user, e.g. full account
 * deletion (auth.admin.deleteUser).
 */
export async function createAdminClient() {
  const { createClient: createSupabaseClient } = await import("@supabase/supabase-js");
  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}
