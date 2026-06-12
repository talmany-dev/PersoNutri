-- Spec 01 — Perfil do Usuário
-- Tabela raiz. Todas as outras tabelas referenciam users.id

create extension if not exists "uuid-ossp";

create type objetivo_enum        as enum ('bulk', 'recomp', 'cut');
create type nivel_atividade_enum as enum ('sedentario', 'leve', 'moderado', 'ativo', 'muito_ativo');
create type sexo_biologico_enum  as enum ('M', 'F');

create table users (
  id                  uuid primary key default uuid_generate_v4(),

  -- Identificação
  nome                text        not null,
  email               text        not null unique,
  senha_hash          text        not null,  -- armazenado via Supabase Auth / bcrypt

  -- Dados físicos
  peso_kg             numeric(5,2) not null check (peso_kg  between 30  and 300),
  altura_cm           numeric(5,1) not null check (altura_cm between 100 and 250),
  idade               smallint    not null check (idade between 14 and 90),
  sexo_biologico      sexo_biologico_enum  not null,
  percentual_gordura  numeric(4,1)          check (percentual_gordura between 3 and 60),

  -- Objetivos
  objetivo            objetivo_enum        not null,
  nivel_atividade     nivel_atividade_enum not null,

  -- Metas calculadas (derivadas — atualizadas sempre que dados físicos mudam)
  tmb                 integer not null,          -- kcal/dia — Mifflin-St Jeor ou Katch-McArdle
  tdee                integer not null,          -- kcal/dia — TMB × fator atividade
  meta_calorica       integer not null,          -- kcal/dia — TDEE ± ajuste objetivo
  proteina_g          integer not null,          -- g/dia — peso × 2.0/2.5/2.8 conforme objetivo
  gordura_g           integer not null,          -- g/dia — peso × 1.0
  carboidrato_g       integer not null,          -- g/dia — (meta - prot*4 - gord*9) / 4

  -- Soft delete + auditoria
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  deleted_at          timestamptz
);

-- Índice para soft delete queries
create index idx_users_deleted_at on users (deleted_at) where deleted_at is null;

-- Trigger para manter updated_at atualizado
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_users_updated_at
  before update on users
  for each row execute function set_updated_at();

-- RLS (Row Level Security) — cada usuário só vê seus próprios dados
alter table users enable row level security;

create policy "users: leitura própria"
  on users for select
  using (auth.uid() = id);

create policy "users: inserção própria"
  on users for insert
  with check (auth.uid() = id);

create policy "users: atualização própria"
  on users for update
  using (auth.uid() = id);
