import { useState, useEffect, useRef, useCallback } from "react";

// ─── Paleta & tema ────────────────────────────────────────────────────────────
const TEMAS = [
  { nome: "Brasa",    primary: "#C41E3A", dark: "#8b0f24", accent: "#FF6B35" },
  { nome: "Floresta", primary: "#2d7a3a", dark: "#1b4d24", accent: "#7DC95E" },
  { nome: "Oceano",   primary: "#1a3c6e", dark: "#0f2344", accent: "#4FC3F7" },
  { nome: "Pôr do Sol",primary:"#e8650a", dark: "#b34d07", accent: "#FFD166" },
  { nome: "Violeta",  primary: "#6b2fa0", dark: "#481f6d", accent: "#C77DFF" },
  { nome: "Antracite",primary: "#1e1e2e", dark: "#111118", accent: "#E2B96F" },
];

const LOGOS = ["🍕","🔥","⭐","🌿","👨‍🍳","🫕","🍽️","🏠","✨","🇮🇹","🌶️","🧑‍🍳"];

const PRODUTOS_INICIAIS = [
  { id:1,  nome:"Margherita Clássica",   desc:"Molho de tomate, mozzarella fior di latte, manjericão fresco",  preco:42.90, cat:"Pizzas",     emoji:"🍕", badge:"Clássica",   ativo:true },
  { id:2,  nome:"Pepperoni Suprema",     desc:"Molho especial, mozzarella, pepperoni importado, orégano",       preco:52.90, cat:"Pizzas",     emoji:"🔥", badge:"Mais Pedida",ativo:true },
  { id:3,  nome:"Quatro Queijos",        desc:"Mozzarella, parmesão, gorgonzola, provolone, fio de mel",        preco:55.90, cat:"Pizzas",     emoji:"🧀", badge:null,         ativo:true },
  { id:4,  nome:"Frango com Catupiry",   desc:"Molho branco, frango desfiado, catupiry original, milho",        preco:49.90, cat:"Pizzas",     emoji:"🍗", badge:"Favorita",   ativo:true },
  { id:5,  nome:"Portuguesa",            desc:"Molho, mozzarella, presunto, ovos, cebola, azeitonas",           preco:51.90, cat:"Pizzas",     emoji:"🫒", badge:null,         ativo:true },
  { id:6,  nome:"Calabresa Artesanal",   desc:"Molho artesanal, calabresa defumada, cebola caramelizada",       preco:47.90, cat:"Pizzas",     emoji:"🌶️",badge:null,         ativo:true },
  { id:7,  nome:"Napolitana",            desc:"Molho San Marzano, tomate cereja, parmesão, rúcula",             preco:53.90, cat:"Pizzas",     emoji:"🍅", badge:"Chef",       ativo:true },
  { id:8,  nome:"Combo Família",         desc:"2 Pizzas grandes + 2 Refrigerantes 2L + 1 Sobremesa",           preco:139.90,cat:"Combos",     emoji:"👨‍👩‍👧‍👦",badge:"Oferta",      ativo:true },
  { id:9,  nome:"Combo Casal",           desc:"1 Pizza grande + 1 Pizza pequena + 2 Refrigerantes lata",        preco:89.90, cat:"Combos",     emoji:"💑", badge:"Popular",    ativo:true },
  { id:10, nome:"Coca-Cola 2L",          desc:"Refrigerante gelado 2 litros",                                   preco:14.90, cat:"Bebidas",    emoji:"🥤", badge:null,         ativo:true },
  { id:11, nome:"Água Mineral 500ml",    desc:"Água mineral sem gás gelada",                                    preco:5.90,  cat:"Bebidas",    emoji:"💧", badge:null,         ativo:true },
  { id:12, nome:"Suco Natural 500ml",    desc:"Laranja, maracujá ou limão, espremido na hora",                  preco:12.90, cat:"Bebidas",    emoji:"🍊", badge:"Fresco",     ativo:true },
  { id:13, nome:"Tiramisu da Casa",      desc:"Receita italiana original com mascarpone e café expresso",       preco:22.90, cat:"Sobremesas", emoji:"🍰", badge:"Especial",   ativo:true },
  { id:14, nome:"Petit Gâteau",          desc:"Bolo quente de chocolate com sorvete de baunilha",               preco:24.90, cat:"Sobremesas", emoji:"🍫", badge:null,         ativo:true },
  { id:15, nome:"Gelato Artesanal",      desc:"3 bolas: pistache, stracciatella ou framboesa",                  preco:18.90, cat:"Sobremesas", emoji:"🍨", badge:"Novo",       ativo:true },
];

const CATS = ["Todos","Pizzas","Combos","Bebidas","Sobremesas"];
const CAT_ICONS = { Todos:"🍽️",Pizzas:"🍕",Combos:"🎁",Bebidas:"🥤",Sobremesas:"🍰" };
const STATUS_LIST = ["Recebido","Em preparo","Saiu p/ entrega","Entregue"];
const STATUS_COLOR = {
  "Recebido":        { bg:"#fff8e1", txt:"#f59e0b", dot:"#f59e0b" },
  "Em preparo":      { bg:"#e0f2fe", txt:"#0284c7", dot:"#0284c7" },
  "Saiu p/ entrega": { bg:"#fff7ed", txt:"#ea580c", dot:"#ea580c" },
  "Entregue":        { bg:"#dcfce7", txt:"#16a34a", dot:"#16a34a" },
};

// ─── Persistência local ───────────────────────────────────────────────────────
function useLS(key, init) {
  const [val, setVal] = useState(() => {
    try { const s = localStorage.getItem(key); return s ? JSON.parse(s) : init; }
    catch { return init; }
  });
  const save = useCallback((v) => {
    setVal(v);
    try { localStorage.setItem(key, JSON.stringify(v)); } catch {}
  }, [key]);
  return [val, save];
}

// ─── Utilitários ──────────────────────────────────────────────────────────────
const R = (v) => `R$\u00A0${Number(v).toFixed(2).replace(".", ",")}`;
const nowStr = () => new Date().toLocaleTimeString("pt-BR", { hour:"2-digit", minute:"2-digit" });
const dateStr = () => new Date().toLocaleDateString("pt-BR");
const numPed = () => `#${String(Math.floor(1000 + Math.random() * 9000))}`;

// ─── CSS global injetado ──────────────────────────────────────────────────────
const GlobalCSS = ({ primary, dark, accent }) => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;600;700&family=DM+Sans:wght@400;500;600&display=swap');
    *, *::before, *::after { box-sizing: border-box; margin:0; padding:0; }
    :root {
      --p: ${primary};
      --d: ${dark};
      --a: ${accent};
      --cream: #FFF8F0;
      --ink: #1a1008;
      --muted: #8a7060;
      --border: #e8ddd4;
      --card: #ffffff;
      --radius: 16px;
    }
    html { scroll-behavior: smooth; }
    body { font-family: 'DM Sans', sans-serif; background: var(--cream); color: var(--ink); -webkit-font-smoothing: antialiased; }
    button { font-family: inherit; cursor: pointer; border:none; outline:none; }
    input, select, textarea { font-family: inherit; outline:none; }
    ::-webkit-scrollbar { width:6px; height:6px; }
    ::-webkit-scrollbar-track { background: transparent; }
    ::-webkit-scrollbar-thumb { background: var(--border); border-radius:99px; }

    @keyframes fadeUp   { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
    @keyframes slideIn  { from { transform:translateX(100%); } to { transform:translateX(0); } }
    @keyframes slideOut { from { transform:translateX(0); } to { transform:translateX(100%); } }
    @keyframes popIn    { from { opacity:0; transform:scale(.88); } to { opacity:1; transform:scale(1); } }
    @keyframes spin     { to { transform:rotate(360deg); } }
    @keyframes pulse    { 0%,100%{transform:scale(1);} 50%{transform:scale(1.12);} }
    @keyframes shimmer  { to { background-position: -200% center; } }
    @keyframes toastIn  { from{opacity:0;transform:translateX(-50%) translateY(20px);} to{opacity:1;transform:translateX(-50%) translateY(0);} }

    .fade-up   { animation: fadeUp .4s ease both; }
    .pop-in    { animation: popIn .3s cubic-bezier(.34,1.56,.64,1) both; }

    .card-hover {
      transition: transform .22s ease, box-shadow .22s ease;
    }
    .card-hover:hover {
      transform: translateY(-4px);
      box-shadow: 0 16px 40px rgba(0,0,0,.12);
    }

    .btn-primary {
      background: var(--p);
      color: #fff;
      border-radius: 99px;
      padding: 12px 28px;
      font-weight: 600;
      font-size: 15px;
      transition: all .2s;
      box-shadow: 0 4px 16px color-mix(in srgb, var(--p) 40%, transparent);
    }
    .btn-primary:hover { background: var(--d); transform:translateY(-1px); }
    .btn-primary:active { transform:translateY(0); }

    .btn-ghost {
      background: transparent;
      border: 1.5px solid var(--border);
      color: var(--muted);
      border-radius: 99px;
      padding: 10px 22px;
      font-size: 14px;
      font-weight: 500;
      transition: all .2s;
    }
    .btn-ghost:hover { border-color: var(--p); color: var(--p); }

    .input-base {
      width:100%;
      border: 1.5px solid var(--border);
      border-radius: 12px;
      padding: 11px 14px;
      font-size: 14px;
      background: #fff;
      color: var(--ink);
      transition: border-color .2s;
    }
    .input-base:focus { border-color: var(--p); }
    .input-base::placeholder { color: #b8a898; }

    .overlay {
      position:fixed; inset:0;
      background: rgba(10,5,0,.52);
      backdrop-filter: blur(4px);
      z-index: 200;
    }

    .drawer {
      position:fixed; top:0; right:0; bottom:0;
      width: min(480px, 100vw);
      background: var(--cream);
      z-index: 201;
      display:flex; flex-direction:column;
      box-shadow: -20px 0 60px rgba(0,0,0,.2);
    }
    .drawer.enter { animation: slideIn .35s cubic-bezier(.25,.46,.45,.94) both; }
    .drawer.exit  { animation: slideOut .3s ease forwards; }

    .modal-wrap {
      position:fixed; inset:0;
      display:flex; align-items:center; justify-content:center;
      z-index:202; padding:16px;
    }
    .modal {
      background: #fff;
      border-radius: 24px;
      padding: 32px;
      width: 100%;
      max-width: 480px;
      max-height: 90vh;
      overflow-y: auto;
      animation: popIn .3s cubic-bezier(.34,1.56,.64,1) both;
    }

    .tag {
      display:inline-block;
      font-size:10px; font-weight:700; letter-spacing:.6px; text-transform:uppercase;
      padding:3px 9px; border-radius:99px;
      background: color-mix(in srgb, var(--p) 12%, transparent);
      color: var(--p);
    }
  `}</style>
);

// ─── Toast ────────────────────────────────────────────────────────────────────
function Toast({ msg, onDone }) {
  useEffect(() => { const t = setTimeout(onDone, 2400); return () => clearTimeout(t); }, []);
  return (
    <div style={{
      position:"fixed", bottom:90, left:"50%",
      transform:"translateX(-50%)",
      background:"#1a1008", color:"#fff",
      padding:"11px 22px", borderRadius:99,
      fontFamily:"'DM Sans',sans-serif", fontSize:14, fontWeight:500,
      zIndex:9999, whiteSpace:"nowrap",
      animation:"toastIn .3s ease both",
      boxShadow:"0 8px 30px rgba(0,0,0,.35)",
      display:"flex", alignItems:"center", gap:8,
    }}>
      <span style={{fontSize:16}}>✓</span> {msg}
    </div>
  );
}

// ─── Navbar ───────────────────────────────────────────────────────────────────
function Navbar({ marca, cartCount, onCart, onAdmin, search, onSearch }) {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", h);
    return () => window.removeEventListener("scroll", h);
  }, []);
  const p = marca.tema.primary;
  return (
    <nav style={{
      position:"sticky", top:0, zIndex:100,
      background: p,
      boxShadow: scrolled ? `0 4px 24px rgba(0,0,0,.25)` : "none",
      transition:"box-shadow .3s",
    }}>
      <div style={{ maxWidth:960, margin:"0 auto", padding:"0 20px", height:64, display:"flex", alignItems:"center", gap:12 }}>
        <button onClick={onAdmin} style={{ background:"none", display:"flex", alignItems:"center", gap:9, flexShrink:0, padding:"4px 0" }}>
          <span style={{ fontSize:28 }}>{marca.logo}</span>
          <span style={{ fontFamily:"'Cormorant Garamond',serif", fontWeight:700, fontSize:21, color:"#FFF8F0", letterSpacing:".3px" }}>
            {marca.nome}
          </span>
        </button>
        <div style={{ flex:1, position:"relative" }}>
          <input
            value={search} onChange={e => onSearch(e.target.value)}
            placeholder="Buscar pizzas, bebidas..."
            style={{
              width:"100%", padding:"9px 14px 9px 38px",
              borderRadius:99, border:"none",
              background:"rgba(255,255,255,.18)", color:"#fff",
              fontSize:14,
            }}
          />
          <span style={{ position:"absolute", left:13, top:"50%", transform:"translateY(-50%)", fontSize:14, opacity:.75 }}>🔍</span>
        </div>
        <button onClick={onCart} style={{
          background:"rgba(255,255,255,.18)", border:"2px solid rgba(255,255,255,.35)",
          borderRadius:99, padding:"8px 16px",
          color:"#fff", fontWeight:600, fontSize:14, flexShrink:0,
          display:"flex", alignItems:"center", gap:7,
          transition:"background .2s",
        }}>
          🛒
          {cartCount > 0 && (
            <span style={{
              background:"#fff", color:p, borderRadius:99,
              padding:"1px 8px", fontSize:12, fontWeight:700,
              animation:"pulse .4s ease",
            }}>{cartCount}</span>
          )}
        </button>
      </div>
    </nav>
  );
}

// ─── Hero ─────────────────────────────────────────────────────────────────────
function Hero({ marca }) {
  const p = marca.tema.primary;
  const a = marca.tema.accent;
  return (
    <div style={{
      background:`linear-gradient(135deg, ${p} 0%, ${marca.tema.dark} 100%)`,
      padding:"56px 20px 48px",
      position:"relative", overflow:"hidden",
    }}>
      {/* decorative circles */}
      {[
        { size:260, top:-80, right:-60, op:.08 },
        { size:160, bottom:-40, left:40,  op:.1  },
        { size:90,  top:20,  left:"55%", op:.07 },
      ].map((c,i) => (
        <div key={i} style={{
          position:"absolute",
          width:c.size, height:c.size, borderRadius:"50%",
          background:`rgba(255,255,255,${c.op})`,
          top:c.top, bottom:c.bottom, left:c.left, right:c.right,
          pointerEvents:"none",
        }}/>
      ))}
      <div style={{ maxWidth:680, margin:"0 auto", textAlign:"center", position:"relative" }}>
        <div style={{ fontSize:64, marginBottom:16, filter:"drop-shadow(0 4px 12px rgba(0,0,0,.2))" }}>
          {marca.logo}
        </div>
        <h1 style={{
          fontFamily:"'Cormorant Garamond',serif", fontWeight:700,
          fontSize:"clamp(32px,6vw,52px)", color:"#FFF8F0",
          lineHeight:1.15, marginBottom:14, letterSpacing:"-.5px",
        }}>
          {marca.nome}
        </h1>
        <p style={{
          color:"rgba(255,248,240,.75)", fontSize:17,
          lineHeight:1.6, marginBottom:28, maxWidth:480, margin:"0 auto 28px",
        }}>
          {marca.tagline}
        </p>
        <div style={{ display:"flex", gap:10, justifyContent:"center", flexWrap:"wrap" }}>
          {["🕐 40–60 min","🚀 Entrega rápida","⭐ 4.9 avaliação"].map(t => (
            <span key={t} style={{
              background:"rgba(255,255,255,.15)", backdropFilter:"blur(6px)",
              border:"1px solid rgba(255,255,255,.25)", borderRadius:99,
              padding:"7px 16px", color:"#FFF8F0", fontSize:13, fontWeight:500,
            }}>{t}</span>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── CategoryBar ──────────────────────────────────────────────────────────────
function CategoryBar({ selected, onSelect }) {
  return (
    <div style={{
      background:"#fff", borderBottom:"1px solid var(--border)",
      position:"sticky", top:64, zIndex:90,
      overflowX:"auto", WebkitOverflowScrolling:"touch",
    }}>
      <div style={{
        display:"flex", gap:6, padding:"10px 20px",
        maxWidth:960, margin:"0 auto", minWidth:"max-content",
      }}>
        {CATS.map(cat => (
          <button key={cat} onClick={() => onSelect(cat)} style={{
            padding:"8px 20px", borderRadius:99,
            border:`2px solid ${selected===cat ? "var(--p)" : "transparent"}`,
            background: selected===cat ? "var(--p)" : "#f5f0eb",
            color: selected===cat ? "#fff" : "var(--muted)",
            fontWeight: selected===cat ? 600 : 400,
            fontSize:14, transition:"all .2s", whiteSpace:"nowrap",
            display:"flex", alignItems:"center", gap:6,
          }}>
            <span>{CAT_ICONS[cat]}</span> {cat}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── ProductCard ──────────────────────────────────────────────────────────────
function ProductCard({ p, onAdd }) {
  const [popped, setPopped] = useState(false);
  const add = () => {
    setPopped(true);
    setTimeout(() => setPopped(false), 600);
    onAdd(p);
  };
  return (
    <div className="card-hover" style={{
      background:"var(--card)", borderRadius:"var(--radius)",
      border:"1px solid var(--border)",
      overflow:"hidden", display:"flex", flexDirection:"column",
    }}>
      <div style={{
        background:`linear-gradient(135deg, color-mix(in srgb, var(--p) 8%, #fff8f0) 0%, #fff8f0 100%)`,
        padding:"28px 20px", textAlign:"center", fontSize:52,
        lineHeight:1,
      }}>
        {p.emoji}
      </div>
      <div style={{ padding:"16px 18px 18px", flex:1, display:"flex", flexDirection:"column", gap:8 }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:8 }}>
          <h3 style={{ fontFamily:"'Cormorant Garamond',serif", fontWeight:700, fontSize:17, lineHeight:1.3, flex:1 }}>
            {p.nome}
          </h3>
          {p.badge && <span className="tag">{p.badge}</span>}
        </div>
        <p style={{ color:"var(--muted)", fontSize:13, lineHeight:1.5, flex:1 }}>{p.desc}</p>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginTop:4 }}>
          <span style={{
            fontFamily:"'Cormorant Garamond',serif", fontWeight:700, fontSize:22,
            color:"var(--p)",
          }}>{R(p.preco)}</span>
          <button onClick={add} style={{
            background:"var(--p)", color:"#fff",
            border:"none", borderRadius:99, width:38, height:38,
            fontSize:20, display:"flex", alignItems:"center", justifyContent:"center",
            transition:"all .2s",
            transform: popped ? "scale(1.25)" : "scale(1)",
            boxShadow:"0 4px 14px color-mix(in srgb, var(--p) 40%, transparent)",
          }}>+</button>
        </div>
      </div>
    </div>
  );
}

// ─── Carrinho Drawer ──────────────────────────────────────────────────────────
function CartDrawer({ cart, onClose, onUpdate, onCheckout, marca }) {
  const total = cart.reduce((s,i) => s + i.preco * i.qty, 0);
  return (
    <>
      <div className="overlay" onClick={onClose}/>
      <div className="drawer enter">
        {/* Header */}
        <div style={{
          padding:"20px 24px", borderBottom:"1px solid var(--border)",
          display:"flex", justifyContent:"space-between", alignItems:"center",
          background:"var(--p)",
        }}>
          <div>
            <h2 style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:22, fontWeight:700, color:"#FFF8F0" }}>
              🛒 Carrinho
            </h2>
            <p style={{ color:"rgba(255,248,240,.7)", fontSize:13, marginTop:2 }}>
              {cart.length === 0 ? "Vazio" : `${cart.reduce((s,i)=>s+i.qty,0)} itens`}
            </p>
          </div>
          <button onClick={onClose} style={{
            background:"rgba(255,255,255,.2)", border:"none", borderRadius:99,
            width:36, height:36, fontSize:18, color:"#fff",
            display:"flex", alignItems:"center", justifyContent:"center",
          }}>✕</button>
        </div>

        {/* Items */}
        <div style={{ flex:1, overflowY:"auto", padding:"16px 24px" }}>
          {cart.length === 0 ? (
            <div style={{ textAlign:"center", padding:"60px 0", color:"var(--muted)" }}>
              <div style={{ fontSize:52, marginBottom:12 }}>🍕</div>
              <p style={{ fontSize:15 }}>Seu carrinho está vazio</p>
              <p style={{ fontSize:13, marginTop:6, opacity:.7 }}>Adicione suas pizzas favoritas!</p>
            </div>
          ) : cart.map(item => (
            <div key={item.id} style={{
              display:"flex", alignItems:"center", gap:14, padding:"14px 0",
              borderBottom:"1px solid var(--border)",
            }}>
              <span style={{ fontSize:32 }}>{item.emoji}</span>
              <div style={{ flex:1 }}>
                <p style={{ fontWeight:600, fontSize:14, lineHeight:1.3 }}>{item.nome}</p>
                <p style={{ color:"var(--p)", fontWeight:700, fontSize:14, marginTop:2 }}>{R(item.preco * item.qty)}</p>
              </div>
              <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                <button onClick={() => onUpdate(item.id, -1)} style={{
                  width:30, height:30, borderRadius:99,
                  border:"1.5px solid var(--border)", background:"#fff",
                  fontSize:16, display:"flex", alignItems:"center", justifyContent:"center",
                  color:"var(--muted)", transition:"all .15s",
                }}>−</button>
                <span style={{ fontWeight:700, fontSize:15, minWidth:20, textAlign:"center" }}>{item.qty}</span>
                <button onClick={() => onUpdate(item.id, +1)} style={{
                  width:30, height:30, borderRadius:99,
                  background:"var(--p)", border:"none",
                  fontSize:16, color:"#fff",
                  display:"flex", alignItems:"center", justifyContent:"center",
                  transition:"all .15s",
                }}>+</button>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        {cart.length > 0 && (
          <div style={{
            padding:"20px 24px", borderTop:"1px solid var(--border)",
            background:"#fff",
          }}>
            <div style={{ display:"flex", justifyContent:"space-between", marginBottom:16 }}>
              <span style={{ color:"var(--muted)", fontSize:14 }}>Total do pedido</span>
              <span style={{ fontFamily:"'Cormorant Garamond',serif", fontWeight:700, fontSize:24, color:"var(--p)" }}>
                {R(total)}
              </span>
            </div>
            <button className="btn-primary" onClick={onCheckout} style={{ width:"100%", padding:"15px" }}>
              Finalizar pedido →
            </button>
          </div>
        )}
      </div>
    </>
  );
}

// ─── Checkout Modal ───────────────────────────────────────────────────────────
function CheckoutModal({ cart, onClose, onConfirm, marca }) {
  const total = cart.reduce((s,i) => s + i.preco * i.qty, 0);
  const [form, setForm] = useState({ nome:"", tel:"", rua:"", num:"", bairro:"", cidade:"São Paulo", comp:"", pgto:"pix" });
  const [step, setStep] = useState(1); // 1=dados, 2=pagamento, 3=confirmado
  const [pedNum] = useState(numPed);
  const up = (k,v) => setForm(f=>({...f,[k]:v}));

  const canNext = form.nome && form.tel && form.rua && form.num && form.bairro;

  const confirm = () => {
    onConfirm({
      numero: pedNum,
      ...form,
      itens: cart,
      total,
      horario: nowStr(),
      data: dateStr(),
      status:"Recebido",
    });
    setStep(3);
  };

  return (
    <>
      <div className="overlay" onClick={onClose}/>
      <div className="modal-wrap">
        <div className="modal">
          {step === 3 ? (
            <div style={{ textAlign:"center", padding:"20px 0" }}>
              <div style={{ fontSize:64, marginBottom:16 }}>🎉</div>
              <h2 style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:28, fontWeight:700, marginBottom:8 }}>
                Pedido confirmado!
              </h2>
              <p style={{ color:"var(--muted)", marginBottom:6 }}>Pedido {pedNum}</p>
              <div style={{
                background:"color-mix(in srgb, var(--p) 8%, #fff8f0)",
                borderRadius:16, padding:"20px", margin:"20px 0", textAlign:"left",
              }}>
                <p style={{ fontSize:13, color:"var(--muted)", marginBottom:8 }}>Resumo</p>
                {cart.map(i => (
                  <div key={i.id} style={{ display:"flex", justifyContent:"space-between", fontSize:14, padding:"3px 0" }}>
                    <span>{i.emoji} {i.nome} ×{i.qty}</span>
                    <span style={{ fontWeight:600 }}>{R(i.preco*i.qty)}</span>
                  </div>
                ))}
                <div style={{ borderTop:"1px solid var(--border)", marginTop:10, paddingTop:10, display:"flex", justifyContent:"space-between", fontWeight:700, fontSize:16 }}>
                  <span>Total</span>
                  <span style={{ color:"var(--p)" }}>{R(total)}</span>
                </div>
              </div>
              {form.pgto === "pix" && (
                <div style={{
                  background:"#f0fdf4", borderRadius:12, padding:"14px 18px",
                  border:"1px solid #bbf7d0", marginBottom:20,
                }}>
                  <p style={{ fontSize:13, fontWeight:600, color:"#16a34a", marginBottom:4 }}>Chave PIX para pagamento:</p>
                  <p style={{ fontSize:15, fontWeight:700, letterSpacing:".5px" }}>{marca.pix}</p>
                </div>
              )}
              <p style={{ fontSize:13, color:"var(--muted)", marginBottom:20 }}>⏱ Tempo estimado: 40–60 minutos</p>
              <button className="btn-primary" onClick={onClose} style={{ width:"100%" }}>
                Fechar
              </button>
            </div>
          ) : step === 1 ? (
            <>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:24 }}>
                <h2 style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:22, fontWeight:700 }}>Dados da entrega</h2>
                <button onClick={onClose} style={{ background:"#f5f0eb", border:"none", borderRadius:99, width:34, height:34, fontSize:16 }}>✕</button>
              </div>
              <div style={{ display:"grid", gap:12 }}>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
                  <div>
                    <label style={{ fontSize:12, fontWeight:600, color:"var(--muted)", display:"block", marginBottom:5 }}>Nome *</label>
                    <input className="input-base" value={form.nome} onChange={e=>up("nome",e.target.value)} placeholder="Seu nome"/>
                  </div>
                  <div>
                    <label style={{ fontSize:12, fontWeight:600, color:"var(--muted)", display:"block", marginBottom:5 }}>Telefone *</label>
                    <input className="input-base" value={form.tel} onChange={e=>up("tel",e.target.value)} placeholder="(11) 99999-9999"/>
                  </div>
                </div>
                <div style={{ display:"grid", gridTemplateColumns:"2fr 1fr", gap:12 }}>
                  <div>
                    <label style={{ fontSize:12, fontWeight:600, color:"var(--muted)", display:"block", marginBottom:5 }}>Rua *</label>
                    <input className="input-base" value={form.rua} onChange={e=>up("rua",e.target.value)} placeholder="Rua, Av..."/>
                  </div>
                  <div>
                    <label style={{ fontSize:12, fontWeight:600, color:"var(--muted)", display:"block", marginBottom:5 }}>Número *</label>
                    <input className="input-base" value={form.num} onChange={e=>up("num",e.target.value)} placeholder="123"/>
                  </div>
                </div>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
                  <div>
                    <label style={{ fontSize:12, fontWeight:600, color:"var(--muted)", display:"block", marginBottom:5 }}>Bairro *</label>
                    <input className="input-base" value={form.bairro} onChange={e=>up("bairro",e.target.value)} placeholder="Bairro"/>
                  </div>
                  <div>
                    <label style={{ fontSize:12, fontWeight:600, color:"var(--muted)", display:"block", marginBottom:5 }}>Cidade</label>
                    <input className="input-base" value={form.cidade} onChange={e=>up("cidade",e.target.value)} placeholder="Cidade"/>
                  </div>
                </div>
                <div>
                  <label style={{ fontSize:12, fontWeight:600, color:"var(--muted)", display:"block", marginBottom:5 }}>Complemento</label>
                  <input className="input-base" value={form.comp} onChange={e=>up("comp",e.target.value)} placeholder="Apto, bloco..."/>
                </div>
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginTop:20 }}>
                <button className="btn-ghost" onClick={onClose}>Cancelar</button>
                <button className="btn-primary" onClick={()=>canNext&&setStep(2)} style={{ opacity:canNext?1:.5 }}>
                  Pagamento →
                </button>
              </div>
            </>
          ) : (
            <>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:24 }}>
                <h2 style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:22, fontWeight:700 }}>Forma de pagamento</h2>
                <button onClick={()=>setStep(1)} style={{ background:"#f5f0eb", border:"none", borderRadius:99, width:34, height:34, fontSize:16 }}>←</button>
              </div>
              <div style={{ display:"grid", gap:12, marginBottom:20 }}>
                {[
                  { val:"pix",    label:"PIX", icon:"🟢", desc:"Pagamento instantâneo" },
                  { val:"cartao", label:"Cartão", icon:"💳", desc:"Débito ou crédito na entrega" },
                  { val:"dinheiro",label:"Dinheiro", icon:"💵", desc:"Troco se necessário" },
                ].map(opt => (
                  <label key={opt.val} style={{
                    display:"flex", alignItems:"center", gap:14,
                    padding:"14px 18px", borderRadius:14,
                    border:`2px solid ${form.pgto===opt.val?"var(--p)":"var(--border)"}`,
                    background: form.pgto===opt.val ? "color-mix(in srgb, var(--p) 6%, white)" : "#fff",
                    cursor:"pointer", transition:"all .15s",
                  }}>
                    <input type="radio" value={opt.val} checked={form.pgto===opt.val} onChange={()=>up("pgto",opt.val)} style={{display:"none"}}/>
                    <span style={{ fontSize:24 }}>{opt.icon}</span>
                    <div style={{ flex:1 }}>
                      <p style={{ fontWeight:600, fontSize:15 }}>{opt.label}</p>
                      <p style={{ fontSize:12, color:"var(--muted)", marginTop:2 }}>{opt.desc}</p>
                    </div>
                    <div style={{
                      width:20, height:20, borderRadius:99,
                      border:`2px solid ${form.pgto===opt.val?"var(--p)":"var(--border)"}`,
                      background: form.pgto===opt.val?"var(--p)":"transparent",
                      display:"flex", alignItems:"center", justifyContent:"center",
                      transition:"all .15s",
                    }}>
                      {form.pgto===opt.val && <span style={{ color:"#fff", fontSize:10 }}>✓</span>}
                    </div>
                  </label>
                ))}
              </div>
              {/* Summary */}
              <div style={{
                background:"#f9f5f1", borderRadius:14, padding:"16px 18px", marginBottom:20,
              }}>
                <p style={{ fontSize:12, color:"var(--muted)", marginBottom:10, fontWeight:600 }}>RESUMO DO PEDIDO</p>
                {cart.map(i=>(
                  <div key={i.id} style={{ display:"flex", justifyContent:"space-between", fontSize:13, padding:"2px 0" }}>
                    <span>{i.emoji} {i.nome} ×{i.qty}</span>
                    <span style={{ fontWeight:600 }}>{R(i.preco*i.qty)}</span>
                  </div>
                ))}
                <div style={{ borderTop:"1px solid var(--border)", marginTop:10, paddingTop:10, display:"flex", justifyContent:"space-between", fontWeight:700, fontSize:16 }}>
                  <span>Total</span>
                  <span style={{ color:"var(--p)" }}>{R(total)}</span>
                </div>
              </div>
              <button className="btn-primary" onClick={confirm} style={{ width:"100%", padding:"15px", fontSize:16 }}>
                Confirmar pedido 🍕
              </button>
            </>
          )}
        </div>
      </div>
    </>
  );
}

// ─── Admin ────────────────────────────────────────────────────────────────────
function AdminPanel({ onClose, pedidos, produtos, setProdutos, marca, setMarca }) {
  const [tab, setTab] = useState("pedidos");
  const [editProd, setEditProd] = useState(null);
  const [newProd, setNewProd] = useState(false);
  const [form, setForm] = useState({ nome:"", desc:"", preco:"", cat:"Pizzas", emoji:"🍕", badge:"" });
  const up = (k,v) => setForm(f=>({...f,[k]:v}));

  const saveProd = () => {
    const p = { ...form, preco:parseFloat(form.preco)||0, ativo:true };
    if (editProd) {
      setProdutos(ps => ps.map(x => x.id===editProd.id ? {...x,...p} : x));
    } else {
      setProdutos(ps => [...ps, { ...p, id: Date.now() }]);
    }
    setEditProd(null); setNewProd(false);
    setForm({ nome:"", desc:"", preco:"", cat:"Pizzas", emoji:"🍕", badge:"" });
  };

  const toggleAtivo = (id) => setProdutos(ps => ps.map(p => p.id===id ? {...p, ativo:!p.ativo} : p));
  const delProd = (id) => setProdutos(ps => ps.filter(p => p.id!==id));

  const openEdit = (p) => { setEditProd(p); setNewProd(true); setForm({ nome:p.nome, desc:p.desc, preco:String(p.preco), cat:p.cat, emoji:p.emoji, badge:p.badge||"" }); };

  const [adminForm, setAdminForm] = useState({ nome:marca.nome, tagline:marca.tagline, pix:marca.pix, logo:marca.logo });
  const upA = (k,v) => setAdminForm(f=>({...f,[k]:v}));
  const [temaSel, setTemaSel] = useState(marca.tema.nome);
  const saveMarca = () => {
    const tema = TEMAS.find(t=>t.nome===temaSel) || marca.tema;
    setMarca(m=>({...m, ...adminForm, tema}));
  };

  const tabs = [
    { id:"pedidos",  label:"📦 Pedidos",    count:pedidos.filter(p=>p.status!=="Entregue").length },
    { id:"cardapio", label:"🍕 Cardápio",   count:null },
    { id:"marca",    label:"🎨 Marca",      count:null },
  ];

  return (
    <>
      <div className="overlay" onClick={onClose}/>
      <div className="drawer enter" style={{ width:"min(600px,100vw)" }}>
        {/* Header */}
        <div style={{
          padding:"18px 24px", background:"var(--ink)",
          display:"flex", justifyContent:"space-between", alignItems:"center",
        }}>
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <span style={{ fontSize:22 }}>⚙️</span>
            <div>
              <h2 style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:20, fontWeight:700, color:"#FFF8F0" }}>
                Painel Admin
              </h2>
              <p style={{ color:"rgba(255,248,240,.5)", fontSize:12, marginTop:1 }}>Gerenciamento da pizzaria</p>
            </div>
          </div>
          <button onClick={onClose} style={{
            background:"rgba(255,255,255,.12)", border:"none", borderRadius:99,
            width:36, height:36, fontSize:18, color:"#fff",
          }}>✕</button>
        </div>

        {/* Tabs */}
        <div style={{ display:"flex", borderBottom:"1px solid var(--border)", background:"#fff" }}>
          {tabs.map(t => (
            <button key={t.id} onClick={()=>setTab(t.id)} style={{
              flex:1, padding:"14px 8px", border:"none",
              borderBottom:`3px solid ${tab===t.id?"var(--p)":"transparent"}`,
              background:"transparent",
              color: tab===t.id ? "var(--p)" : "var(--muted)",
              fontWeight: tab===t.id ? 700 : 400,
              fontSize:13, transition:"all .2s",
              display:"flex", alignItems:"center", justifyContent:"center", gap:5,
            }}>
              {t.label}
              {t.count!==null && t.count>0 && (
                <span style={{ background:"var(--p)", color:"#fff", borderRadius:99, padding:"1px 7px", fontSize:11 }}>{t.count}</span>
              )}
            </button>
          ))}
        </div>

        <div style={{ flex:1, overflowY:"auto", padding:"20px 24px" }}>
          {/* ── PEDIDOS ── */}
          {tab==="pedidos" && (
            <div style={{ display:"grid", gap:14 }}>
              {pedidos.length===0 ? (
                <div style={{ textAlign:"center", padding:"60px 0", color:"var(--muted)" }}>
                  <div style={{ fontSize:48, marginBottom:12 }}>📦</div>
                  <p>Nenhum pedido ainda</p>
                </div>
              ) : [...pedidos].reverse().map(ped => {
                const sc = STATUS_COLOR[ped.status] || STATUS_COLOR["Recebido"];
                return (
                  <div key={ped.numero} style={{
                    background:"#fff", borderRadius:16, padding:"18px",
                    border:"1px solid var(--border)",
                  }}>
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:12 }}>
                      <div>
                        <p style={{ fontWeight:700, fontSize:16 }}>{ped.numero}</p>
                        <p style={{ color:"var(--muted)", fontSize:12, marginTop:2 }}>
                          {ped.horario} • {ped.nome} • {ped.tel}
                        </p>
                      </div>
                      <span style={{
                        background:sc.bg, color:sc.txt,
                        padding:"4px 12px", borderRadius:99, fontSize:12, fontWeight:600,
                      }}>{ped.status}</span>
                    </div>
                    <div style={{ fontSize:13, color:"var(--muted)", marginBottom:12, paddingBottom:12, borderBottom:"1px solid var(--border)" }}>
                      {ped.itens.map(i=>`${i.emoji} ${i.nome} ×${i.qty}`).join(" · ")}
                    </div>
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                      <span style={{ fontFamily:"'Cormorant Garamond',serif", fontWeight:700, fontSize:20, color:"var(--p)" }}>
                        {R(ped.total)}
                      </span>
                      <div style={{ display:"flex", gap:6 }}>
                        {STATUS_LIST.filter((_,i)=>i>STATUS_LIST.indexOf(ped.status)).slice(0,2).map(s=>(
                          <button key={s} onClick={()=>null} style={{
                            padding:"6px 12px", borderRadius:99, fontSize:11, fontWeight:600,
                            background:"var(--p)", color:"#fff", border:"none",
                          }} onClick={()=>{ /* status update handled below */ }}>
                            {s}
                          </button>
                        ))}
                      </div>
                    </div>
                    {/* Status buttons */}
                    <div style={{ display:"flex", gap:6, marginTop:10, flexWrap:"wrap" }}>
                      {STATUS_LIST.map(s => (
                        <button key={s} onClick={() => {
                          // update in parent via setProdutos equiv
                          const idx = pedidos.findIndex(p=>p.numero===ped.numero);
                          if(idx>=0) pedidos[idx].status = s; // mutate for demo
                          // force re-render trick
                          setTab(t=>t);
                        }} style={{
                          padding:"5px 12px", borderRadius:99, fontSize:11, fontWeight:600,
                          background: ped.status===s ? "var(--p)" : "#f5f0eb",
                          color: ped.status===s ? "#fff" : "var(--muted)",
                          border:"none", transition:"all .15s",
                        }}>{s}</button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* ── CARDÁPIO ── */}
          {tab==="cardapio" && (
            <div>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
                <h3 style={{ fontFamily:"'Cormorant Garamond',serif", fontWeight:700, fontSize:18 }}>
                  {produtos.length} produtos
                </h3>
                <button className="btn-primary" onClick={()=>{setEditProd(null);setNewProd(true);setForm({nome:"",desc:"",preco:"",cat:"Pizzas",emoji:"🍕",badge:""}); }}>
                  + Novo produto
                </button>
              </div>

              {newProd && (
                <div style={{ background:"#fff", borderRadius:16, padding:"20px", border:"2px solid var(--p)", marginBottom:16 }}>
                  <h4 style={{ fontFamily:"'Cormorant Garamond',serif", fontWeight:700, fontSize:16, marginBottom:14 }}>
                    {editProd ? "Editar produto" : "Novo produto"}
                  </h4>
                  <div style={{ display:"grid", gap:10 }}>
                    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
                      <div>
                        <label style={{ fontSize:11, fontWeight:600, color:"var(--muted)", display:"block", marginBottom:4 }}>NOME</label>
                        <input className="input-base" value={form.nome} onChange={e=>up("nome",e.target.value)} placeholder="Nome do produto"/>
                      </div>
                      <div>
                        <label style={{ fontSize:11, fontWeight:600, color:"var(--muted)", display:"block", marginBottom:4 }}>PREÇO</label>
                        <input className="input-base" type="number" value={form.preco} onChange={e=>up("preco",e.target.value)} placeholder="49.90"/>
                      </div>
                    </div>
                    <div>
                      <label style={{ fontSize:11, fontWeight:600, color:"var(--muted)", display:"block", marginBottom:4 }}>DESCRIÇÃO</label>
                      <input className="input-base" value={form.desc} onChange={e=>up("desc",e.target.value)} placeholder="Ingredientes e descrição"/>
                    </div>
                    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:10 }}>
                      <div>
                        <label style={{ fontSize:11, fontWeight:600, color:"var(--muted)", display:"block", marginBottom:4 }}>CATEGORIA</label>
                        <select className="input-base" value={form.cat} onChange={e=>up("cat",e.target.value)}>
                          {CATS.filter(c=>c!=="Todos").map(c=><option key={c}>{c}</option>)}
                        </select>
                      </div>
                      <div>
                        <label style={{ fontSize:11, fontWeight:600, color:"var(--muted)", display:"block", marginBottom:4 }}>EMOJI</label>
                        <input className="input-base" value={form.emoji} onChange={e=>up("emoji",e.target.value)} placeholder="🍕"/>
                      </div>
                      <div>
                        <label style={{ fontSize:11, fontWeight:600, color:"var(--muted)", display:"block", marginBottom:4 }}>BADGE</label>
                        <input className="input-base" value={form.badge} onChange={e=>up("badge",e.target.value)} placeholder="Novo"/>
                      </div>
                    </div>
                  </div>
                  <div style={{ display:"flex", gap:10, marginTop:14 }}>
                    <button className="btn-ghost" onClick={()=>{setNewProd(false);setEditProd(null);}}>Cancelar</button>
                    <button className="btn-primary" onClick={saveProd}>Salvar produto</button>
                  </div>
                </div>
              )}

              <div style={{ display:"grid", gap:10 }}>
                {produtos.map(p => (
                  <div key={p.id} style={{
                    background:"#fff", borderRadius:14, padding:"14px 16px",
                    border:"1px solid var(--border)", display:"flex", alignItems:"center", gap:12,
                    opacity: p.ativo ? 1 : .5,
                  }}>
                    <span style={{ fontSize:28 }}>{p.emoji}</span>
                    <div style={{ flex:1 }}>
                      <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                        <p style={{ fontWeight:600, fontSize:14 }}>{p.nome}</p>
                        {p.badge && <span className="tag">{p.badge}</span>}
                        {!p.ativo && <span style={{ fontSize:11, color:"var(--muted)" }}>desativado</span>}
                      </div>
                      <p style={{ color:"var(--muted)", fontSize:12, marginTop:2 }}>{p.cat} · {R(p.preco)}</p>
                    </div>
                    <div style={{ display:"flex", gap:6 }}>
                      <button onClick={()=>openEdit(p)} style={{
                        background:"#f5f0eb", border:"none", borderRadius:8, padding:"6px 10px", fontSize:14,
                      }}>✏️</button>
                      <button onClick={()=>toggleAtivo(p.id)} style={{
                        background: p.ativo?"#fff7ed":"#f0fdf4", border:"none", borderRadius:8, padding:"6px 10px", fontSize:14,
                      }}>{p.ativo?"👁":"👁‍🗨"}</button>
                      <button onClick={()=>delProd(p.id)} style={{
                        background:"#fff5f5", border:"none", borderRadius:8, padding:"6px 10px", fontSize:14, color:"#e74c3c",
                      }}>🗑</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── MARCA ── */}
          {tab==="marca" && (
            <div style={{ display:"grid", gap:18 }}>
              <h3 style={{ fontFamily:"'Cormorant Garamond',serif", fontWeight:700, fontSize:18 }}>Personalizar marca</h3>

              <div>
                <label style={{ fontSize:11, fontWeight:600, color:"var(--muted)", display:"block", marginBottom:6 }}>NOME DA PIZZARIA</label>
                <input className="input-base" value={adminForm.nome} onChange={e=>upA("nome",e.target.value)}/>
              </div>
              <div>
                <label style={{ fontSize:11, fontWeight:600, color:"var(--muted)", display:"block", marginBottom:6 }}>SLOGAN</label>
                <input className="input-base" value={adminForm.tagline} onChange={e=>upA("tagline",e.target.value)}/>
              </div>
              <div>
                <label style={{ fontSize:11, fontWeight:600, color:"var(--muted)", display:"block", marginBottom:6 }}>CHAVE PIX</label>
                <input className="input-base" value={adminForm.pix} onChange={e=>upA("pix",e.target.value)} placeholder="email@pix.com.br"/>
              </div>

              <div>
                <label style={{ fontSize:11, fontWeight:600, color:"var(--muted)", display:"block", marginBottom:10 }}>LOGO (EMOJI)</label>
                <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
                  {LOGOS.map(l => (
                    <button key={l} onClick={()=>upA("logo",l)} style={{
                      width:44, height:44, borderRadius:12, fontSize:24,
                      border:`2px solid ${adminForm.logo===l?"var(--p)":"var(--border)"}`,
                      background: adminForm.logo===l ? "color-mix(in srgb, var(--p) 10%, white)" : "#fff",
                      transition:"all .15s",
                    }}>{l}</button>
                  ))}
                </div>
              </div>

              <div>
                <label style={{ fontSize:11, fontWeight:600, color:"var(--muted)", display:"block", marginBottom:10 }}>COR DO TEMA</label>
                <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:8 }}>
                  {TEMAS.map(t => (
                    <button key={t.nome} onClick={()=>setTemaSel(t.nome)} style={{
                      padding:"10px 8px", borderRadius:12,
                      border:`2px solid ${temaSel===t.nome?"var(--p)":"var(--border)"}`,
                      background: temaSel===t.nome ? "color-mix(in srgb, var(--p) 8%, white)" : "#fff",
                      display:"flex", alignItems:"center", gap:8, transition:"all .15s",
                    }}>
                      <div style={{ width:20, height:20, borderRadius:99, background:t.primary, flexShrink:0 }}/>
                      <span style={{ fontSize:12, fontWeight:temaSel===t.nome?700:400 }}>{t.nome}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Preview */}
              <div style={{
                background:`linear-gradient(135deg, ${TEMAS.find(t=>t.nome===temaSel)?.primary||"#C41E3A"} 0%, ${TEMAS.find(t=>t.nome===temaSel)?.dark||"#8b0f24"} 100%)`,
                borderRadius:14, padding:"16px 20px",
                display:"flex", alignItems:"center", gap:12,
              }}>
                <span style={{ fontSize:28 }}>{adminForm.logo}</span>
                <div>
                  <p style={{ fontFamily:"'Cormorant Garamond',serif", fontWeight:700, fontSize:18, color:"#FFF8F0" }}>{adminForm.nome||"Nome da Pizzaria"}</p>
                  <p style={{ color:"rgba(255,248,240,.7)", fontSize:12, marginTop:2 }}>{adminForm.tagline||"Slogan aqui"}</p>
                </div>
              </div>

              <button className="btn-primary" onClick={saveMarca} style={{ padding:"14px" }}>
                ✓ Salvar alterações
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

// ─── LOGIN ADMIN ──────────────────────────────────────────────────────────────
function LoginModal({ onLogin, onClose, marca }) {
  const [user, setUser] = useState("");
  const [pass, setPass] = useState("");
  const [err, setErr] = useState("");

  const login = () => {
    if (user === "admin" && pass === "Pizza@Delivery2026!") { onLogin(); }
    else setErr("Usuário ou senha incorretos");
  };

  return (
    <>
      <div className="overlay" onClick={onClose}/>
      <div className="modal-wrap">
        <div className="modal" style={{ maxWidth:380 }}>
          <div style={{ textAlign:"center", marginBottom:24 }}>
            <span style={{ fontSize:40 }}>{marca.logo}</span>
            <h2 style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:22, fontWeight:700, marginTop:10 }}>
              Acesso Administrativo
            </h2>
            <p style={{ color:"var(--muted)", fontSize:13, marginTop:4 }}>{marca.nome}</p>
          </div>
          <div style={{ display:"grid", gap:12, marginBottom:16 }}>
            <div>
              <label style={{ fontSize:11, fontWeight:600, color:"var(--muted)", display:"block", marginBottom:5 }}>USUÁRIO</label>
              <input className="input-base" value={user} onChange={e=>{setUser(e.target.value);setErr("");}} placeholder="admin" onKeyDown={e=>e.key==="Enter"&&login()}/>
            </div>
            <div>
              <label style={{ fontSize:11, fontWeight:600, color:"var(--muted)", display:"block", marginBottom:5 }}>SENHA</label>
              <input className="input-base" type="password" value={pass} onChange={e=>{setPass(e.target.value);setErr("");}} placeholder="••••••••••" onKeyDown={e=>e.key==="Enter"&&login()}/>
            </div>
          </div>
          {err && <p style={{ color:"#e74c3c", fontSize:13, marginBottom:12, textAlign:"center" }}>{err}</p>}
          <button className="btn-primary" onClick={login} style={{ width:"100%", padding:"14px" }}>Entrar</button>
          <button className="btn-ghost" onClick={onClose} style={{ width:"100%", marginTop:10 }}>Cancelar</button>
          <p style={{ fontSize:11, color:"var(--muted)", textAlign:"center", marginTop:14, opacity:.6 }}>
            Usuário: admin · Senha: Pizza@Delivery2026!
          </p>
        </div>
      </div>
    </>
  );
}

// ─── APP PRINCIPAL ────────────────────────────────────────────────────────────
export default function App() {
  const [marca, setMarcaRaw] = useLS("pizzaria_marca", {
    nome: "La Bella Pizza",
    logo: "🍕",
    tagline: "Pizzas artesanais com ingredientes frescos, entregues quentinhas na sua porta",
    pix: "pizzaria@pix.com.br",
    tema: TEMAS[0],
  });
  const setMarca = (fn) => setMarcaRaw(typeof fn === "function" ? fn(marca) : fn);

  const [produtos, setProdutosRaw] = useLS("pizzaria_produtos", PRODUTOS_INICIAIS);
  const setProdutos = (fn) => setProdutosRaw(typeof fn === "function" ? fn(produtos) : fn);

  const [pedidos, setPedidosRaw] = useLS("pizzaria_pedidos", []);
  const setPedidos = (fn) => setPedidosRaw(typeof fn === "function" ? fn(pedidos) : fn);

  const [cart, setCart] = useState([]);
  const [cat, setCat] = useState("Todos");
  const [search, setSearch] = useState("");
  const [showCart, setShowCart] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [toast, setToast] = useState(null);

  // Apply theme CSS variable
  const t = marca.tema;
  useEffect(() => {
    document.documentElement.style.setProperty("--p", t.primary);
    document.documentElement.style.setProperty("--d", t.dark);
    document.documentElement.style.setProperty("--a", t.accent);
  }, [t]);

  const addToCart = useCallback((prod) => {
    setCart(c => {
      const ex = c.find(x=>x.id===prod.id);
      return ex ? c.map(x=>x.id===prod.id?{...x,qty:x.qty+1}:x) : [...c, {...prod,qty:1}];
    });
    setToast(`${prod.emoji} ${prod.nome} adicionado!`);
  }, []);

  const updateCart = useCallback((id, delta) => {
    setCart(c => {
      const updated = c.map(x=>x.id===id?{...x,qty:x.qty+delta}:x).filter(x=>x.qty>0);
      return updated;
    });
  }, []);

  const onCheckout = () => { setShowCart(false); setShowCheckout(true); };

  const confirmPedido = (ped) => {
    setPedidos(ps => [...ps, ped]);
    setCart([]);
    // setShowCheckout stays open to show confirmation
  };

  const filteredProds = produtos.filter(p => {
    if (!p.ativo) return false;
    if (cat !== "Todos" && p.cat !== cat) return false;
    if (search) {
      const q = search.toLowerCase();
      return p.nome.toLowerCase().includes(q) || p.desc.toLowerCase().includes(q);
    }
    return true;
  });

  const cartCount = cart.reduce((s,i)=>s+i.qty,0);

  const openAdmin = () => {
    if (isLoggedIn) setShowAdmin(true);
    else setShowLogin(true);
  };

  return (
    <>
      <GlobalCSS primary={t.primary} dark={t.dark} accent={t.accent}/>

      <Navbar
        marca={marca} cartCount={cartCount}
        onCart={()=>setShowCart(true)} onAdmin={openAdmin}
        search={search} onSearch={setSearch}
      />

      <Hero marca={marca}/>

      <CategoryBar selected={cat} onSelect={setCat}/>

      {/* Grid de produtos */}
      <main style={{ maxWidth:960, margin:"0 auto", padding:"32px 20px 100px" }}>
        {search && (
          <p style={{ color:"var(--muted)", fontSize:14, marginBottom:20 }}>
            {filteredProds.length} resultado{filteredProds.length!==1?"s":""} para "<strong>{search}</strong>"
          </p>
        )}
        {filteredProds.length === 0 ? (
          <div style={{ textAlign:"center", padding:"80px 0", color:"var(--muted)" }}>
            <div style={{ fontSize:56, marginBottom:12 }}>🔍</div>
            <p style={{ fontSize:16, fontWeight:600, marginBottom:8 }}>Nenhum produto encontrado</p>
            <p style={{ fontSize:13 }}>Tente outra categoria ou busca</p>
          </div>
        ) : (
          <div style={{
            display:"grid",
            gridTemplateColumns:"repeat(auto-fill,minmax(260px,1fr))",
            gap:20,
          }}>
            {filteredProds.map((p, i) => (
              <div key={p.id} className="fade-up" style={{ animationDelay:`${i*30}ms` }}>
                <ProductCard p={p} onAdd={addToCart}/>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* FAB Admin (pequeno, discreto) */}
      <button onClick={openAdmin} style={{
        position:"fixed", bottom:24, right:24,
        background:"var(--ink)", color:"#fff",
        border:"none", borderRadius:99,
        padding:"10px 16px", fontSize:13, fontWeight:600,
        boxShadow:"0 4px 20px rgba(0,0,0,.3)",
        zIndex:50, display:"flex", alignItems:"center", gap:6,
        opacity:.75, transition:"opacity .2s",
      }}
      onMouseEnter={e=>e.currentTarget.style.opacity="1"}
      onMouseLeave={e=>e.currentTarget.style.opacity=".75"}
      >
        ⚙️ Admin
      </button>

      {/* Overlays */}
      {showCart && (
        <CartDrawer
          cart={cart} onClose={()=>setShowCart(false)}
          onUpdate={updateCart} onCheckout={onCheckout} marca={marca}
        />
      )}
      {showCheckout && (
        <CheckoutModal
          cart={cart} onClose={()=>setShowCheckout(false)}
          onConfirm={confirmPedido} marca={marca}
        />
      )}
      {showLogin && (
        <LoginModal
          onLogin={()=>{ setIsLoggedIn(true); setShowLogin(false); setShowAdmin(true); }}
          onClose={()=>setShowLogin(false)} marca={marca}
        />
      )}
      {showAdmin && (
        <AdminPanel
          onClose={()=>setShowAdmin(false)}
          pedidos={pedidos}
          produtos={produtos} setProdutos={setProdutos}
          marca={marca} setMarca={setMarca}
        />
      )}
      {toast && <Toast msg={toast} onDone={()=>setToast(null)}/>}
    </>
  );
}
