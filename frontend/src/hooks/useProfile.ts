import { useAuth } from "@/hooks/use-auth";

/**
 * Thin wrapper around the AuthProvider context, exposing the current session,
 * the user's profile row and loading state. Both profile screens use this hook
 * for role checks and to render the header info.
 */
export function useProfile() {
  const { session, profile, loading } = useAuth();
  return { session, profile, loading, error: null as null | string };
}
