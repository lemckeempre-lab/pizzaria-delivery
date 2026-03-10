const router = require("express").Router();
const db     = require("../db");
const auth   = require("../middleware/auth");

// GET /api/marca  — público
router.get("/", async (req, res) => {
  try {
    const { rows } = await db.query("SELECT * FROM config_marca WHERE id=1");
    const m = rows[0];
    res.json({
      name:    m.nome,
      emoji:   m.emoji,
      tagline: m.tagline,
      pix:     m.pix,
      color: {
        name:    m.cor_nome,
        primary: m.cor_primaria,
        dark:    m.cor_escura,
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/marca  — admin
router.put("/", auth, async (req, res) => {
  try {
    const { name, emoji, tagline, pix, color } = req.body;
    const { rows } = await db.query(
      `UPDATE config_marca SET
         nome=$1, emoji=$2, tagline=$3, pix=$4,
         cor_primaria=$5, cor_escura=$6, cor_nome=$7
       WHERE id=1 RETURNING *`,
      [name, emoji, tagline, pix, color.primary, color.dark, color.name]
    );
    const m = rows[0];
    const brand = {
      name: m.nome, emoji: m.emoji, tagline: m.tagline, pix: m.pix,
      color: { name: m.cor_nome, primary: m.cor_primaria, dark: m.cor_escura },
    };
    req.io.emit("marca:atualizada", brand);
    res.json(brand);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
