const router = require("express").Router();
const db     = require("../db");
const auth   = require("../middleware/auth");

function gerarNumero() {
  return "#" + Math.floor(10000 + Math.random() * 90000);
}

// POST /api/pedidos  — público (cliente faz pedido)
router.post("/", async (req, res) => {
  const client = await db.connect();
  try {
    const { form, payment, cart, total } = req.body;

    // Validações básicas
    if (!form?.nome || !form?.tel || !form?.rua || !form?.num || !form?.bairro) {
      return res.status(400).json({ error: "Dados de endereço incompletos" });
    }
    if (!cart?.length) {
      return res.status(400).json({ error: "Carrinho vazio" });
    }

    await client.query("BEGIN");

    // Garante número único
    let numero, existe = true;
    while (existe) {
      numero = gerarNumero();
      const check = await client.query("SELECT id FROM pedidos WHERE numero=$1", [numero]);
      existe = check.rows.length > 0;
    }

    // Insere pedido
    const { rows: [pedido] } = await client.query(
      `INSERT INTO pedidos
         (numero, cliente_nome, cliente_tel, rua, numero_end, bairro, cidade, complemento, pagamento, total)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
       RETURNING *`,
      [
        numero,
        form.nome, form.tel,
        form.rua, form.num, form.bairro,
        form.cidade || "São Paulo",
        form.comp || null,
        payment || "pix",
        total,
      ]
    );

    // Insere itens
    for (const item of cart) {
      await client.query(
        `INSERT INTO itens_pedido (pedido_id, produto_id, nome, emoji, preco_unit, quantidade, subtotal)
         VALUES ($1,$2,$3,$4,$5,$6,$7)`,
        [pedido.id, item.id || null, item.name, item.emoji, item.price, item.qty, item.price * item.qty]
      );
    }

    await client.query("COMMIT");

    // Monta resposta com itens
    const pedidoCompleto = { ...pedido, itens: cart };

    // Notifica painel admin em tempo real
    req.io.emit("pedido:novo", pedidoCompleto);

    res.status(201).json(pedidoCompleto);
  } catch (err) {
    await client.query("ROLLBACK");
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

// GET /api/pedidos  — admin
router.get("/", auth, async (req, res) => {
  try {
    const { status, data } = req.query;
    let query = `
      SELECT p.*,
        json_agg(
          json_build_object(
            'id', ip.id,
            'produto_id', ip.produto_id,
            'name', ip.nome,
            'emoji', ip.emoji,
            'price', ip.preco_unit,
            'qty', ip.quantidade,
            'subtotal', ip.subtotal
          ) ORDER BY ip.id
        ) AS itens
      FROM pedidos p
      LEFT JOIN itens_pedido ip ON ip.pedido_id = p.id
    `;
    const params = [];
    const where = [];
    if (status) { params.push(status); where.push(`p.status = $${params.length}`); }
    if (data)   { params.push(data);   where.push(`DATE(p.criado_em) = $${params.length}`); }
    if (where.length) query += " WHERE " + where.join(" AND ");
    query += " GROUP BY p.id ORDER BY p.criado_em DESC";

    const { rows } = await db.query(query, params);

    // Formata para o frontend
    const pedidos = rows.map(p => ({
      number: p.numero,
      id: p.id,
      status: p.status,
      payment: p.pagamento,
      total: parseFloat(p.total),
      criado_em: p.criado_em,
      form: {
        nome: p.cliente_nome,
        tel: p.cliente_tel,
        rua: p.rua,
        num: p.numero_end,
        bairro: p.bairro,
        cidade: p.cidade,
        comp: p.complemento,
      },
      cart: p.itens,
    }));

    res.json(pedidos);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/pedidos/:numero/status  — admin
router.patch("/:numero/status", auth, async (req, res) => {
  try {
    const { status } = req.body;
    const validos = ["Recebido", "Em preparo", "Saiu p/ entrega", "Entregue"];
    if (!validos.includes(status)) {
      return res.status(400).json({ error: "Status inválido" });
    }

    const { rows } = await db.query(
      `UPDATE pedidos SET status=$1, atualizado_em=NOW()
       WHERE numero=$2 RETURNING numero, status`,
      [status, req.params.numero]
    );
    if (!rows.length) return res.status(404).json({ error: "Pedido não encontrado" });

    // Notifica todos os clientes conectados
    req.io.emit("pedido:status", { numero: rows[0].numero, status: rows[0].status });

    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/pedidos/stats  — admin (resumo do dia)
router.get("/stats/hoje", auth, async (req, res) => {
  try {
    const { rows } = await db.query(`
      SELECT
        COUNT(*)::int                              AS total_pedidos,
        COALESCE(SUM(total),0)::numeric            AS faturamento,
        COUNT(*) FILTER (WHERE status='Entregue')::int AS entregues,
        COUNT(*) FILTER (WHERE status='Em preparo')::int AS em_preparo
      FROM pedidos
      WHERE DATE(criado_em) = CURRENT_DATE
    `);
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
