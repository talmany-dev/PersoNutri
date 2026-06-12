-- Spec 05 — Check-in Diário
-- Um check-in por usuário por dia (constraint unique)

create table checkins (
  id                  uuid primary key default uuid_generate_v4(),
  user_id             uuid not null references users(id) on delete cascade,

  -- Data do check-in (não timestamptz — é sobre O DIA, não o momento)
  data                date not null default current_date,

  -- Métricas subjetivas (1–10)
  qualidade_sono      smallint not null check (qualidade_sono between 1 and 10),
  energia             smallint not null check (energia between 1 and 10),
  dor_muscular        smallint not null check (dor_muscular between 0 and 10),  -- 0 = sem dor

  -- Sono quantitativo
  horas_sono          numeric(3,1) not null check (horas_sono between 0 and 24),

  -- Peso (opcional — nem todo dia o usuário pesa)
  peso_kg             numeric(5,2) check (peso_kg between 30 and 300),

  -- Score de recuperação calculado (0–10)
  -- Fórmula: qualidade*0.4 + energia*0.3 + (10-dor)*0.2 + min(horas/8,1)*10*0.1
  score_recuperacao   numeric(3,1) not null check (score_recuperacao between 0 and 10),

  notas               text,

  -- Soft delete + auditoria
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  deleted_at          timestamptz,

  -- Apenas um check-in ativo por usuário por dia
  constraint uq_checkin_user_data unique (user_id, data)
);

create index idx_checkins_user_data on checkins (user_id, data desc) where deleted_at is null;

create trigger trg_checkins_updated_at
  before update on checkins
  for each row execute function set_updated_at();

alter table checkins enable row level security;

create policy "checkins: leitura própria"
  on checkins for select using (auth.uid() = user_id);
create policy "checkins: inserção própria"
  on checkins for insert with check (auth.uid() = user_id);
create policy "checkins: atualização própria"
  on checkins for update using (auth.uid() = user_id);
