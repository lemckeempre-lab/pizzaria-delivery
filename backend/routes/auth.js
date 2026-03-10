const router   = require("express").Router();
const bcrypt   = require("bcryptjs");
const jwt      = require("jsonwebtoken");

// POST /api/auth/login
router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: "Usuário e senha obrigatórios" });
    }

    const validUser = username === process.env.ADMIN_USERNAME;
    const validPass = password === process.env.ADMIN_PASSWORD;

    if (!validUser || !validPass) {
      return res.status(401).json({ error: "Credenciais inválidas" });
    }

    const token = jwt.sign(
      { username, role: "admin" },
      process.env.JWT_SECRET,
      { expiresIn: "12h" }
    );

    res.json({ token, username });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/auth/verify  — checa se token ainda é válido
router.get("/verify", require("../middleware/auth"), (req, res) => {
  res.json({ valid: true, admin: req.admin });
});

module.exports = router;
