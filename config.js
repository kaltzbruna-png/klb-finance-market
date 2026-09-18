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
  MOCK_MODE: false
};
