-- Spec 03 (prerequisito) + Spec 07 — Banco de Exercícios

create type grupo_muscular_enum as enum (
  'peito', 'costas', 'ombros', 'biceps', 'triceps',
  'quadriceps', 'posteriores', 'gluteos', 'panturrilhas',
  'abdomen', 'trapezio', 'antebraco'
);

create type padrao_movimento_enum as enum (
  'empurrar_horizontal', 'empurrar_vertical',
  'puxar_horizontal',   'puxar_vertical',
  'agachar', 'empurrar_quadril', 'carregar',
  'rotacao', 'flexao_joelho', 'isolamento'
);

create type nivel_exercicio_enum as enum ('iniciante', 'intermediario', 'avancado');

create table exercicios (
  id                    uuid primary key default uuid_generate_v4(),

  nome                  text not null,
  nome_alternativo      text,                          -- nome popular / variação
  grupo_muscular        grupo_muscular_enum not null,
  grupos_secundarios    grupo_muscular_enum[] default '{}',
  padrao_movimento      padrao_movimento_enum not null,
  nivel_dificuldade     nivel_exercicio_enum not null default 'intermediario',

  -- Variações: aponta para o exercício "pai" desta variação
  variacao_de           uuid references exercicios(id) on delete set null,

  -- Requisitos
  equipamento_necessario text not null,
  requer_academia       boolean not null default true,

  -- Orientações de prescrição
  series_min            smallint default 3,
  series_max            smallint default 4,
  reps_min              smallint default 8,
  reps_max              smallint default 12,
  rir_recomendado       smallint default 2,

  -- Metadados
  instrucoes            text,
  video_url             text,
  imagem_url            text,

  -- Soft delete + auditoria
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),
  deleted_at            timestamptz
);

create index idx_exercicios_grupo      on exercicios (grupo_muscular)   where deleted_at is null;
create index idx_exercicios_padrao     on exercicios (padrao_movimento) where deleted_at is null;
create index idx_exercicios_variacao   on exercicios (variacao_de)      where deleted_at is null;
create index idx_exercicios_search     on exercicios using gin(to_tsvector('portuguese', nome)) where deleted_at is null;

create trigger trg_exercicios_updated_at
  before update on exercicios
  for each row execute function set_updated_at();

-- ─── Seed ────────────────────────────────────────────────────────────────────
-- Grupo 1: PEITO
insert into exercicios (id, nome, grupo_muscular, grupos_secundarios, padrao_movimento, nivel_dificuldade, equipamento_necessario, series_min, series_max, reps_min, reps_max) values
  ('00000000-0001-0000-0000-000000000000', 'Supino Reto com Barra',          'peito', '{"triceps","ombros"}', 'empurrar_horizontal', 'intermediario', 'barra + rack',        3, 4,  6, 10),
  ('00000000-0002-0000-0000-000000000000', 'Supino Reto com Halteres',       'peito', '{"triceps","ombros"}', 'empurrar_horizontal', 'intermediario', 'halteres + banco',    3, 4,  8, 12),
  ('00000000-0003-0000-0000-000000000000', 'Supino Inclinado com Barra',     'peito', '{"triceps","ombros"}', 'empurrar_horizontal', 'intermediario', 'barra + banco inclinado', 3,4,6,10),
  ('00000000-0004-0000-0000-000000000000', 'Supino Inclinado com Halteres',  'peito', '{"triceps","ombros"}', 'empurrar_horizontal', 'iniciante',     'halteres + banco',    3, 4,  8, 12),
  ('00000000-0005-0000-0000-000000000000', 'Supino Declinado com Barra',     'peito', '{"triceps"}',          'empurrar_horizontal', 'intermediario', 'barra + banco declinado',3,4,6,10),
  ('00000000-0006-0000-0000-000000000000', 'Crossover no Cabo',              'peito', '{}',                   'isolamento',          'iniciante',     'cabo',                3, 4, 10, 15),
  ('00000000-0007-0000-0000-000000000000', 'Fly com Halteres',               'peito', '{}',                   'isolamento',          'iniciante',     'halteres + banco',    3, 4, 10, 15),
  ('00000000-0008-0000-0000-000000000000', 'Peck Deck (Fly na Máquina)',     'peito', '{}',                   'isolamento',          'iniciante',     'máquina peck deck',   3, 4, 10, 15),
  ('00000000-0009-0000-0000-000000000000', 'Flexão de Braços',               'peito', '{"triceps","ombros"}', 'empurrar_horizontal', 'iniciante',     'nenhum',              3, 4, 10, 20);

-- Variações de supino
update exercicios set variacao_de = '00000000-0001-0000-0000-000000000000' where id in (
  '00000000-0002-0000-0000-000000000000',
  '00000000-0003-0000-0000-000000000000',
  '00000000-0004-0000-0000-000000000000',
  '00000000-0005-0000-0000-000000000000'
);
update exercicios set variacao_de = '00000000-0006-0000-0000-000000000000' where id in (
  '00000000-0007-0000-0000-000000000000',
  '00000000-0008-0000-0000-000000000000'
);

-- Grupo 2: COSTAS
insert into exercicios (id, nome, grupo_muscular, grupos_secundarios, padrao_movimento, nivel_dificuldade, equipamento_necessario, series_min, series_max, reps_min, reps_max) values
  ('00000000-0010-0000-0000-000000000000', 'Barra Fixa (Pegada Pronada)',        'costas', '{"biceps","trapezio"}', 'puxar_vertical',   'intermediario', 'barra fixa',        3, 4, 5, 10),
  ('00000000-0011-0000-0000-000000000000', 'Barra Fixa (Pegada Supinada)',       'costas', '{"biceps"}',            'puxar_vertical',   'intermediario', 'barra fixa',        3, 4, 5, 10),
  ('00000000-0012-0000-0000-000000000000', 'Puxada Frontal (Polia Alta)',        'costas', '{"biceps"}',            'puxar_vertical',   'iniciante',     'polia alta',        3, 4, 8, 12),
  ('00000000-0013-0000-0000-000000000000', 'Puxada Fechada (Triângulo)',         'costas', '{"biceps"}',            'puxar_vertical',   'iniciante',     'polia alta',        3, 4, 8, 12),
  ('00000000-0014-0000-0000-000000000000', 'Remada Curvada com Barra',          'costas', '{"biceps","trapezio"}', 'puxar_horizontal', 'intermediario', 'barra',             3, 4, 6, 10),
  ('00000000-0015-0000-0000-000000000000', 'Remada Unilateral com Haltere',     'costas', '{"biceps"}',            'puxar_horizontal', 'iniciante',     'haltere + banco',   3, 4, 8, 12),
  ('00000000-0016-0000-0000-000000000000', 'Remada na Polia Baixa (Triângulo)', 'costas', '{"biceps"}',            'puxar_horizontal', 'iniciante',     'polia baixa',       3, 4, 8, 12),
  ('00000000-0017-0000-0000-000000000000', 'Remada Cavalinho (T-Bar)',           'costas', '{"biceps","trapezio"}', 'puxar_horizontal', 'intermediario', 'barra T',           3, 4, 6, 10),
  ('00000000-0018-0000-0000-000000000000', 'Levantamento Terra Convencional',   'costas', '{"gluteos","posteriores","quadriceps"}', 'empurrar_quadril', 'avancado', 'barra', 3, 5, 3,  6),
  ('00000000-0019-0000-0000-000000000000', 'Levantamento Terra Romeno',         'costas', '{"gluteos","posteriores"}', 'empurrar_quadril', 'intermediario', 'barra',          3, 4, 6, 10),
  ('00000000-0020-0000-0000-000000000000', 'Pullover com Haltere',              'costas', '{"peito"}',             'puxar_vertical',   'iniciante',     'haltere + banco',   3, 4, 10, 15);

update exercicios set variacao_de = '00000000-0010-0000-0000-000000000000' where id = '00000000-0011-0000-0000-000000000000';
update exercicios set variacao_de = '00000000-0012-0000-0000-000000000000' where id = '00000000-0013-0000-0000-000000000000';
update exercicios set variacao_de = '00000000-0014-0000-0000-000000000000' where id in ('00000000-0015-0000-0000-000000000000','00000000-0016-0000-0000-000000000000','00000000-0017-0000-0000-000000000000');
update exercicios set variacao_de = '00000000-0018-0000-0000-000000000000' where id = '00000000-0019-0000-0000-000000000000';

-- Grupo 3: OMBROS
insert into exercicios (id, nome, grupo_muscular, grupos_secundarios, padrao_movimento, nivel_dificuldade, equipamento_necessario, series_min, series_max, reps_min, reps_max) values
  ('00000000-0021-0000-0000-000000000000', 'Desenvolvimento com Barra (Militar)', 'ombros', '{"triceps"}',          'empurrar_vertical', 'intermediario', 'barra',            3, 4, 6, 10),
  ('00000000-0022-0000-0000-000000000000', 'Desenvolvimento com Halteres',        'ombros', '{"triceps"}',          'empurrar_vertical', 'iniciante',     'halteres',         3, 4, 8, 12),
  ('00000000-0023-0000-0000-000000000000', 'Desenvolvimento na Máquina (Smith)',   'ombros', '{"triceps"}',          'empurrar_vertical', 'iniciante',     'smith machine',    3, 4, 8, 12),
  ('00000000-0024-0000-0000-000000000000', 'Elevação Lateral com Halteres',       'ombros', '{}',                   'isolamento',        'iniciante',     'halteres',         3, 4, 12, 20),
  ('00000000-0025-0000-0000-000000000000', 'Elevação Lateral no Cabo',            'ombros', '{}',                   'isolamento',        'iniciante',     'cabo',             3, 4, 12, 20),
  ('00000000-0026-0000-0000-000000000000', 'Elevação Frontal com Halteres',       'ombros', '{}',                   'isolamento',        'iniciante',     'halteres',         3, 4, 12, 20),
  ('00000000-0027-0000-0000-000000000000', 'Encolhimento de Ombros (Trapézio)',   'trapezio','{"ombros"}',           'carregar',          'iniciante',     'halteres / barra', 3, 4, 10, 15),
  ('00000000-0028-0000-0000-000000000000', 'Crucifixo Inverso (Deltoide Posterior)','ombros','{"costas"}',           'puxar_horizontal',  'iniciante',     'halteres',         3, 4, 12, 20);

update exercicios set variacao_de = '00000000-0021-0000-0000-000000000000' where id in ('00000000-0022-0000-0000-000000000000','00000000-0023-0000-0000-000000000000');
update exercicios set variacao_de = '00000000-0024-0000-0000-000000000000' where id = '00000000-0025-0000-0000-000000000000';

-- Grupo 4: BÍCEPS
insert into exercicios (id, nome, grupo_muscular, grupos_secundarios, padrao_movimento, nivel_dificuldade, equipamento_necessario, series_min, series_max, reps_min, reps_max) values
  ('00000000-0030-0000-0000-000000000000', 'Rosca Direta com Barra',        'biceps', '{}',            'isolamento', 'iniciante',     'barra / barra EZ', 3, 4,  8, 12),
  ('00000000-0031-0000-0000-000000000000', 'Rosca Alternada com Haltere',   'biceps', '{}',            'isolamento', 'iniciante',     'halteres',         3, 4,  8, 12),
  ('00000000-0032-0000-0000-000000000000', 'Rosca Martelo',                 'biceps', '{"antebraco"}', 'isolamento', 'iniciante',     'halteres',         3, 4,  8, 12),
  ('00000000-0033-0000-0000-000000000000', 'Rosca Concentrada',             'biceps', '{}',            'isolamento', 'iniciante',     'haltere',          3, 3, 10, 15),
  ('00000000-0034-0000-0000-000000000000', 'Rosca no Cabo (Polia Baixa)',   'biceps', '{}',            'isolamento', 'iniciante',     'cabo',             3, 4, 10, 15),
  ('00000000-0035-0000-0000-000000000000', 'Rosca Scott (Preacher Curl)',   'biceps', '{}',            'isolamento', 'iniciante',     'barra EZ + banco', 3, 4,  8, 12);

update exercicios set variacao_de = '00000000-0030-0000-0000-000000000000' where id in (
  '00000000-0031-0000-0000-000000000000',
  '00000000-0032-0000-0000-000000000000',
  '00000000-0033-0000-0000-000000000000',
  '00000000-0034-0000-0000-000000000000',
  '00000000-0035-0000-0000-000000000000'
);

-- Grupo 5: TRÍCEPS
insert into exercicios (id, nome, grupo_muscular, grupos_secundarios, padrao_movimento, nivel_dificuldade, equipamento_necessario, series_min, series_max, reps_min, reps_max) values
  ('00000000-0040-0000-0000-000000000000', 'Tríceps Corda no Cabo',         'triceps', '{}', 'isolamento', 'iniciante',     'cabo',              3, 4, 10, 15),
  ('00000000-0041-0000-0000-000000000000', 'Tríceps Francês com Barra EZ',  'triceps', '{}', 'isolamento', 'iniciante',     'barra EZ',          3, 4,  8, 12),
  ('00000000-0042-0000-0000-000000000000', 'Tríceps Testa (Skull Crusher)', 'triceps', '{}', 'isolamento', 'iniciante',     'barra EZ + banco',  3, 4,  8, 12),
  ('00000000-0043-0000-0000-000000000000', 'Extensão de Tríceps Unilateral','triceps', '{}', 'isolamento', 'iniciante',     'cabo / haltere',    3, 4, 10, 15),
  ('00000000-0044-0000-0000-000000000000', 'Mergulho nas Paralelas (Dips)', 'triceps', '{"peito","ombros"}', 'empurrar_vertical', 'intermediario', 'paralelas', 3, 4, 6, 12),
  ('00000000-0045-0000-0000-000000000000', 'Tríceps Coice com Haltere',     'triceps', '{}', 'isolamento', 'iniciante',     'haltere',           3, 3, 12, 15);

update exercicios set variacao_de = '00000000-0040-0000-0000-000000000000' where id in (
  '00000000-0041-0000-0000-000000000000',
  '00000000-0042-0000-0000-000000000000',
  '00000000-0043-0000-0000-000000000000',
  '00000000-0045-0000-0000-000000000000'
);

-- Grupo 6: QUADRÍCEPS
insert into exercicios (id, nome, grupo_muscular, grupos_secundarios, padrao_movimento, nivel_dificuldade, equipamento_necessario, series_min, series_max, reps_min, reps_max) values
  ('00000000-0050-0000-0000-000000000000', 'Agachamento Livre com Barra',  'quadriceps', '{"gluteos","posteriores"}', 'agachar', 'intermediario', 'barra + rack',    3, 5,  4,  8),
  ('00000000-0051-0000-0000-000000000000', 'Agachamento Goblet (Haltere)', 'quadriceps', '{"gluteos"}',               'agachar', 'iniciante',     'haltere',         3, 4,  8, 12),
  ('00000000-0052-0000-0000-000000000000', 'Agachamento Hack (Máquina)',   'quadriceps', '{"gluteos"}',               'agachar', 'iniciante',     'hack squat',      3, 4,  8, 12),
  ('00000000-0053-0000-0000-000000000000', 'Leg Press 45°',                'quadriceps', '{"gluteos"}',               'agachar', 'iniciante',     'leg press 45°',   3, 4,  8, 15),
  ('00000000-0054-0000-0000-000000000000', 'Cadeira Extensora',            'quadriceps', '{}',                        'isolamento','iniciante',    'máquina extensora',3,4, 10, 15),
  ('00000000-0055-0000-0000-000000000000', 'Avanço com Halteres (Lunge)', 'quadriceps', '{"gluteos","posteriores"}',  'agachar', 'intermediario', 'halteres',        3, 4,  8, 12),
  ('00000000-0056-0000-0000-000000000000', 'Passada (Step Up) no Banco',  'quadriceps', '{"gluteos"}',               'agachar', 'iniciante',     'halteres + banco',3, 4, 10, 15);

update exercicios set variacao_de = '00000000-0050-0000-0000-000000000000' where id in (
  '00000000-0051-0000-0000-000000000000',
  '00000000-0052-0000-0000-000000000000',
  '00000000-0053-0000-0000-000000000000',
  '00000000-0055-0000-0000-000000000000',
  '00000000-0056-0000-0000-000000000000'
);

-- Grupo 7: POSTERIORES
insert into exercicios (id, nome, grupo_muscular, grupos_secundarios, padrao_movimento, nivel_dificuldade, equipamento_necessario, series_min, series_max, reps_min, reps_max) values
  ('00000000-0060-0000-0000-000000000000', 'Stiff com Barra',              'posteriores', '{"gluteos"}', 'empurrar_quadril', 'intermediario', 'barra',            3, 4,  8, 12),
  ('00000000-0061-0000-0000-000000000000', 'Stiff com Halteres',           'posteriores', '{"gluteos"}', 'empurrar_quadril', 'iniciante',     'halteres',         3, 4,  8, 12),
  ('00000000-0062-0000-0000-000000000000', 'Mesa Flexora (Leg Curl)',       'posteriores', '{}',          'flexao_joelho',   'iniciante',     'máquina flexora',  3, 4, 10, 15),
  ('00000000-0063-0000-0000-000000000000', 'Flexão de Joelho no Cabo',     'posteriores', '{}',          'flexao_joelho',   'iniciante',     'cabo',             3, 4, 10, 15),
  ('00000000-0064-0000-0000-000000000000', 'Good Morning com Barra',       'posteriores', '{"gluteos","costas"}', 'empurrar_quadril','avancado','barra',          3, 4,  8, 12);

update exercicios set variacao_de = '00000000-0060-0000-0000-000000000000' where id = '00000000-0061-0000-0000-000000000000';
update exercicios set variacao_de = '00000000-0062-0000-0000-000000000000' where id = '00000000-0063-0000-0000-000000000000';

-- Grupo 8: GLÚTEOS
insert into exercicios (id, nome, grupo_muscular, grupos_secundarios, padrao_movimento, nivel_dificuldade, equipamento_necessario, series_min, series_max, reps_min, reps_max) values
  ('00000000-0070-0000-0000-000000000000', 'Hip Thrust com Barra',         'gluteos', '{"posteriores"}', 'empurrar_quadril', 'intermediario', 'barra + banco',    3, 4,  8, 15),
  ('00000000-0071-0000-0000-000000000000', 'Hip Thrust com Haltere',       'gluteos', '{"posteriores"}', 'empurrar_quadril', 'iniciante',     'haltere + banco',  3, 4, 10, 15),
  ('00000000-0072-0000-0000-000000000000', 'Elevação Pélvica no Chão',     'gluteos', '{}',              'empurrar_quadril', 'iniciante',     'nenhum',           3, 4, 12, 20),
  ('00000000-0073-0000-0000-000000000000', 'Abdução no Cabo (Glúteo Médio)','gluteos','{}',              'isolamento',       'iniciante',     'cabo',             3, 4, 12, 20),
  ('00000000-0074-0000-0000-000000000000', 'Agachamento Sumô com Haltere', 'gluteos', '{"quadriceps","posteriores"}', 'agachar', 'iniciante', 'haltere',         3, 4, 10, 15);

update exercicios set variacao_de = '00000000-0070-0000-0000-000000000000' where id in (
  '00000000-0071-0000-0000-000000000000',
  '00000000-0072-0000-0000-000000000000'
);

-- Grupo 9: PANTURRILHAS
insert into exercicios (id, nome, grupo_muscular, grupos_secundarios, padrao_movimento, nivel_dificuldade, equipamento_necessario, series_min, series_max, reps_min, reps_max) values
  ('00000000-0080-0000-0000-000000000000', 'Elevação de Panturrilha em Pé',   'panturrilhas', '{}', 'isolamento', 'iniciante', 'máquina / degrau', 4, 5, 12, 20),
  ('00000000-0081-0000-0000-000000000000', 'Elevação de Panturrilha Sentado', 'panturrilhas', '{}', 'isolamento', 'iniciante', 'máquina sentado',  4, 5, 12, 20),
  ('00000000-0082-0000-0000-000000000000', 'Elevação de Panturrilha no Leg',  'panturrilhas', '{}', 'isolamento', 'iniciante', 'leg press 45°',    4, 5, 12, 20);

update exercicios set variacao_de = '00000000-0080-0000-0000-000000000000' where id in (
  '00000000-0081-0000-0000-000000000000',
  '00000000-0082-0000-0000-000000000000'
);

-- Grupo 10: ABDÔMEN
insert into exercicios (id, nome, grupo_muscular, grupos_secundarios, padrao_movimento, nivel_dificuldade, equipamento_necessario, series_min, series_max, reps_min, reps_max) values
  ('00000000-0090-0000-0000-000000000000', 'Prancha Abdominal (Plank)',         'abdomen', '{}', 'isolamento', 'iniciante',     'nenhum',     3, 4, 20, 60),
  ('00000000-0091-0000-0000-000000000000', 'Abdominal Crunch',                  'abdomen', '{}', 'isolamento', 'iniciante',     'nenhum',     3, 4, 15, 25),
  ('00000000-0092-0000-0000-000000000000', 'Abdominal na Polia (Cable Crunch)', 'abdomen', '{}', 'isolamento', 'iniciante',     'polia alta', 3, 4, 12, 20),
  ('00000000-0093-0000-0000-000000000000', 'Elevação de Pernas (Hanging)',      'abdomen', '{}', 'isolamento', 'intermediario', 'barra fixa', 3, 4, 10, 15),
  ('00000000-0094-0000-0000-000000000000', 'Roda Abdominal (Ab Wheel)',         'abdomen', '{}', 'isolamento', 'intermediario', 'roda abdominal',3,4,8,15);

-- RLS: catálogo público para usuários autenticados
alter table exercicios enable row level security;
create policy "exercicios: leitura pública autenticada"
  on exercicios for select using (auth.role() = 'authenticated');
create policy "exercicios: admin pode inserir"
  on exercicios for insert with check (auth.role() = 'authenticated');
create policy "exercicios: admin pode atualizar"
  on exercicios for update using (auth.role() = 'authenticated');
