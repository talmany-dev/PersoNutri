-- Spec 06 (prerequisito) + Spec 08 — Banco de Alimentos
-- Catálogo global de alimentos com valores nutricionais por 100g

create table alimentos (
  id                  uuid primary key default uuid_generate_v4(),

  nome                text not null,
  nome_cientifico     text,
  categoria           text not null,            -- ex: 'proteinas', 'graos', 'laticinios', 'frutas', 'legumes', 'gorduras'
  marca               text,                     -- null = genérico / TACO

  -- Valores nutricionais por 100g
  calorias_100g       numeric(7,2) not null check (calorias_100g >= 0),
  proteina_100g       numeric(6,2) not null check (proteina_100g >= 0),
  carboidrato_100g    numeric(6,2) not null check (carboidrato_100g >= 0),
  gordura_100g        numeric(6,2) not null check (gordura_100g >= 0),
  fibra_100g          numeric(6,2),
  sodio_mg_100g       numeric(7,2),

  -- Porção padrão
  porcao_padrao_g     numeric(6,1) not null default 100,
  unidade_medida      text not null default 'g',   -- 'g', 'ml', 'unidade', 'fatia', 'colher'

  -- Fonte
  fonte               text not null default 'TACO', -- TACO | IBGE | USDA | usuario

  -- Soft delete + auditoria
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  deleted_at          timestamptz
);

create index idx_alimentos_nome on alimentos using gin(to_tsvector('portuguese', nome));
create index idx_alimentos_categoria on alimentos (categoria) where deleted_at is null;

create trigger trg_alimentos_updated_at
  before update on alimentos
  for each row execute function set_updated_at();

-- Seed: alimentos TACO mais comuns no contexto de hipertrofia
insert into alimentos (nome, categoria, calorias_100g, proteina_100g, carboidrato_100g, gordura_100g, fibra_100g, porcao_padrao_g, unidade_medida) values
  -- Proteínas animais
  ('Frango grelhado (peito)',       'proteinas',  159, 32.8, 0.0,  3.2,  0,   100, 'g'),
  ('Carne bovina (patinho cozido)', 'proteinas',  219, 32.5, 0.0,  9.3,  0,   100, 'g'),
  ('Atum em conserva (escorrido)',  'proteinas',  132, 28.9, 0.0,  1.7,  0,   100, 'g'),
  ('Ovos inteiros',                 'proteinas',  143, 13.0, 0.6,  9.5,  0,   50,  'unidade'),
  ('Claras de ovo',                 'proteinas',   52, 11.0, 0.7,  0.2,  0,   30,  'unidade'),
  ('Salmão grelhado',               'proteinas',  208, 28.2, 0.0, 10.0,  0,   100, 'g'),
  ('Tilápia assada',                'proteinas',  128, 26.2, 0.0,  2.6,  0,   100, 'g'),
  -- Proteínas vegetais / suplementos
  ('Whey protein (pó)',             'suplementos', 400, 80.0, 8.0,  5.0,  0,   30,  'g'),
  ('Caseína proteica (pó)',         'suplementos', 370, 75.0, 10.0, 3.0,  0,   30,  'g'),
  ('Feijão carioca cozido',         'leguminosas', 76,  4.8, 13.6, 0.5,  8.5, 100, 'g'),
  ('Lentilha cozida',               'leguminosas', 93,  6.3, 16.3, 0.4,  7.9, 100, 'g'),
  -- Carboidratos
  ('Arroz branco cozido',           'graos',       128, 2.5, 28.1, 0.2,  0.2, 150, 'g'),
  ('Arroz integral cozido',         'graos',       124, 2.6, 25.8, 1.0,  1.8, 150, 'g'),
  ('Aveia em flocos',               'graos',       394, 13.9, 66.6, 8.5, 9.1, 40,  'g'),
  ('Batata-doce cozida',            'tuberculos',  86,  1.4, 20.4, 0.1,  2.2, 150, 'g'),
  ('Macarrão integral cozido',      'graos',       124, 5.3, 23.2, 1.1,  3.5, 120, 'g'),
  ('Pão integral (fatia)',          'graos',       253, 8.0, 42.0, 3.0,  6.0, 30,  'fatia'),
  -- Laticínios
  ('Iogurte grego integral',        'laticinios',  97,  9.1, 3.6,  5.0,  0,   170, 'g'),
  ('Queijo cottage',                'laticinios',  98,  11.1,3.4,  4.3,  0,   100, 'g'),
  ('Leite integral',                'laticinios',  61,  3.2, 4.8,  3.3,  0,   200, 'ml'),
  -- Gorduras boas
  ('Azeite de oliva',               'gorduras',    884, 0,   0,    100,  0,   10,  'ml'),
  ('Abacate',                       'frutas',      160, 2.0, 6.0,  14.7, 6.7, 100, 'g'),
  ('Amendoim torrado',              'oleaginosas', 567, 25.8,16.1, 49.2, 8.5, 30,  'g'),
  -- Frutas e vegetais
  ('Banana prata',                  'frutas',      98,  1.3, 26.0, 0.1,  2.0, 100, 'unidade'),
  ('Maçã',                          'frutas',      56,  0.3, 15.2, 0.1,  2.4, 150, 'unidade'),
  ('Brócolis cozido',               'vegetais',    25,  2.4, 3.6,  0.2,  2.4, 100, 'g'),
  ('Espinafre cru',                 'vegetais',    22,  2.9, 3.6,  0.4,  2.2, 50,  'g');

-- RLS: catálogo público para usuários autenticados
alter table alimentos enable row level security;
create policy "alimentos: leitura pública autenticada"
  on alimentos for select using (auth.role() = 'authenticated');
