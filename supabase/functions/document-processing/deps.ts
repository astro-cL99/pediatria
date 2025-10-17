// Standard library
// @deno-types="https://deno.land/x/types/deno.d.ts"
export { serve } from "https://deno.land/std@0.200.0/http/server.ts";

// Third-party dependencies
export { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";

// Re-export common types
export type { RequestEvent } from "https://deno.land/x/sift@0.6.0/mod.ts";
