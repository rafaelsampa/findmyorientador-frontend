import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://qvkusovgjpypphdxxpoa.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_pTkWBvEB8E5xuzSNwrDycw_ul11s2IY";

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    storage: typeof window !== "undefined" ? window.localStorage : undefined,
  },
});

export type UserRole = "aluno" | "orientador";
