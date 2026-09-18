-- KLB Finance Market
-- Execute no SQL Editor do seu projeto Supabase.

create table if not exists public.listas (
  codigo text primary key check (codigo ~ '^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{6}$'),
  created_at timestamptz not null default now()
);

create table if not exists public.itens_lista (
  id uuid primary key default gen_random_uuid(),
  lista_codigo text not null references public.listas(codigo) on delete cascade,
  nome text not null check (char_length(nome) between 1 and 60),
  quantidade numeric(8,2) not null default 1 check (quantidade > 0),
  adicionado_por text not null check (char_length(adicionado_por) between 1 and 30),
  comprado boolean not null default false,
  comprado_por text check (comprado_por is null or char_length(comprado_por) between 1 and 30),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.despesas_compartilhadas (
  id uuid primary key default gen_random_uuid(),
  lista_codigo text not null references public.listas(codigo) on delete cascade,
  descricao text not null check (char_length(descricao) between 1 and 60),
  valor numeric(12,2) not null check (valor > 0),
  pago_por text not null check (char_length(pago_por) between 1 and 30),
  data date not null default current_date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.despesas_pessoais (
  id uuid primary key default gen_random_uuid(),
  lista_codigo text not null references public.listas(codigo) on delete cascade,
  dono text not null check (char_length(dono) between 1 and 30),
  descricao text not null check (char_length(descricao) between 1 and 60),
  valor numeric(12,2) not null check (valor > 0),
  data date not null default current_date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.atualiza_itens_lista_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists itens_lista_updated_at on public.itens_lista;
create trigger itens_lista_updated_at
before update on public.itens_lista
for each row execute function public.atualiza_itens_lista_updated_at();

drop trigger if exists despesas_compartilhadas_updated_at on public.despesas_compartilhadas;
create trigger despesas_compartilhadas_updated_at
before update on public.despesas_compartilhadas
for each row execute function public.atualiza_itens_lista_updated_at();

drop trigger if exists despesas_pessoais_updated_at on public.despesas_pessoais;
create trigger despesas_pessoais_updated_at
before update on public.despesas_pessoais
for each row execute function public.atualiza_itens_lista_updated_at();

alter table public.listas enable row level security;
alter table public.itens_lista enable row level security;
alter table public.despesas_compartilhadas enable row level security;
alter table public.despesas_pessoais enable row level security;

-- O código compartilhado é o segredo desta aplicação, por isso a anon key
-- recebe acesso aberto às duas tabelas. Não use este modelo para dados sensíveis.
drop policy if exists "anon pode acessar listas" on public.listas;
create policy "anon pode acessar listas" on public.listas
  for all to anon using (true) with check (true);

drop policy if exists "anon pode acessar itens" on public.itens_lista;
create policy "anon pode acessar itens" on public.itens_lista
  for all to anon using (true) with check (true);

drop policy if exists "anon pode acessar despesas compartilhadas" on public.despesas_compartilhadas;
create policy "anon pode acessar despesas compartilhadas" on public.despesas_compartilhadas
  for all to anon using (true) with check (true);

-- Sem Supabase Auth, a RLS não consegue confirmar que o campo dono pertence
-- ao dispositivo. O app sempre filtra por lista_codigo + dono e grava dono
-- para que esta policy possa ser endurecida ao introduzir autenticação.
drop policy if exists "anon pode acessar despesas pessoais" on public.despesas_pessoais;
create policy "anon pode acessar despesas pessoais" on public.despesas_pessoais
  for all to anon using (true) with check (true);

alter publication supabase_realtime add table public.itens_lista;
alter publication supabase_realtime add table public.despesas_compartilhadas;
alter publication supabase_realtime add table public.despesas_pessoais;
