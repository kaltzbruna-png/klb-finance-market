/*
 * Copie a URL do projeto e a chave anon em Supabase > Project Settings > API.
 * Nunca use a service_role key no navegador.
 *
 * MOCK_MODE é útil apenas para testar a interface localmente sem Supabase.
 * Deixe false ao publicar.
 */
globalThis.KLB_CONFIG = {
  SUPABASE_URL: "https://mnluxgxuthrkygauvdde.supabase.co",
  SUPABASE_ANON_KEY: "sb_publishable_8Wjycoxor7AdsfOzSYmqvQ_cTAbKdOi",
  VAPID_PUBLIC_KEY: "BI5P95iMOSUimsMytg3p6ctkLoVO63aofjyJvQWh9awIkwi0yK14vO8Lu-r3XRZI993C3HKE8JGxj5dbksmc3Fs",
  MOCK_MODE: false
};
