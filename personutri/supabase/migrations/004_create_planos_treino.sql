-- Spec 03 — Plano de Treino IA
-- Tabelas: planos_treino, sessoes_plano, exercicios_sessao

create type status_plano_enum as enum ('ativo', 'pausado', 'concluido', 'arquivado');

-- Plano mestre (gerado pela IA)
create table planos_treino (
  id                  uuid primary key default uuid_generate_v4(),
  user_id             uuid not null references users(id) on delete cascade,

  nome                text not null,                  -- ex: "PPL Upper/Lower - Rafael"
  divisao             divisao_treino_enum not null,
  semanas_previstas   smallint not null default 12,
  status              status_plano_enum not null default 'ativo',

  -- Metadados de geração IA
  gerado_por_ia       boolean not null default true,
  prompt_utilizado    text,                           -- prompt enviado ao Claude
  modelo_ia           text,                           -- ex: 'claude-sonnet-4-6'
  versao              smallint not null default 1,    -- increments on regeneration

  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  deleted_at          timestamptz
);

-- Só um plano ativo por usuário
create unique index idx_planos_ativo_por_user
  on planos_treino (user_id)
  where status = 'ativo' and deleted_at is null;

create trigger trg_planos_treino_updated_at
  before update on planos_treino
  for each row execute function set_updated_at();

-- Sessões do plano (dias da semana)
create table sessoes_plano (
  id                  uuid primary key default uuid_generate_v4(),
  plano_id            uuid not null references planos_treino(id) on delete cascade,

  nome                text not null,                  -- ex: "Push A — Peito + Tríceps"
  dia_semana          smallint not null check (dia_semana between 0 and 6),  -- 0=Dom…6=Sab
  eh_descanso         boolean not null default false,
  grupos_musculares   text[] not null default '{}',  -- ex: ['peito','triceps']
  ordem               smallint not null default 1,

  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create index idx_sessoes_plano_plano on sessoes_plano (plano_id);

create trigger trg_sessoes_plano_updated_at
  before update on sessoes_plano
  for each row execute function set_updated_at();

-- Exercícios de cada sessão (prescrição)
create table exercicios_sessao (
  id                  uuid primary key default uuid_generate_v4(),
  sessao_id           uuid not null references sessoes_plano(id) on delete cascade,
  exercicio_id        uuid not null references exercicios(id),

  series              smallint not null default 3,
  reps_min            smallint not null default 8,
  reps_max            smallint not null default 12,
  rir_alvo            smallint not null default 2,
  tempo_descanso_s    smallint not null default 120,  -- segundos

  -- Progressão
  progressao_tipo     text not null default 'dupla',  -- 'dupla' = double progression
  carga_inicial_kg    numeric(6,2),

  ordem               smallint not null default 1,

  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create index idx_ex_sessao_sessao on exercicios_sessao (sessao_id);

create trigger trg_exercicios_sessao_updated_at
  before update on exercicios_sessao
  for each row execute function set_updated_at();

-- RLS para planos (usuário vê apenas seus planos)
alter table planos_treino   enable row level security;
alter table sessoes_plano   enable row level security;
alter table exercicios_sessao enable row level security;

create policy "planos: leitura própria"
  on planos_treino for select using (auth.uid() = user_id);
create policy "planos: inserção própria"
  on planos_treino for insert with check (auth.uid() = user_id);
create policy "planos: atualização própria"
  on planos_treino for update using (auth.uid() = user_id);

create policy "sessoes_plano: leitura via plano"
  on sessoes_plano for select
  using (exists (select 1 from planos_treino p where p.id = plano_id and p.user_id = auth.uid()));

create policy "exercicios_sessao: leitura via sessão"
  on exercicios_sessao for select
  using (exists (
    select 1 from sessoes_plano s
    join planos_treino p on p.id = s.plano_id
    where s.id = sessao_id and p.user_id = auth.uid()
  ));

-- exercicios é catálogo público (leitura para todos autenticados)
alter table exercicios enable row level security;
create policy "exercicios: leitura pública autenticada"
  on exercicios for select using (auth.role() = 'authenticated');
