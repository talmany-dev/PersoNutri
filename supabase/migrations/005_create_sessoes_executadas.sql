-- Spec 04 — Sessão de Treino (execução)
-- Tabelas: sessoes_executadas, series_executadas

create type status_sessao_exec_enum as enum ('em_andamento', 'concluida', 'abandonada');

-- Registro de uma sessão sendo executada
create table sessoes_executadas (
  id                  uuid primary key default uuid_generate_v4(),
  user_id             uuid not null references users(id) on delete cascade,
  sessao_plano_id     uuid not null references sessoes_plano(id),

  iniciada_em         timestamptz not null default now(),
  finalizada_em       timestamptz,
  duracao_min         smallint,               -- calculado ao finalizar
  status              status_sessao_exec_enum not null default 'em_andamento',

  -- Score de qualidade da sessão (calculado ao finalizar)
  score_qualidade     numeric(3,1),           -- 0–10, baseado em RIR médio e volume

  notas               text,

  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  deleted_at          timestamptz
);

create index idx_sess_exec_user on sessoes_executadas (user_id, iniciada_em desc) where deleted_at is null;
create index idx_sess_exec_plano on sessoes_executadas (sessao_plano_id);

create trigger trg_sessoes_executadas_updated_at
  before update on sessoes_executadas
  for each row execute function set_updated_at();

-- Séries executadas (um registro por série de cada exercício)
create table series_executadas (
  id                      uuid primary key default uuid_generate_v4(),
  sessao_executada_id     uuid not null references sessoes_executadas(id) on delete cascade,
  exercicio_sessao_id     uuid not null references exercicios_sessao(id),

  serie_num               smallint not null check (serie_num >= 1),
  carga_kg                numeric(6,2) not null check (carga_kg >= 0),
  reps                    smallint not null check (reps >= 1),
  rir                     smallint not null check (rir between 0 and 10),  -- Reps in Reserve realizado

  -- Progressão dupla: calculado após completar todas as séries do exercício
  sugestao_progressao     text,    -- 'manter' | 'aumentar_carga' | 'aumentar_reps' | 'reduzir_carga'
  delta_carga_sugerido    numeric(4,2),  -- ex: +2.5, -5.0

  completada              boolean not null default true,
  executada_em            timestamptz not null default now(),

  created_at              timestamptz not null default now()
);

create index idx_series_exec_sessao on series_executadas (sessao_executada_id);
create index idx_series_exec_exercicio on series_executadas (exercicio_sessao_id);

-- RLS
alter table sessoes_executadas enable row level security;
alter table series_executadas  enable row level security;

create policy "sessoes_exec: leitura própria"
  on sessoes_executadas for select using (auth.uid() = user_id);
create policy "sessoes_exec: inserção própria"
  on sessoes_executadas for insert with check (auth.uid() = user_id);
create policy "sessoes_exec: atualização própria"
  on sessoes_executadas for update using (auth.uid() = user_id);

create policy "series_exec: leitura via sessão"
  on series_executadas for select
  using (exists (
    select 1 from sessoes_executadas se
    where se.id = sessao_executada_id and se.user_id = auth.uid()
  ));
create policy "series_exec: inserção via sessão"
  on series_executadas for insert
  with check (exists (
    select 1 from sessoes_executadas se
    where se.id = sessao_executada_id and se.user_id = auth.uid()
  ));
