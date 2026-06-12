-- Spec 06 — Diário Alimentar

create type refeicao_enum as enum (
  'cafe_manha', 'lanche_manha', 'almoco', 'lanche_tarde', 'jantar', 'ceia'
);

create table diario_alimentar (
  id                  uuid primary key default uuid_generate_v4(),
  user_id             uuid not null references users(id) on delete cascade,
  alimento_id         uuid not null references alimentos(id),

  data                date not null default current_date,
  refeicao            refeicao_enum not null,

  -- Quantidade registrada
  quantidade_g        numeric(7,2) not null check (quantidade_g > 0),

  -- Valores nutricionais calculados (quantidade_g / 100 × valor_100g)
  calorias            numeric(7,2) not null,
  proteina_g          numeric(6,2) not null,
  carboidrato_g       numeric(6,2) not null,
  gordura_g           numeric(6,2) not null,

  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  deleted_at          timestamptz
);

create index idx_diario_user_data on diario_alimentar (user_id, data desc) where deleted_at is null;
create index idx_diario_refeicao  on diario_alimentar (user_id, data, refeicao) where deleted_at is null;

create trigger trg_diario_alimentar_updated_at
  before update on diario_alimentar
  for each row execute function set_updated_at();

alter table diario_alimentar enable row level security;

create policy "diario: leitura própria"
  on diario_alimentar for select using (auth.uid() = user_id);
create policy "diario: inserção própria"
  on diario_alimentar for insert with check (auth.uid() = user_id);
create policy "diario: atualização própria"
  on diario_alimentar for update using (auth.uid() = user_id);
create policy "diario: remoção própria"
  on diario_alimentar for delete using (auth.uid() = user_id);
