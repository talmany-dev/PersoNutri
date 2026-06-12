-- Spec 02 — Anamnese de Treino
-- Depende de: users

create type nivel_treino_enum   as enum ('iniciante', 'intermediario', 'avancado');
create type divisao_treino_enum as enum ('fullbody', 'upper_lower', 'push_pull_legs', 'bro_split');

create table anamneses_treino (
  id                    uuid primary key default uuid_generate_v4(),
  user_id               uuid not null references users(id) on delete cascade,

  -- Experiência
  experiencia_anos      numeric(4,1) not null check (experiencia_anos >= 0),
  nivel_treino          nivel_treino_enum not null,   -- derivado: <1=iniciante, 1-3=intermediario, >3=avancado

  -- Logística
  dias_por_semana       smallint not null check (dias_por_semana between 2 and 6),
  duracao_sessao_min    smallint not null check (duracao_sessao_min between 30 and 120),

  -- Estrutura
  divisao_preferida     divisao_treino_enum,
  equipamentos          text[] not null default '{}',  -- ex: ['academia_completa', 'casa_halteres']

  -- Histórico clínico (opcional)
  historico_lesoes      text,
  restricoes_fisicas    text,

  -- Preferências (opcional)
  preferencias          text,
  objetivo_especifico   text,

  -- Soft delete + auditoria
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),
  deleted_at            timestamptz,

  -- Um usuário tem exatamente uma anamnese ativa
  constraint uq_anamnese_user unique (user_id)
);

create index idx_anamneses_treino_user on anamneses_treino (user_id) where deleted_at is null;

create trigger trg_anamneses_treino_updated_at
  before update on anamneses_treino
  for each row execute function set_updated_at();

alter table anamneses_treino enable row level security;

create policy "anamnese_treino: leitura própria"
  on anamneses_treino for select
  using (auth.uid() = user_id);

create policy "anamnese_treino: inserção própria"
  on anamneses_treino for insert
  with check (auth.uid() = user_id);

create policy "anamnese_treino: atualização própria"
  on anamneses_treino for update
  using (auth.uid() = user_id);
