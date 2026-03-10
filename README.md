# 🍕 Sistema de Delivery — Guia Completo de Deploy

## Visão Geral da Arquitetura

```
┌─────────────────────┐     API REST     ┌──────────────────────┐
│   Frontend (React)  │ ◄──────────────► │  Backend (Node.js)   │
│   Vercel (grátis)   │   WebSocket      │  Railway (~$5/mês)   │
└─────────────────────┘                  └──────────┬───────────┘
                                                     │
                                          ┌──────────▼───────────┐
                                          │  PostgreSQL Database  │
                                          │  Railway (incluso)    │
                                          └──────────────────────┘
```

---

## PASSO 1 — Configurar o Backend no Railway

### 1.1 Crie a conta
Acesse **railway.app** e crie uma conta gratuita (com GitHub).

### 1.2 Crie o projeto
1. Clique em **New Project**
2. Selecione **Deploy from GitHub repo**
3. Conecte seu GitHub e envie a pasta `backend/` como repositório
4. Railway detecta Node.js automaticamente

### 1.3 Adicione o banco PostgreSQL
1. No projeto, clique em **Add a Service → Database → PostgreSQL**
2. Railway cria o banco e gera a `DATABASE_URL` automaticamente

### 1.4 Configure as variáveis de ambiente
No painel Railway → seu serviço Node → aba **Variables**:

```
DATABASE_URL        = (Railway preenche automaticamente)
PORT                = 3001
NODE_ENV            = production
JWT_SECRET          = coloque_uma_senha_longa_e_aleatoria_aqui
ADMIN_USERNAME      = admin
ADMIN_PASSWORD      = suaSenhaForte123
FRONTEND_URL        = https://seu-site.vercel.app
```

### 1.5 Configure o start command
No Railway → Settings → adicione:
```
npm run setup && npm start
```
Isso cria as tabelas e inicia o servidor.

### 1.6 Anote a URL do backend
Railway gera algo como: `https://pizzaria-backend-production.railway.app`

---

## PASSO 2 — Deploy do Frontend na Vercel

### 2.1 Crie a conta
Acesse **vercel.com** e conecte seu GitHub.

### 2.2 Envie o frontend para o GitHub
Crie um repositório separado com a pasta `frontend/` e conecte à Vercel.

### 2.3 Configure a variável de ambiente
Na Vercel → Settings → Environment Variables:

```
VITE_API_URL = https://pizzaria-backend-production.railway.app
```

### 2.4 Deploy
Clique em **Deploy**. A Vercel vai:
- Instalar dependências (`npm install`)
- Fazer o build (`npm run build`)
- Publicar em `https://seu-projeto.vercel.app`

---

## PASSO 3 — Domínio Personalizado (Opcional)

### 3.1 Compre o domínio
- **registro.br** → R$ 40/ano para `.com.br`
- **namecheap.com** → ~R$ 50/ano para `.com`

### 3.2 Configure na Vercel
1. Vercel → seu projeto → Settings → Domains
2. Adicione `labellapizza.com.br`
3. Vercel mostra os DNS records para configurar

### 3.3 Aponte o DNS no registro.br
Adicione os registros que a Vercel indicou. Propaga em até 24h.

---

## PASSO 4 — Teste o Sistema Completo

```bash
# 1. Verifique se o backend está online
curl https://SEU-BACKEND.railway.app/api/health

# Resposta esperada:
{"status":"ok","timestamp":"2024-01-01T00:00:00.000Z"}

# 2. Verifique o cardápio
curl https://SEU-BACKEND.railway.app/api/produtos

# 3. Acesse o site
# https://seu-site.vercel.app

# 4. Acesse o admin
# https://seu-site.vercel.app → botão ⚙️ Admin
# Usuário: admin
# Senha: (a que você configurou em ADMIN_PASSWORD)
```

---

## Estrutura do Projeto

```
pizzaria/
├── backend/
│   ├── server.js          # Entrada do servidor
│   ├── package.json
│   ├── .env.example       # Copie para .env
│   ├── db/
│   │   ├── index.js       # Pool de conexão PostgreSQL
│   │   └── setup.js       # Cria tabelas + dados iniciais
│   ├── routes/
│   │   ├── auth.js        # Login admin (JWT)
│   │   ├── produtos.js    # CRUD cardápio
│   │   ├── pedidos.js     # Criar e gerenciar pedidos
│   │   └── marca.js       # Configurações visuais
│   └── middleware/
│       └── auth.js        # Verifica JWT
│
└── frontend/
    ├── index.html
    ├── vite.config.js
    ├── package.json
    ├── .env.example       # Copie para .env.local
    └── src/
        ├── main.jsx       # Entry point React
        ├── App.jsx        # Aplicação completa
        ├── api.js         # Todas as chamadas à API
        └── useSocket.js   # Hook de WebSocket (tempo real)
```

---

## API Reference

| Método | Rota                           | Acesso | Descrição                     |
|--------|--------------------------------|--------|-------------------------------|
| GET    | /api/health                    | Público| Status do servidor            |
| POST   | /api/auth/login                | Público| Login admin                   |
| GET    | /api/auth/verify               | Admin  | Verifica token JWT            |
| GET    | /api/produtos                  | Público| Lista produtos ativos         |
| GET    | /api/produtos/todos            | Admin  | Lista todos (incl. inativos)  |
| POST   | /api/produtos                  | Admin  | Cria produto                  |
| PUT    | /api/produtos/:id              | Admin  | Atualiza produto              |
| DELETE | /api/produtos/:id              | Admin  | Desativa produto              |
| POST   | /api/pedidos                   | Público| Cria pedido                   |
| GET    | /api/pedidos                   | Admin  | Lista pedidos (c/ filtros)    |
| PATCH  | /api/pedidos/:numero/status    | Admin  | Atualiza status               |
| GET    | /api/pedidos/stats/hoje        | Admin  | Estatísticas do dia           |
| GET    | /api/marca                     | Público| Configurações visuais         |
| PUT    | /api/marca                     | Admin  | Atualiza configurações        |

### Eventos WebSocket (Socket.io)
| Evento              | Direção       | Descrição                    |
|---------------------|---------------|------------------------------|
| pedido:novo         | Server→Client | Novo pedido chegou           |
| pedido:status       | Server→Client | Status do pedido mudou       |
| produto:criado      | Server→Client | Produto adicionado           |
| produto:atualizado  | Server→Client | Produto editado              |
| produto:removido    | Server→Client | Produto removido             |
| marca:atualizada    | Server→Client | Configurações visuais mudaram|

---

## Rodando Localmente (Desenvolvimento)

### Pré-requisitos
- Node.js 18+
- PostgreSQL instalado localmente OU usar a URL do Railway

### Backend
```bash
cd backend
npm install
cp .env.example .env
# edite .env com suas configs
npm run setup   # cria tabelas
npm run dev     # inicia com nodemon
```

### Frontend
```bash
cd frontend
npm install
cp .env.example .env.local
# VITE_API_URL pode ficar vazio em dev (proxy do Vite cuida)
npm run dev     # http://localhost:5173
```

---

## Custos Estimados

| Serviço       | Plano   | Custo       |
|---------------|---------|-------------|
| Vercel        | Hobby   | **Grátis**  |
| Railway       | Starter | ~R$ 25/mês  |
| Domínio .com.br| -      | ~R$ 40/ano  |
| **Total**     |         | **~R$ 25/mês**|

---

## Checklist de Entrega ao Cliente

- [ ] Deploy do backend no Railway funcionando
- [ ] Deploy do frontend na Vercel funcionando
- [ ] Banco configurado com dados iniciais
- [ ] Domínio personalizado apontando
- [ ] Credenciais de admin definidas e testadas
- [ ] Fazer um pedido de teste completo
- [ ] Painel admin recebendo pedido em tempo real
- [ ] Editor de marca salvo no banco
- [ ] Documento de uso entregue ao cliente
