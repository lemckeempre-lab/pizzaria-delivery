require("dotenv").config();
const pool = require("./index");

const SQL = `
-- ── Extensões ──────────────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── Categorias ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS categorias (
  id   SERIAL PRIMARY KEY,
  nome VARCHAR(100) NOT NULL UNIQUE
);

INSERT INTO categorias (nome) VALUES
  ('Pizzas'), ('Combos'), ('Bebidas'), ('Sobremesas')
ON CONFLICT DO NOTHING;

-- ── Produtos ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS produtos (
  id           SERIAL PRIMARY KEY,
  nome         VARCHAR(200) NOT NULL,
  descricao    TEXT,
  preco        NUMERIC(10,2) NOT NULL,
  categoria    VARCHAR(100) NOT NULL DEFAULT 'Pizzas',
  emoji        VARCHAR(10)  NOT NULL DEFAULT '🍕',
  badge        VARCHAR(50),
  ativo        BOOLEAN NOT NULL DEFAULT true,
  criado_em    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Pedidos ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS pedidos (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  numero         VARCHAR(20) NOT NULL UNIQUE,
  cliente_nome   VARCHAR(200) NOT NULL,
  cliente_tel    VARCHAR(30)  NOT NULL,
  rua            VARCHAR(200) NOT NULL,
  numero_end     VARCHAR(20)  NOT NULL,
  bairro         VARCHAR(100) NOT NULL,
  cidade         VARCHAR(100) NOT NULL DEFAULT 'São Paulo',
  complemento    VARCHAR(200),
  pagamento      VARCHAR(30)  NOT NULL DEFAULT 'pix',
  total          NUMERIC(10,2) NOT NULL,
  status         VARCHAR(30)  NOT NULL DEFAULT 'Recebido',
  criado_em      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  atualizado_em  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Itens do pedido ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS itens_pedido (
  id          SERIAL PRIMARY KEY,
  pedido_id   UUID NOT NULL REFERENCES pedidos(id) ON DELETE CASCADE,
  produto_id  INTEGER REFERENCES produtos(id),
  nome        VARCHAR(200) NOT NULL,
  emoji       VARCHAR(10),
  preco_unit  NUMERIC(10,2) NOT NULL,
  quantidade  INTEGER NOT NULL DEFAULT 1,
  subtotal    NUMERIC(10,2) NOT NULL
);

-- ── Configurações da marca ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS config_marca (
  id           INTEGER PRIMARY KEY DEFAULT 1,
  nome         VARCHAR(200) NOT NULL DEFAULT 'La Bella Pizza',
  emoji        VARCHAR(10)  NOT NULL DEFAULT '🍕',
  cor_primaria VARCHAR(20)  NOT NULL DEFAULT '#C41E3A',
  cor_escura   VARCHAR(20)  NOT NULL DEFAULT '#8b0f24',
  cor_nome     VARCHAR(100) NOT NULL DEFAULT 'Vermelho',
  tagline      TEXT NOT NULL DEFAULT 'Pizzas artesanais com ingredientes frescos',
  pix          VARCHAR(200) NOT NULL DEFAULT 'pizzaria@pix.com.br',
  CONSTRAINT apenas_uma_linha CHECK (id = 1)
);

INSERT INTO config_marca DEFAULT VALUES ON CONFLICT DO NOTHING;

-- ── Produtos iniciais ──────────────────────────────────────────────────────
INSERT INTO produtos (nome, descricao, preco, categoria, emoji, badge) VALUES
  ('Margherita Clássica',  'Molho de tomate, mozzarella fior di latte, manjericão fresco', 42.90, 'Pizzas',      '🍕', 'Clássica'),
  ('Pepperoni Suprema',    'Molho especial, mozzarella, pepperoni importado, orégano',      52.90, 'Pizzas',      '🔥', 'Mais Pedida'),
  ('Quatro Queijos',       'Mozzarella, parmesão, gorgonzola, provolone, fio de mel',       55.90, 'Pizzas',      '🧀', NULL),
  ('Frango com Catupiry',  'Molho branco, frango desfiado, catupiry original, milho',       49.90, 'Pizzas',      '🍗', 'Favorita'),
  ('Portuguesa',           'Molho, mozzarella, presunto, ovos, cebola, azeitonas',          51.90, 'Pizzas',      '🫒', NULL),
  ('Calabresa Artesanal',  'Molho artesanal, calabresa defumada, cebola caramelizada',      47.90, 'Pizzas',      '🌶️', NULL),
  ('Napolitana',           'Molho San Marzano, tomate cereja, parmesão, rúcula',            53.90, 'Pizzas',      '🍅', 'Chef'),
  ('Combo Família',        '2 Pizzas grandes + 2 Refrigerantes 2L + 1 Sobremesa',          139.90,'Combos',      '👨‍👩‍👧‍👦', 'Oferta'),
  ('Combo Casal',          '1 Pizza grande + 1 Pizza pequena + 2 Refrigerantes lata',       89.90, 'Combos',      '💑', 'Popular'),
  ('Coca-Cola 2L',         'Refrigerante gelado 2 litros',                                  14.90, 'Bebidas',     '🥤', NULL),
  ('Água Mineral 500ml',   'Água mineral sem gás gelada',                                    5.90, 'Bebidas',     '💧', NULL),
  ('Suco Natural 500ml',   'Laranja, maracujá ou limão, espremido na hora',                 12.90, 'Bebidas',     '🍊', 'Fresco'),
  ('Tiramisu da Casa',     'Receita italiana original com mascarpone e café expresso',      22.90, 'Sobremesas',  '🍰', 'Especial'),
  ('Petit Gâteau',         'Bolo quente de chocolate com sorvete de baunilha',              24.90, 'Sobremesas',  '🍫', NULL),
  ('Gelato Artesanal',     '3 bolas: pistache, stracciatella ou framboesa',                 18.90, 'Sobremesas',  '🍨', 'Novo')
ON CONFLICT DO NOTHING;

-- ── Índices ────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_pedidos_criado_em ON pedidos(criado_em DESC);
CREATE INDEX IF NOT EXISTS idx_pedidos_status    ON pedidos(status);
CREATE INDEX IF NOT EXISTS idx_itens_pedido_id   ON itens_pedido(pedido_id);
CREATE INDEX IF NOT EXISTS idx_produtos_categoria ON produtos(categoria);
CREATE INDEX IF NOT EXISTS idx_produtos_ativo     ON produtos(ativo);
`;

async function setup() {
  console.log("🔧 Configurando banco de dados...");
  try {
    await pool.query(SQL);
    console.log("✅ Banco configurado com sucesso!");
    console.log("   Tabelas criadas: categorias, produtos, pedidos, itens_pedido, config_marca");
  } catch (err) {
    console.error("❌ Erro ao configurar banco:", err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

setup();
