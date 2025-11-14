import { createClient } from "@supabase/supabase-js";

let realtimeClient = null;

export function getRealtimeClient() {
  const url = import.meta.env.VITE_SUPABASE_URL;
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  if (!realtimeClient) {
    realtimeClient = createClient(url, key, {
      realtime: {
        params: { eventsPerSecond: 2 },
      },
      auth: { persistSession: false },
    });
  }
  return realtimeClient;
}
