require("dotenv").config();
const express    = require("express");
const http       = require("http");
const { Server } = require("socket.io");
const cors       = require("cors");

const app    = express();
const server = http.createServer(app);

// ── Socket.io ──────────────────────────────────────────────────────────────
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "*",
    methods: ["GET", "POST"],
  },
});

io.on("connection", (socket) => {
  console.log(`[WS] Cliente conectado: ${socket.id}`);
  socket.on("disconnect", () => {
    console.log(`[WS] Cliente desconectado: ${socket.id}`);
  });
});

// ── Middlewares globais ────────────────────────────────────────────────────
app.use(cors({ origin: process.env.FRONTEND_URL || "*", credentials: true }));
app.use(express.json());

// Injeta io em todas as rotas via req.io
app.use((req, _res, next) => { req.io = io; next(); });

// ── Rotas ──────────────────────────────────────────────────────────────────
app.use("/api/auth",     require("./routes/auth"));
app.use("/api/produtos", require("./routes/produtos"));
app.use("/api/pedidos",  require("./routes/pedidos"));
app.use("/api/marca",    require("./routes/marca"));

// Health check
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// ── 404 ────────────────────────────────────────────────────────────────────
app.use((_req, res) => res.status(404).json({ error: "Rota não encontrada" }));

// ── Error handler ──────────────────────────────────────────────────────────
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: "Erro interno do servidor" });
});

// ── Start ──────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`\n🍕 Servidor rodando na porta ${PORT}`);
  console.log(`   Health: http://localhost:${PORT}/api/health`);
  console.log(`   Ambiente: ${process.env.NODE_ENV || "development"}\n`);
});
