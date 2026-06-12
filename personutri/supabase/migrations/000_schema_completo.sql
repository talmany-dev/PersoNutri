-- ============================================================
-- PersoNutri — Schema Completo
-- Cole este arquivo inteiro no SQL Editor do Supabase
-- Dashboard → SQL Editor → New query → Cole → Run
-- ============================================================

-- ─── Extensões ───────────────────────────────────────────────
create extension if not exists "uuid-ossp";

-- ─── Função auxiliar updated_at ──────────────────────────────
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ─── Enums ───────────────────────────────────────────────────
create type objetivo_enum            as enum ('bulk', 'recomp', 'cut');
create type nivel_atividade_enum     as enum ('sedentario', 'leve', 'moderado', 'ativo', 'muito_ativo');
create type sexo_biologico_enum      as enum ('M', 'F');
create type nivel_treino_enum        as enum ('iniciante', 'intermediario', 'avancado');
create type divisao_treino_enum      as enum ('fullbody', 'upper_lower', 'push_pull_legs', 'bro_split');
create type status_plano_enum        as enum ('ativo', 'pausado', 'concluido', 'arquivado');
create type status_sessao_exec_enum  as enum ('em_andamento', 'concluida', 'abandonada');
create type grupo_muscular_enum      as enum ('peito','costas','ombros','biceps','triceps','quadriceps','posteriores','gluteos','panturrilhas','abdomen','trapezio','antebraco');
create type padrao_movimento_enum    as enum ('empurrar_horizontal','empurrar_vertical','puxar_horizontal','puxar_vertical','agachar','empurrar_quadril','carregar','rotacao','flexao_joelho','isolamento');
create type nivel_exercicio_enum     as enum ('iniciante','intermediario','avancado');
create type refeicao_enum            as enum ('cafe_manha','lanche_manha','almoco','lanche_tarde','jantar','ceia');

-- ─── 001 — Usuários ──────────────────────────────────────────
create table users (
  id                  uuid primary key references auth.users(id) on delete cascade,
  nome                text        not null,
  email               text        not null unique,
  peso_kg             numeric(5,2) not null check (peso_kg  between 30  and 300),
  altura_cm           numeric(5,1) not null check (altura_cm between 100 and 250),
  idade               smallint    not null check (idade between 14 and 90),
  sexo_biologico      sexo_biologico_enum  not null,
  percentual_gordura  numeric(4,1)         check (percentual_gordura between 3 and 60),
  objetivo            objetivo_enum        not null,
  nivel_atividade     nivel_atividade_enum not null,
  tmb                 integer not null,
  tdee                integer not null,
  meta_calorica       integer not null,
  proteina_g          integer not null,
  gordura_g           integer not null,
  carboidrato_g       integer not null,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  deleted_at          timestamptz
);

create index idx_users_deleted_at on users (deleted_at) where deleted_at is null;
create trigger trg_users_updated_at before update on users for each row execute function set_updated_at();
alter table users enable row level security;
create policy "users: leitura própria"    on users for select  using (auth.uid() = id);
create policy "users: inserção própria"   on users for insert  with check (auth.uid() = id);
create policy "users: atualização própria"on users for update  using (auth.uid() = id);

-- ─── 002 — Anamnese de Treino ─────────────────────────────────
create table anamneses_treino (
  id                    uuid primary key default uuid_generate_v4(),
  user_id               uuid not null references users(id) on delete cascade,
  experiencia_anos      numeric(4,1) not null check (experiencia_anos >= 0),
  nivel_treino          nivel_treino_enum not null,
  dias_por_semana       smallint not null check (dias_por_semana between 2 and 6),
  duracao_sessao_min    smallint not null check (duracao_sessao_min between 30 and 120),
  divisao_preferida     divisao_treino_enum,
  equipamentos          text[] not null default '{}',
  historico_lesoes      text,
  restricoes_fisicas    text,
  preferencias          text,
  objetivo_especifico   text,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),
  deleted_at            timestamptz,
  constraint uq_anamnese_user unique (user_id)
);

create index idx_anamneses_treino_user on anamneses_treino (user_id) where deleted_at is null;
create trigger trg_anamneses_treino_updated_at before update on anamneses_treino for each row execute function set_updated_at();
alter table anamneses_treino enable row level security;
create policy "anamnese_treino: leitura própria"    on anamneses_treino for select using (auth.uid() = user_id);
create policy "anamnese_treino: inserção própria"   on anamneses_treino for insert with check (auth.uid() = user_id);
create policy "anamnese_treino: atualização própria"on anamneses_treino for update using (auth.uid() = user_id);

-- ─── 003 — Exercícios ────────────────────────────────────────
create table exercicios (
  id                    uuid primary key default uuid_generate_v4(),
  nome                  text not null,
  nome_alternativo      text,
  grupo_muscular        grupo_muscular_enum not null,
  grupos_secundarios    grupo_muscular_enum[] default '{}',
  padrao_movimento      padrao_movimento_enum not null,
  nivel_dificuldade     nivel_exercicio_enum not null default 'intermediario',
  variacao_de           uuid references exercicios(id) on delete set null,
  equipamento_necessario text not null,
  requer_academia       boolean not null default true,
  series_min            smallint default 3,
  series_max            smallint default 4,
  reps_min              smallint default 8,
  reps_max              smallint default 12,
  rir_recomendado       smallint default 2,
  instrucoes            text,
  video_url             text,
  imagem_url            text,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),
  deleted_at            timestamptz
);

create index idx_exercicios_grupo    on exercicios (grupo_muscular)   where deleted_at is null;
create index idx_exercicios_padrao   on exercicios (padrao_movimento) where deleted_at is null;
create index idx_exercicios_variacao on exercicios (variacao_de)      where deleted_at is null;
create trigger trg_exercicios_updated_at before update on exercicios for each row execute function set_updated_at();
alter table exercicios enable row level security;
create policy "exercicios: leitura pública autenticada" on exercicios for select using (auth.role() = 'authenticated');
create policy "exercicios: admin pode inserir"          on exercicios for insert with check (auth.role() = 'authenticated');
create policy "exercicios: admin pode atualizar"        on exercicios for update using  (auth.role() = 'authenticated');

-- Seed exercícios (65 exercícios)
insert into exercicios (id, nome, grupo_muscular, grupos_secundarios, padrao_movimento, nivel_dificuldade, equipamento_necessario, series_min, series_max, reps_min, reps_max) values
-- PEITO
('00000000-0001-0000-0000-000000000000','Supino Reto com Barra',          'peito','{"triceps","ombros"}',    'empurrar_horizontal','intermediario','barra + rack',              3,4,6,10),
('00000000-0002-0000-0000-000000000000','Supino Reto com Halteres',       'peito','{"triceps","ombros"}',    'empurrar_horizontal','intermediario','halteres + banco',           3,4,8,12),
('00000000-0003-0000-0000-000000000000','Supino Inclinado com Barra',     'peito','{"triceps","ombros"}',    'empurrar_horizontal','intermediario','barra + banco inclinado',    3,4,6,10),
('00000000-0004-0000-0000-000000000000','Supino Inclinado com Halteres',  'peito','{"triceps","ombros"}',    'empurrar_horizontal','iniciante',    'halteres + banco',           3,4,8,12),
('00000000-0005-0000-0000-000000000000','Supino Declinado com Barra',     'peito','{"triceps"}',             'empurrar_horizontal','intermediario','barra + banco declinado',    3,4,6,10),
('00000000-0006-0000-0000-000000000000','Crossover no Cabo',              'peito','{}',                      'isolamento',         'iniciante',    'cabo',                       3,4,10,15),
('00000000-0007-0000-0000-000000000000','Fly com Halteres',               'peito','{}',                      'isolamento',         'iniciante',    'halteres + banco',           3,4,10,15),
('00000000-0008-0000-0000-000000000000','Peck Deck (Fly na Máquina)',     'peito','{}',                      'isolamento',         'iniciante',    'máquina peck deck',          3,4,10,15),
('00000000-0009-0000-0000-000000000000','Flexão de Braços',               'peito','{"triceps","ombros"}',    'empurrar_horizontal','iniciante',    'nenhum',                     3,4,10,20),
-- COSTAS
('00000000-0010-0000-0000-000000000000','Barra Fixa (Pegada Pronada)',        'costas','{"biceps","trapezio"}','puxar_vertical',   'intermediario','barra fixa',         3,4,5,10),
('00000000-0011-0000-0000-000000000000','Barra Fixa (Pegada Supinada)',       'costas','{"biceps"}',           'puxar_vertical',   'intermediario','barra fixa',         3,4,5,10),
('00000000-0012-0000-0000-000000000000','Puxada Frontal (Polia Alta)',        'costas','{"biceps"}',           'puxar_vertical',   'iniciante',    'polia alta',         3,4,8,12),
('00000000-0013-0000-0000-000000000000','Puxada Fechada (Triângulo)',         'costas','{"biceps"}',           'puxar_vertical',   'iniciante',    'polia alta',         3,4,8,12),
('00000000-0014-0000-0000-000000000000','Remada Curvada com Barra',          'costas','{"biceps","trapezio"}','puxar_horizontal', 'intermediario','barra',              3,4,6,10),
('00000000-0015-0000-0000-000000000000','Remada Unilateral com Haltere',     'costas','{"biceps"}',           'puxar_horizontal', 'iniciante',    'haltere + banco',    3,4,8,12),
('00000000-0016-0000-0000-000000000000','Remada na Polia Baixa (Triângulo)', 'costas','{"biceps"}',           'puxar_horizontal', 'iniciante',    'polia baixa',        3,4,8,12),
('00000000-0017-0000-0000-000000000000','Remada Cavalinho (T-Bar)',           'costas','{"biceps","trapezio"}','puxar_horizontal', 'intermediario','barra T',            3,4,6,10),
('00000000-0018-0000-0000-000000000000','Levantamento Terra Convencional',   'costas','{"gluteos","posteriores","quadriceps"}','empurrar_quadril','avancado','barra',   3,5,3,6),
('00000000-0019-0000-0000-000000000000','Levantamento Terra Romeno',         'costas','{"gluteos","posteriores"}','empurrar_quadril','intermediario','barra',            3,4,6,10),
('00000000-0020-0000-0000-000000000000','Pullover com Haltere',              'costas','{"peito"}',            'puxar_vertical',   'iniciante',    'haltere + banco',    3,4,10,15),
-- OMBROS
('00000000-0021-0000-0000-000000000000','Desenvolvimento com Barra (Militar)','ombros','{"triceps"}',         'empurrar_vertical','intermediario','barra',              3,4,6,10),
('00000000-0022-0000-0000-000000000000','Desenvolvimento com Halteres',       'ombros','{"triceps"}',         'empurrar_vertical','iniciante',    'halteres',           3,4,8,12),
('00000000-0023-0000-0000-000000000000','Desenvolvimento na Máquina (Smith)', 'ombros','{"triceps"}',         'empurrar_vertical','iniciante',    'smith machine',      3,4,8,12),
('00000000-0024-0000-0000-000000000000','Elevação Lateral com Halteres',      'ombros','{}',                  'isolamento',       'iniciante',    'halteres',           3,4,12,20),
('00000000-0025-0000-0000-000000000000','Elevação Lateral no Cabo',           'ombros','{}',                  'isolamento',       'iniciante',    'cabo',               3,4,12,20),
('00000000-0026-0000-0000-000000000000','Elevação Frontal com Halteres',      'ombros','{}',                  'isolamento',       'iniciante',    'halteres',           3,4,12,20),
('00000000-0027-0000-0000-000000000000','Encolhimento de Ombros (Trapézio)',  'trapezio','{"ombros"}',        'carregar',         'iniciante',    'halteres / barra',   3,4,10,15),
('00000000-0028-0000-0000-000000000000','Crucifixo Inverso (Deltoide Post.)','ombros','{"costas"}',           'puxar_horizontal', 'iniciante',    'halteres',           3,4,12,20),
-- BÍCEPS
('00000000-0030-0000-0000-000000000000','Rosca Direta com Barra',       'biceps','{}',           'isolamento','iniciante','barra / barra EZ',  3,4,8,12),
('00000000-0031-0000-0000-000000000000','Rosca Alternada com Haltere',  'biceps','{}',           'isolamento','iniciante','halteres',          3,4,8,12),
('00000000-0032-0000-0000-000000000000','Rosca Martelo',                'biceps','{"antebraco"}','isolamento','iniciante','halteres',          3,4,8,12),
('00000000-0033-0000-0000-000000000000','Rosca Concentrada',            'biceps','{}',           'isolamento','iniciante','haltere',           3,3,10,15),
('00000000-0034-0000-0000-000000000000','Rosca no Cabo (Polia Baixa)', 'biceps','{}',           'isolamento','iniciante','cabo',              3,4,10,15),
('00000000-0035-0000-0000-000000000000','Rosca Scott (Preacher Curl)', 'biceps','{}',           'isolamento','iniciante','barra EZ + banco',  3,4,8,12),
-- TRÍCEPS
('00000000-0040-0000-0000-000000000000','Tríceps Corda no Cabo',         'triceps','{}','isolamento',        'iniciante',    'cabo',              3,4,10,15),
('00000000-0041-0000-0000-000000000000','Tríceps Francês com Barra EZ',  'triceps','{}','isolamento',        'iniciante',    'barra EZ',          3,4,8,12),
('00000000-0042-0000-0000-000000000000','Tríceps Testa (Skull Crusher)', 'triceps','{}','isolamento',        'iniciante',    'barra EZ + banco',  3,4,8,12),
('00000000-0043-0000-0000-000000000000','Extensão de Tríceps Unilateral','triceps','{}','isolamento',        'iniciante',    'cabo / haltere',    3,4,10,15),
('00000000-0044-0000-0000-000000000000','Mergulho nas Paralelas (Dips)', 'triceps','{"peito","ombros"}','empurrar_vertical','intermediario','paralelas',3,4,6,12),
('00000000-0045-0000-0000-000000000000','Tríceps Coice com Haltere',     'triceps','{}','isolamento',        'iniciante',    'haltere',           3,3,12,15),
-- QUADRÍCEPS
('00000000-0050-0000-0000-000000000000','Agachamento Livre com Barra', 'quadriceps','{"gluteos","posteriores"}','agachar',   'intermediario','barra + rack',    3,5,4,8),
('00000000-0051-0000-0000-000000000000','Agachamento Goblet (Haltere)','quadriceps','{"gluteos"}',            'agachar',   'iniciante',    'haltere',         3,4,8,12),
('00000000-0052-0000-0000-000000000000','Agachamento Hack (Máquina)', 'quadriceps','{"gluteos"}',            'agachar',   'iniciante',    'hack squat',      3,4,8,12),
('00000000-0053-0000-0000-000000000000','Leg Press 45°',              'quadriceps','{"gluteos"}',            'agachar',   'iniciante',    'leg press 45°',   3,4,8,15),
('00000000-0054-0000-0000-000000000000','Cadeira Extensora',          'quadriceps','{}',                     'isolamento','iniciante',    'máquina extensora',3,4,10,15),
('00000000-0055-0000-0000-000000000000','Avanço com Halteres (Lunge)','quadriceps','{"gluteos","posteriores"}','agachar', 'intermediario','halteres',        3,4,8,12),
('00000000-0056-0000-0000-000000000000','Passada (Step Up) no Banco', 'quadriceps','{"gluteos"}',            'agachar',   'iniciante',    'halteres + banco',3,4,10,15),
-- POSTERIORES
('00000000-0060-0000-0000-000000000000','Stiff com Barra',            'posteriores','{"gluteos"}',           'empurrar_quadril','intermediario','barra',           3,4,8,12),
('00000000-0061-0000-0000-000000000000','Stiff com Halteres',         'posteriores','{"gluteos"}',           'empurrar_quadril','iniciante',    'halteres',        3,4,8,12),
('00000000-0062-0000-0000-000000000000','Mesa Flexora (Leg Curl)',    'posteriores','{}',                    'flexao_joelho',   'iniciante',    'máquina flexora', 3,4,10,15),
('00000000-0063-0000-0000-000000000000','Flexão de Joelho no Cabo',  'posteriores','{}',                    'flexao_joelho',   'iniciante',    'cabo',            3,4,10,15),
('00000000-0064-0000-0000-000000000000','Good Morning com Barra',    'posteriores','{"gluteos","costas"}',   'empurrar_quadril','avancado',     'barra',           3,4,8,12),
-- GLÚTEOS
('00000000-0070-0000-0000-000000000000','Hip Thrust com Barra',          'gluteos','{"posteriores"}','empurrar_quadril','intermediario','barra + banco',    3,4,8,15),
('00000000-0071-0000-0000-000000000000','Hip Thrust com Haltere',        'gluteos','{"posteriores"}','empurrar_quadril','iniciante',    'haltere + banco', 3,4,10,15),
('00000000-0072-0000-0000-000000000000','Elevação Pélvica no Chão',      'gluteos','{}',           'empurrar_quadril','iniciante',    'nenhum',          3,4,12,20),
('00000000-0073-0000-0000-000000000000','Abdução no Cabo (Glúteo Médio)','gluteos','{}',           'isolamento',      'iniciante',    'cabo',            3,4,12,20),
('00000000-0074-0000-0000-000000000000','Agachamento Sumô com Haltere', 'gluteos','{"quadriceps","posteriores"}','agachar','iniciante',    'haltere',         3,4,10,15),
-- PANTURRILHAS
('00000000-0080-0000-0000-000000000000','Elevação de Panturrilha em Pé',   'panturrilhas','{}','isolamento','iniciante','máquina / degrau', 4,5,12,20),
('00000000-0081-0000-0000-000000000000','Elevação de Panturrilha Sentado', 'panturrilhas','{}','isolamento','iniciante','máquina sentado',  4,5,12,20),
('00000000-0082-0000-0000-000000000000','Elevação de Panturrilha no Leg',  'panturrilhas','{}','isolamento','iniciante','leg press 45°',    4,5,12,20),
-- ABDÔMEN
('00000000-0090-0000-0000-000000000000','Prancha Abdominal (Plank)',        'abdomen','{}','isolamento','iniciante',    'nenhum',          3,4,20,60),
('00000000-0091-0000-0000-000000000000','Abdominal Crunch',                 'abdomen','{}','isolamento','iniciante',    'nenhum',          3,4,15,25),
('00000000-0092-0000-0000-000000000000','Abdominal na Polia (Cable Crunch)','abdomen','{}','isolamento','iniciante',    'polia alta',      3,4,12,20),
('00000000-0093-0000-0000-000000000000','Elevação de Pernas (Hanging)',     'abdomen','{}','isolamento','intermediario','barra fixa',      3,4,10,15),
('00000000-0094-0000-0000-000000000000','Roda Abdominal (Ab Wheel)',        'abdomen','{}','isolamento','intermediario','roda abdominal',  3,4,8,15);

-- Vínculos variacao_de
update exercicios set variacao_de='00000000-0001-0000-0000-000000000000' where id in ('00000000-0002-0000-0000-000000000000','00000000-0003-0000-0000-000000000000','00000000-0004-0000-0000-000000000000','00000000-0005-0000-0000-000000000000');
update exercicios set variacao_de='00000000-0006-0000-0000-000000000000' where id in ('00000000-0007-0000-0000-000000000000','00000000-0008-0000-0000-000000000000');
update exercicios set variacao_de='00000000-0010-0000-0000-000000000000' where id = '00000000-0011-0000-0000-000000000000';
update exercicios set variacao_de='00000000-0012-0000-0000-000000000000' where id = '00000000-0013-0000-0000-000000000000';
update exercicios set variacao_de='00000000-0014-0000-0000-000000000000' where id in ('00000000-0015-0000-0000-000000000000','00000000-0016-0000-0000-000000000000','00000000-0017-0000-0000-000000000000');
update exercicios set variacao_de='00000000-0018-0000-0000-000000000000' where id = '00000000-0019-0000-0000-000000000000';
update exercicios set variacao_de='00000000-0021-0000-0000-000000000000' where id in ('00000000-0022-0000-0000-000000000000','00000000-0023-0000-0000-000000000000');
update exercicios set variacao_de='00000000-0024-0000-0000-000000000000' where id = '00000000-0025-0000-0000-000000000000';
update exercicios set variacao_de='00000000-0030-0000-0000-000000000000' where id in ('00000000-0031-0000-0000-000000000000','00000000-0032-0000-0000-000000000000','00000000-0033-0000-0000-000000000000','00000000-0034-0000-0000-000000000000','00000000-0035-0000-0000-000000000000');
update exercicios set variacao_de='00000000-0040-0000-0000-000000000000' where id in ('00000000-0041-0000-0000-000000000000','00000000-0042-0000-0000-000000000000','00000000-0043-0000-0000-000000000000','00000000-0045-0000-0000-000000000000');
update exercicios set variacao_de='00000000-0050-0000-0000-000000000000' where id in ('00000000-0051-0000-0000-000000000000','00000000-0052-0000-0000-000000000000','00000000-0053-0000-0000-000000000000','00000000-0055-0000-0000-000000000000','00000000-0056-0000-0000-000000000000');
update exercicios set variacao_de='00000000-0060-0000-0000-000000000000' where id = '00000000-0061-0000-0000-000000000000';
update exercicios set variacao_de='00000000-0062-0000-0000-000000000000' where id = '00000000-0063-0000-0000-000000000000';
update exercicios set variacao_de='00000000-0070-0000-0000-000000000000' where id in ('00000000-0071-0000-0000-000000000000','00000000-0072-0000-0000-000000000000');
update exercicios set variacao_de='00000000-0080-0000-0000-000000000000' where id in ('00000000-0081-0000-0000-000000000000','00000000-0082-0000-0000-000000000000');

-- ─── 004 — Planos de Treino ───────────────────────────────────
create table planos_treino (
  id                  uuid primary key default uuid_generate_v4(),
  user_id             uuid not null references users(id) on delete cascade,
  nome                text not null,
  divisao             divisao_treino_enum not null,
  semanas_previstas   smallint not null default 12,
  status              status_plano_enum not null default 'ativo',
  gerado_por_ia       boolean not null default true,
  prompt_utilizado    text,
  modelo_ia           text,
  versao              smallint not null default 1,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  deleted_at          timestamptz
);

create unique index idx_planos_ativo_por_user on planos_treino (user_id) where status = 'ativo' and deleted_at is null;
create trigger trg_planos_treino_updated_at before update on planos_treino for each row execute function set_updated_at();

create table sessoes_plano (
  id                  uuid primary key default uuid_generate_v4(),
  plano_id            uuid not null references planos_treino(id) on delete cascade,
  nome                text not null,
  dia_semana          smallint not null check (dia_semana between 0 and 6),
  eh_descanso         boolean not null default false,
  grupos_musculares   text[] not null default '{}',
  ordem               smallint not null default 1,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create index idx_sessoes_plano_plano on sessoes_plano (plano_id);
create trigger trg_sessoes_plano_updated_at before update on sessoes_plano for each row execute function set_updated_at();

create table exercicios_sessao (
  id                  uuid primary key default uuid_generate_v4(),
  sessao_id           uuid not null references sessoes_plano(id) on delete cascade,
  exercicio_id        uuid not null references exercicios(id),
  series              smallint not null default 3,
  reps_min            smallint not null default 8,
  reps_max            smallint not null default 12,
  rir_alvo            smallint not null default 2,
  tempo_descanso_s    smallint not null default 120,
  progressao_tipo     text not null default 'dupla',
  carga_inicial_kg    numeric(6,2),
  ordem               smallint not null default 1,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create index idx_ex_sessao_sessao on exercicios_sessao (sessao_id);
create trigger trg_exercicios_sessao_updated_at before update on exercicios_sessao for each row execute function set_updated_at();

alter table planos_treino     enable row level security;
alter table sessoes_plano     enable row level security;
alter table exercicios_sessao enable row level security;
create policy "planos: leitura própria"     on planos_treino   for select using (auth.uid() = user_id);
create policy "planos: inserção própria"    on planos_treino   for insert with check (auth.uid() = user_id);
create policy "planos: atualização própria" on planos_treino   for update using (auth.uid() = user_id);
create policy "sessoes_plano: leitura via plano" on sessoes_plano for select using (exists (select 1 from planos_treino p where p.id = plano_id and p.user_id = auth.uid()));
create policy "exercicios_sessao: leitura via sessão" on exercicios_sessao for select using (exists (select 1 from sessoes_plano s join planos_treino p on p.id = s.plano_id where s.id = sessao_id and p.user_id = auth.uid()));

-- ─── 005 — Sessões Executadas ─────────────────────────────────
create table sessoes_executadas (
  id                  uuid primary key default uuid_generate_v4(),
  user_id             uuid not null references users(id) on delete cascade,
  sessao_plano_id     uuid not null references sessoes_plano(id),
  iniciada_em         timestamptz not null default now(),
  finalizada_em       timestamptz,
  duracao_min         smallint,
  status              status_sessao_exec_enum not null default 'em_andamento',
  score_qualidade     numeric(3,1),
  notas               text,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  deleted_at          timestamptz
);

create index idx_sess_exec_user  on sessoes_executadas (user_id, iniciada_em desc) where deleted_at is null;
create index idx_sess_exec_plano on sessoes_executadas (sessao_plano_id);
create trigger trg_sessoes_executadas_updated_at before update on sessoes_executadas for each row execute function set_updated_at();

create table series_executadas (
  id                      uuid primary key default uuid_generate_v4(),
  sessao_executada_id     uuid not null references sessoes_executadas(id) on delete cascade,
  exercicio_sessao_id     uuid not null references exercicios_sessao(id),
  serie_num               smallint not null check (serie_num >= 1),
  carga_kg                numeric(6,2) not null check (carga_kg >= 0),
  reps                    smallint not null check (reps >= 1),
  rir                     smallint not null check (rir between 0 and 10),
  sugestao_progressao     text,
  delta_carga_sugerido    numeric(4,2),
  completada              boolean not null default true,
  executada_em            timestamptz not null default now(),
  created_at              timestamptz not null default now()
);

create index idx_series_exec_sessao    on series_executadas (sessao_executada_id);
create index idx_series_exec_exercicio on series_executadas (exercicio_sessao_id);

alter table sessoes_executadas enable row level security;
alter table series_executadas  enable row level security;
create policy "sessoes_exec: leitura própria"   on sessoes_executadas for select using (auth.uid() = user_id);
create policy "sessoes_exec: inserção própria"  on sessoes_executadas for insert with check (auth.uid() = user_id);
create policy "sessoes_exec: atualização própria" on sessoes_executadas for update using (auth.uid() = user_id);
create policy "series_exec: leitura via sessão" on series_executadas for select using (exists (select 1 from sessoes_executadas se where se.id = sessao_executada_id and se.user_id = auth.uid()));
create policy "series_exec: inserção via sessão" on series_executadas for insert with check (exists (select 1 from sessoes_executadas se where se.id = sessao_executada_id and se.user_id = auth.uid()));

-- ─── 006 — Check-ins ─────────────────────────────────────────
create table checkins (
  id                  uuid primary key default uuid_generate_v4(),
  user_id             uuid not null references users(id) on delete cascade,
  data                date not null default current_date,
  qualidade_sono      smallint not null check (qualidade_sono between 1 and 10),
  energia             smallint not null check (energia between 1 and 10),
  dor_muscular        smallint not null check (dor_muscular between 0 and 10),
  horas_sono          numeric(3,1) not null check (horas_sono between 0 and 24),
  peso_kg             numeric(5,2) check (peso_kg between 30 and 300),
  score_recuperacao   numeric(3,1) not null check (score_recuperacao between 0 and 10),
  notas               text,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  deleted_at          timestamptz,
  constraint uq_checkin_user_data unique (user_id, data)
);

create index idx_checkins_user_data on checkins (user_id, data desc) where deleted_at is null;
create trigger trg_checkins_updated_at before update on checkins for each row execute function set_updated_at();
alter table checkins enable row level security;
create policy "checkins: leitura própria"    on checkins for select using (auth.uid() = user_id);
create policy "checkins: inserção própria"   on checkins for insert with check (auth.uid() = user_id);
create policy "checkins: atualização própria"on checkins for update using (auth.uid() = user_id);

-- ─── 007 — Alimentos ─────────────────────────────────────────
create table alimentos (
  id                  uuid primary key default uuid_generate_v4(),
  nome                text not null,
  nome_cientifico     text,
  categoria           text not null,
  marca               text,
  calorias_100g       numeric(7,2) not null check (calorias_100g >= 0),
  proteina_100g       numeric(6,2) not null check (proteina_100g >= 0),
  carboidrato_100g    numeric(6,2) not null check (carboidrato_100g >= 0),
  gordura_100g        numeric(6,2) not null check (gordura_100g >= 0),
  fibra_100g          numeric(6,2),
  sodio_mg_100g       numeric(7,2),
  porcao_padrao_g     numeric(6,1) not null default 100,
  unidade_medida      text not null default 'g',
  fonte               text not null default 'TACO',
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  deleted_at          timestamptz
);

create index idx_alimentos_categoria on alimentos (categoria) where deleted_at is null;
create trigger trg_alimentos_updated_at before update on alimentos for each row execute function set_updated_at();
alter table alimentos enable row level security;
create policy "alimentos: leitura pública autenticada" on alimentos for select using (auth.role() = 'authenticated');
create policy "alimentos: admin pode inserir"          on alimentos for insert with check (auth.role() = 'authenticated');
create policy "alimentos: admin pode atualizar"        on alimentos for update using  (auth.role() = 'authenticated');

insert into alimentos (nome, categoria, calorias_100g, proteina_100g, carboidrato_100g, gordura_100g, fibra_100g, porcao_padrao_g, unidade_medida) values
  ('Frango grelhado (peito)',       'proteinas',   159, 32.8, 0.0,  3.2,  0,   100, 'g'),
  ('Carne bovina (patinho cozido)', 'proteinas',   219, 32.5, 0.0,  9.3,  0,   100, 'g'),
  ('Atum em conserva (escorrido)',  'proteinas',   132, 28.9, 0.0,  1.7,  0,   100, 'g'),
  ('Ovos inteiros',                 'proteinas',   143, 13.0, 0.6,  9.5,  0,   50,  'unidade'),
  ('Claras de ovo',                 'proteinas',   52,  11.0, 0.7,  0.2,  0,   30,  'unidade'),
  ('Salmão grelhado',               'proteinas',   208, 28.2, 0.0,  10.0, 0,   100, 'g'),
  ('Tilápia assada',                'proteinas',   128, 26.2, 0.0,  2.6,  0,   100, 'g'),
  ('Whey protein (pó)',             'suplementos', 400, 80.0, 8.0,  5.0,  0,   30,  'g'),
  ('Caseína proteica (pó)',         'suplementos', 370, 75.0, 10.0, 3.0,  0,   30,  'g'),
  ('Feijão carioca cozido',         'leguminosas', 76,  4.8,  13.6, 0.5,  8.5, 100, 'g'),
  ('Lentilha cozida',               'leguminosas', 93,  6.3,  16.3, 0.4,  7.9, 100, 'g'),
  ('Arroz branco cozido',           'graos',       128, 2.5,  28.1, 0.2,  0.2, 150, 'g'),
  ('Arroz integral cozido',         'graos',       124, 2.6,  25.8, 1.0,  1.8, 150, 'g'),
  ('Aveia em flocos',               'graos',       394, 13.9, 66.6, 8.5,  9.1, 40,  'g'),
  ('Batata-doce cozida',            'tuberculos',  86,  1.4,  20.4, 0.1,  2.2, 150, 'g'),
  ('Macarrão integral cozido',      'graos',       124, 5.3,  23.2, 1.1,  3.5, 120, 'g'),
  ('Pão integral (fatia)',          'graos',       253, 8.0,  42.0, 3.0,  6.0, 30,  'fatia'),
  ('Iogurte grego integral',        'laticinios',  97,  9.1,  3.6,  5.0,  0,   170, 'g'),
  ('Queijo cottage',                'laticinios',  98,  11.1, 3.4,  4.3,  0,   100, 'g'),
  ('Leite integral',                'laticinios',  61,  3.2,  4.8,  3.3,  0,   200, 'ml'),
  ('Azeite de oliva',               'gorduras',    884, 0,    0,    100,  0,   10,  'ml'),
  ('Abacate',                       'frutas',      160, 2.0,  6.0,  14.7, 6.7, 100, 'g'),
  ('Amendoim torrado',              'oleaginosas', 567, 25.8, 16.1, 49.2, 8.5, 30,  'g'),
  ('Banana prata',                  'frutas',      98,  1.3,  26.0, 0.1,  2.0, 100, 'unidade'),
  ('Maçã',                          'frutas',      56,  0.3,  15.2, 0.1,  2.4, 150, 'unidade'),
  ('Brócolis cozido',               'vegetais',    25,  2.4,  3.6,  0.2,  2.4, 100, 'g'),
  ('Espinafre cru',                 'vegetais',    22,  2.9,  3.6,  0.4,  2.2, 50,  'g');

-- ─── 008 — Diário Alimentar ───────────────────────────────────
create table diario_alimentar (
  id                  uuid primary key default uuid_generate_v4(),
  user_id             uuid not null references users(id) on delete cascade,
  alimento_id         uuid not null references alimentos(id),
  data                date not null default current_date,
  refeicao            refeicao_enum not null,
  quantidade_g        numeric(7,2) not null check (quantidade_g > 0),
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
create trigger trg_diario_alimentar_updated_at before update on diario_alimentar for each row execute function set_updated_at();
alter table diario_alimentar enable row level security;
create policy "diario: leitura própria"    on diario_alimentar for select using (auth.uid() = user_id);
create policy "diario: inserção própria"   on diario_alimentar for insert with check (auth.uid() = user_id);
create policy "diario: atualização própria"on diario_alimentar for update using (auth.uid() = user_id);
create policy "diario: remoção própria"    on diario_alimentar for delete using (auth.uid() = user_id);
