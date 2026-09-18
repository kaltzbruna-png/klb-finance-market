# KLB Finance Market

Mercado, conta compartilhada e conta pessoal para duas pessoas, em tempo real.

Não há conta nem login: cada casa usa um código de seis caracteres, presente no link. O nome no link identifica a pessoa; os lançamentos pessoais são sempre filtrados por código da casa e nome.

## Rodar localmente

Este é um site estático, sem instalação ou build. Sirva a pasta com qualquer servidor HTTP:

```bash
python3 -m http.server 43123
```

Abra `http://localhost:43123`.

## Configurar Supabase

1. Crie um projeto no [Supabase](https://supabase.com).
2. Execute [`supabase/schema.sql`](supabase/schema.sql) no SQL Editor.
3. Em `config.js`, preencha `SUPABASE_URL` e `SUPABASE_ANON_KEY` com os valores em **Project Settings → API**.
4. Mantenha `MOCK_MODE: false` para usar a sincronização real.

Para experimentar a interface sem um projeto Supabase, defina temporariamente `MOCK_MODE: true`. Os dados de demonstração ficam apenas no `localStorage` deste navegador.

> A chave `anon` é própria para o navegador; nunca coloque uma chave `service_role` neste arquivo.

## Publicar na Vercel

Importe este repositório na Vercel ou execute:

```bash
npx vercel
```

Antes de publicar, preencha as chaves em `config.js` (ou gere uma versão desse arquivo no seu processo de deploy). `vercel.json` garante que o service worker não fique preso em cache antigo.

## Estrutura

- `index.html` — interface, estilo e lógica da aplicação
- `config.js` — URL/chave anônima do Supabase e modo de demonstração
- `supabase/schema.sql` — tabelas, RLS, trigger e publicação Realtime
- `manifest.json`, `sw.js`, `icons/` — PWA instalável
