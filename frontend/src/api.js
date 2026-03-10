// ── Configuração base ─────────────────────────────────────────────────────
const BASE = import.meta.env.VITE_API_URL || "";

function token() {
  return localStorage.getItem("admin_token") || "";
}

async function request(method, path, body) {
  const headers = { "Content-Type": "application/json" };
  if (token()) headers["Authorization"] = `Bearer ${token()}`;

  const res = await fetch(`${BASE}/api${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || "Erro desconhecido");
  }
  return res.json();
}

// ── Auth ──────────────────────────────────────────────────────────────────
export const auth = {
  login:  (username, password) => request("POST", "/auth/login", { username, password }),
  verify: ()                   => request("GET",  "/auth/verify"),
};

// ── Produtos ──────────────────────────────────────────────────────────────
export const produtos = {
  listar:  ()       => request("GET",    "/produtos"),
  todos:   ()       => request("GET",    "/produtos/todos"),
  criar:   (data)   => request("POST",   "/produtos", data),
  atualizar:(id, d) => request("PUT",    `/produtos/${id}`, d),
  remover: (id)     => request("DELETE", `/produtos/${id}`),
};

// ── Pedidos ───────────────────────────────────────────────────────────────
export const pedidos = {
  criar:          (data)          => request("POST",  "/pedidos", data),
  listar:         (params = {})   => request("GET",   "/pedidos?" + new URLSearchParams(params)),
  atualizarStatus:(numero, status)=> request("PATCH", `/pedidos/${numero}/status`, { status }),
  statsHoje:      ()              => request("GET",   "/pedidos/stats/hoje"),
};

// ── Marca ─────────────────────────────────────────────────────────────────
export const marca = {
  carregar:   ()     => request("GET", "/marca"),
  atualizar:  (data) => request("PUT", "/marca", data),
};
