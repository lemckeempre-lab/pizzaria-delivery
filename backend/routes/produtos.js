const router = require("express").Router();
const db     = require("../db");
const auth   = require("../middleware/auth");

// GET /api/produtos  — público (cardápio)
router.get("/", async (req, res) => {
  try {
    const { rows } = await db.query(
      "SELECT * FROM produtos WHERE ativo = true ORDER BY categoria, id"
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/produtos/todos  — admin (inclui inativos)
router.get("/todos", auth, async (req, res) => {
  try {
    const { rows } = await db.query("SELECT * FROM produtos ORDER BY categoria, id");
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/produtos  — admin
router.post("/", auth, async (req, res) => {
  try {
    const { nome, descricao, preco, categoria, emoji, badge } = req.body;
    if (!nome || !preco) return res.status(400).json({ error: "Nome e preço obrigatórios" });

    const { rows } = await db.query(
      `INSERT INTO produtos (nome, descricao, preco, categoria, emoji, badge)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [nome, descricao || "", preco, categoria || "Pizzas", emoji || "🍕", badge || null]
    );
    req.io.emit("produto:criado", rows[0]);
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/produtos/:id  — admin
router.put("/:id", auth, async (req, res) => {
  try {
    const { nome, descricao, preco, categoria, emoji, badge, ativo } = req.body;
    const { rows } = await db.query(
      `UPDATE produtos SET
         nome=$1, descricao=$2, preco=$3, categoria=$4, emoji=$5, badge=$6, ativo=$7
       WHERE id=$8 RETURNING *`,
      [nome, descricao, preco, categoria, emoji, badge, ativo ?? true, req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: "Produto não encontrado" });
    req.io.emit("produto:atualizado", rows[0]);
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/produtos/:id  — admin (desativa, não apaga)
router.delete("/:id", auth, async (req, res) => {
  try {
    const { rows } = await db.query(
      "UPDATE produtos SET ativo=false WHERE id=$1 RETURNING id",
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: "Produto não encontrado" });
    req.io.emit("produto:removido", { id: parseInt(req.params.id) });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
