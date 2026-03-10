import { useState, useEffect, useCallback } from "react";
import { auth as authApi, produtos as produtosApi, pedidos as pedidosApi, marca as marcaApi } from "./api.js";
import { useSocket } from "./useSocket.js";

// ── Helpers ───────────────────────────────────────────────────────────────
const fmt      = (v) => Number(v).toFixed(2).replace(".", ",");
const hexToRgb = (hex) => {
  try {
    const r = parseInt(hex.slice(1,3),16), g = parseInt(hex.slice(3,5),16), b = parseInt(hex.slice(5,7),16);
    return `${r},${g},${b}`;
  } catch { return "196,30,58"; }
};

const CATEGORIES  = ["Todos", "Pizzas", "Combos", "Bebidas", "Sobremesas"];
const CAT_ICONS   = { "Todos":"🍽️","Pizzas":"🍕","Combos":"🎁","Bebidas":"🥤","Sobremesas":"🍰" };
const PRESET_COLORS = [
  { name:"Vermelho", primary:"#C41E3A", dark:"#8b0f24" },
  { name:"Verde",    primary:"#2d7a3a", dark:"#1b4d24" },
  { name:"Azul",     primary:"#1a3c6e", dark:"#0f2344" },
  { name:"Laranja",  primary:"#e8650a", dark:"#b34d07" },
  { name:"Roxo",     primary:"#6b2fa0", dark:"#481f6d" },
  { name:"Carvão",   primary:"#2c2c2c", dark:"#111111" },
];
const LOGO_EMOJIS = ["🍕","🔥","⭐","🌿","👨‍🍳","🫕","🍽️","🏠","✨","🇮🇹","🌶️","🧑‍🍳"];
const STATUS_FLOW = ["Recebido","Em preparo","Saiu p/ entrega","Entregue"];
const STATUS_COLORS = {
  "Recebido":        {bg:"#fff3cd",text:"#856404"},
  "Em preparo":      {bg:"#cce5ff",text:"#004085"},
  "Saiu p/ entrega": {bg:"#fff3e0",text:"#e65100"},
  "Entregue":        {bg:"#d4edda",text:"#155724"},
};
const DEFAULT_BRAND = {
  name:"La Bella Pizza", emoji:"🍕",
  color:{ name:"Vermelho", primary:"#C41E3A", dark:"#8b0f24" },
  tagline:"Pizzas artesanais com ingredientes frescos, entregues quentinhas na sua porta",
  pix:"pizzaria@pix.com.br",
};

// ── Toast ─────────────────────────────────────────────────────────────────
function Toast({ message, onDone }) {
  useEffect(() => { const t = setTimeout(onDone, 2200); return () => clearTimeout(t); }, []);
  return (
    <div style={{ position:"fixed",bottom:80,left:"50%",transform:"translateX(-50%)",background:"#1a1a1a",color:"#fff",padding:"10px 20px",borderRadius:99,fontFamily:"'Playfair Display',Georgia,serif",fontSize:14,zIndex:9999,animation:"slideUp .3s ease",boxShadow:"0 4px 20px rgba(0,0,0,.3)",display:"flex",alignItems:"center",gap:8,whiteSpace:"nowrap" }}>
      ✅ {message}
    </div>
  );
}

// ── Spinner ───────────────────────────────────────────────────────────────
function Spinner({ color="#C41E3A" }) {
  return (
    <div style={{ display:"flex",alignItems:"center",justifyContent:"center",padding:40 }}>
      <div style={{ width:36,height:36,border:`3px solid ${color}33`,borderTop:`3px solid ${color}`,borderRadius:"50%",animation:"spin .8s linear infinite" }}/>
    </div>
  );
}

// ── Navbar ────────────────────────────────────────────────────────────────
function Navbar({ brand, cartCount, onCartClick, onLogoClick, searchQuery, onSearch }) {
  const p = brand.color.primary;
  return (
    <nav style={{ position:"sticky",top:0,zIndex:100,background:p,boxShadow:`0 2px 20px rgba(${hexToRgb(p)},.4)`,transition:"background .4s" }}>
      <div style={{ maxWidth:900,margin:"0 auto",padding:"0 16px",display:"flex",alignItems:"center",gap:12,height:60 }}>
        <button onClick={onLogoClick} style={{ background:"none",border:"none",cursor:"pointer",display:"flex",alignItems:"center",gap:8,flexShrink:0 }}>
          <span style={{ fontSize:26 }}>{brand.emoji}</span>
          <span style={{ fontFamily:"'Playfair Display',Georgia,serif",fontWeight:700,fontSize:19,color:"#FFF8F0" }}>{brand.name}</span>
        </button>
        <div style={{ flex:1,position:"relative" }}>
          <input value={searchQuery} onChange={e=>onSearch(e.target.value)} placeholder="Buscar sabores..."
            style={{ width:"100%",padding:"8px 12px 8px 36px",borderRadius:99,border:"none",background:"rgba(255,255,255,.15)",color:"#fff",fontSize:14,outline:"none",fontFamily:"Georgia,serif",boxSizing:"border-box" }}/>
          <span style={{ position:"absolute",left:12,top:"50%",transform:"translateY(-50%)",fontSize:14,opacity:.7 }}>🔍</span>
        </div>
        <button onClick={onCartClick} style={{ background:"#FFF8F0",border:"none",borderRadius:99,padding:"8px 16px",cursor:"pointer",display:"flex",alignItems:"center",gap:6,fontFamily:"Georgia,serif",fontWeight:700,fontSize:14,color:p,flexShrink:0 }}>
          🛒 <span style={{ background:p,color:"#fff",borderRadius:99,padding:"1px 7px",fontSize:12 }}>{cartCount}</span>
        </button>
      </div>
    </nav>
  );
}

// ── CategoryBar ───────────────────────────────────────────────────────────
function CategoryBar({ selected, onSelect, brand }) {
  const p = brand.color.primary;
  return (
    <div style={{ background:"#FFF8F0",borderBottom:"1px solid #f0e8e0",overflowX:"auto",WebkitOverflowScrolling:"touch" }}>
      <div style={{ display:"flex",gap:4,padding:"10px 16px",maxWidth:900,margin:"0 auto",minWidth:"max-content" }}>
        {CATEGORIES.map(cat=>(
          <button key={cat} onClick={()=>onSelect(cat)} style={{ padding:"8px 18px",borderRadius:99,border:selected===cat?`2px solid ${p}`:"2px solid transparent",background:selected===cat?p:"#fff",color:selected===cat?"#fff":"#555",fontFamily:"Georgia,serif",fontWeight:selected===cat?700:400,fontSize:14,cursor:"pointer",transition:"all .2s",whiteSpace:"nowrap",display:"flex",alignItems:"center",gap:6 }}>
            {CAT_ICONS[cat]} {cat}
          </button>
        ))}
      </div>
    </div>
  );
}

// ── ProductCard ───────────────────────────────────────────────────────────
function ProductCard({ product, onAdd, brand }) {
  const [added, setAdded] = useState(false);
  const p = brand.color.primary;
  const handleAdd = () => { onAdd(product); setAdded(true); setTimeout(()=>setAdded(false),1000); };
  return (
    <div style={{ background:"#fff",borderRadius:16,overflow:"hidden",boxShadow:"0 2px 16px rgba(0,0,0,.08)",transition:"transform .2s,box-shadow .2s",display:"flex",flexDirection:"column" }}
      onMouseEnter={e=>{e.currentTarget.style.transform="translateY(-4px)";e.currentTarget.style.boxShadow="0 8px 32px rgba(0,0,0,.14)"}}
      onMouseLeave={e=>{e.currentTarget.style.transform="translateY(0)";e.currentTarget.style.boxShadow="0 2px 16px rgba(0,0,0,.08)"}}>
      <div style={{ height:120,background:"linear-gradient(135deg,#fff5f0,#fff0e8)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:60,position:"relative" }}>
        {product.emoji}
        {product.badge&&<span style={{ position:"absolute",top:10,right:10,background:p,color:"#fff",fontSize:10,fontFamily:"Georgia,serif",fontWeight:700,padding:"2px 8px",borderRadius:99 }}>{product.badge}</span>}
      </div>
      <div style={{ padding:"14px 16px",flex:1,display:"flex",flexDirection:"column" }}>
        <div style={{ fontFamily:"'Playfair Display',Georgia,serif",fontWeight:700,fontSize:15,color:"#1a1a1a",marginBottom:4 }}>{product.nome || product.name}</div>
        <div style={{ fontSize:12,color:"#888",fontFamily:"Georgia,serif",lineHeight:1.5,flex:1,marginBottom:12 }}>{product.descricao || product.desc}</div>
        <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between" }}>
          <span style={{ fontFamily:"Georgia,serif",fontWeight:700,fontSize:17,color:p }}>R$ {fmt(product.preco || product.price)}</span>
          <button onClick={handleAdd} style={{ background:added?"#22a861":p,color:"#fff",border:"none",borderRadius:99,padding:"8px 16px",cursor:"pointer",fontSize:13,fontFamily:"Georgia,serif",fontWeight:700,transition:"all .2s" }}>
            {added?"✓ Adicionado":"+ Adicionar"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── CartPanel ─────────────────────────────────────────────────────────────
function CartPanel({ cart, onClose, onUpdate, onCheckout, brand }) {
  const p = brand.color.primary;
  const total = cart.reduce((s,i)=>s+(i.price||i.preco||0)*i.qty,0);
  return (
    <div style={{ position:"fixed",inset:0,zIndex:200,display:"flex",justifyContent:"flex-end" }}>
      <div onClick={onClose} style={{ flex:1,background:"rgba(0,0,0,.5)" }}/>
      <div style={{ width:"min(420px,100vw)",background:"#FFF8F0",display:"flex",flexDirection:"column",animation:"slideInRight .3s ease" }}>
        <div style={{ padding:"20px",background:p,color:"#fff",display:"flex",justifyContent:"space-between",alignItems:"center" }}>
          <span style={{ fontFamily:"'Playfair Display',Georgia,serif",fontWeight:700,fontSize:20 }}>🛒 Seu Carrinho</span>
          <button onClick={onClose} style={{ background:"none",border:"none",color:"#fff",fontSize:20,cursor:"pointer" }}>✕</button>
        </div>
        <div style={{ flex:1,overflowY:"auto",padding:16 }}>
          {cart.length===0?(
            <div style={{ textAlign:"center",padding:"60px 20px",color:"#aaa" }}>
              <div style={{ fontSize:48,marginBottom:12 }}>{brand.emoji}</div>
              <div style={{ fontFamily:"Georgia,serif",fontSize:16 }}>Carrinho vazio</div>
            </div>
          ):cart.map(item=>(
            <div key={item.id} style={{ background:"#fff",borderRadius:12,padding:14,marginBottom:10,boxShadow:"0 1px 8px rgba(0,0,0,.07)",display:"flex",gap:12,alignItems:"center" }}>
              <span style={{ fontSize:34 }}>{item.emoji}</span>
              <div style={{ flex:1,minWidth:0 }}>
                <div style={{ fontFamily:"Georgia,serif",fontWeight:700,fontSize:14 }}>{item.nome||item.name}</div>
                <div style={{ fontSize:12,color:p,fontWeight:700,marginTop:2 }}>R$ {fmt((item.price||item.preco||0)*item.qty)}</div>
              </div>
              <div style={{ display:"flex",alignItems:"center",gap:6 }}>
                <button onClick={()=>onUpdate(item.id,item.qty-1)} style={{ width:28,height:28,borderRadius:99,border:`2px solid ${p}`,background:"none",color:p,cursor:"pointer",fontSize:16,fontWeight:700 }}>−</button>
                <span style={{ fontFamily:"Georgia,serif",fontWeight:700,minWidth:20,textAlign:"center" }}>{item.qty}</span>
                <button onClick={()=>onUpdate(item.id,item.qty+1)} style={{ width:28,height:28,borderRadius:99,border:"none",background:p,color:"#fff",cursor:"pointer",fontSize:16,fontWeight:700 }}>+</button>
              </div>
            </div>
          ))}
        </div>
        {cart.length>0&&(
          <div style={{ padding:20,background:"#fff",borderTop:"1px solid #f0e8e0" }}>
            <div style={{ display:"flex",justifyContent:"space-between",marginBottom:16 }}>
              <span style={{ fontFamily:"Georgia,serif",fontSize:16 }}>Total</span>
              <span style={{ fontFamily:"'Playfair Display',Georgia,serif",fontWeight:700,fontSize:22,color:p }}>R$ {fmt(total)}</span>
            </div>
            <button onClick={onCheckout} style={{ width:"100%",padding:"16px",background:p,color:"#fff",border:"none",borderRadius:12,fontFamily:"'Playfair Display',Georgia,serif",fontWeight:700,fontSize:17,cursor:"pointer" }}>
              Finalizar Pedido →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── CheckoutPage ──────────────────────────────────────────────────────────
function CheckoutPage({ cart, onBack, onConfirm, brand }) {
  const p = brand.color.primary;
  const [form,setForm]=useState({nome:"",tel:"",rua:"",num:"",bairro:"",cidade:"São Paulo",comp:""});
  const [payment,setPayment]=useState("pix");
  const [card,setCard]=useState({num:"",name:"",exp:"",cvv:""});
  const [errors,setErrors]=useState({});
  const [loading,setLoading]=useState(false);
  const total=cart.reduce((s,i)=>s+(i.price||i.preco||0)*i.qty,0);

  const validate=()=>{ const e={}; if(!form.nome.trim())e.nome="Obrigatório"; if(!form.tel.trim())e.tel="Obrigatório"; if(!form.rua.trim())e.rua="Obrigatório"; if(!form.num.trim())e.num="Obrigatório"; if(!form.bairro.trim())e.bairro="Obrigatório"; if(payment==="cartao"){ if(card.num.length<15)e.cnum="Inválido"; if(!card.name.trim())e.cname="Obrigatório"; if(!card.exp.trim())e.cexp="Obrigatório"; if(card.cvv.length<3)e.ccvv="Inválido"; } return e; };
  const fieldStyle=(err)=>({ width:"100%",padding:"11px 14px",borderRadius:10,boxSizing:"border-box",border:err?`2px solid ${p}`:"2px solid #e8ddd5",fontFamily:"Georgia,serif",fontSize:14,outline:"none",background:"#fff" });

  const handleSubmit = async () => {
    const e = validate(); setErrors(e);
    if(Object.keys(e).length) return;
    setLoading(true);
    try {
      // Normaliza cart para o backend
      const cartPayload = cart.map(i=>({ id:i.id, name:i.nome||i.name, emoji:i.emoji, price:parseFloat(i.price||i.preco||0), qty:i.qty }));
      const result = await pedidosApi.criar({ form, payment, cart:cartPayload, total });
      onConfirm(result);
    } catch(err) {
      alert("Erro ao finalizar pedido: " + err.message);
    } finally { setLoading(false); }
  };

  return (
    <div style={{ maxWidth:600,margin:"0 auto",padding:"20px 16px 80px" }}>
      <button onClick={onBack} style={{ background:"none",border:"none",cursor:"pointer",display:"flex",alignItems:"center",gap:6,color:p,fontFamily:"Georgia,serif",fontSize:15,marginBottom:20,padding:0 }}>← Voltar</button>
      <h2 style={{ fontFamily:"'Playfair Display',Georgia,serif",fontSize:26,margin:"0 0 20px" }}>Finalizar Pedido</h2>

      <div style={{ background:"#fff",borderRadius:16,padding:20,boxShadow:"0 2px 16px rgba(0,0,0,.08)",marginBottom:16 }}>
        <h3 style={{ fontFamily:"'Playfair Display',Georgia,serif",fontSize:18,margin:"0 0 14px",color:p }}>📍 Endereço</h3>
        {[["Nome *","nome","Seu nome"],["Telefone *","tel","(11) 99999-9999"]].map(([l,k,ph])=>(
          <div key={k} style={{ marginBottom:12 }}><label style={{ display:"block",fontFamily:"Georgia,serif",fontSize:13,color:"#555",marginBottom:4 }}>{l}</label>
            <input value={form[k]} onChange={e=>setForm(f=>({...f,[k]:e.target.value}))} placeholder={ph} style={fieldStyle(errors[k])}/>
            {errors[k]&&<div style={{ color:p,fontSize:12,marginTop:2 }}>{errors[k]}</div>}
          </div>
        ))}
        <div style={{ display:"grid",gridTemplateColumns:"2fr 1fr",gap:12 }}>
          {[["Rua *","rua","Ex: Av. Paulista"],["Nº *","num","123"]].map(([l,k,ph])=>(
            <div key={k}><label style={{ display:"block",fontFamily:"Georgia,serif",fontSize:13,color:"#555",marginBottom:4 }}>{l}</label>
              <input value={form[k]} onChange={e=>setForm(f=>({...f,[k]:e.target.value}))} placeholder={ph} style={fieldStyle(errors[k])}/>
              {errors[k]&&<div style={{ color:p,fontSize:12,marginTop:2 }}>{errors[k]}</div>}
            </div>
          ))}
        </div>
        {[["Bairro *","bairro","Ex: Centro"],["Cidade","cidade","São Paulo"],["Complemento","comp","Apto, bloco..."]].map(([l,k,ph])=>(
          <div key={k} style={{ marginTop:12 }}><label style={{ display:"block",fontFamily:"Georgia,serif",fontSize:13,color:"#555",marginBottom:4 }}>{l}</label>
            <input value={form[k]} onChange={e=>setForm(f=>({...f,[k]:e.target.value}))} placeholder={ph} style={fieldStyle(false)}/>
          </div>
        ))}
      </div>

      <div style={{ background:"#fff",borderRadius:16,padding:20,boxShadow:"0 2px 16px rgba(0,0,0,.08)",marginBottom:16 }}>
        <h3 style={{ fontFamily:"'Playfair Display',Georgia,serif",fontSize:18,margin:"0 0 14px",color:p }}>💳 Pagamento</h3>
        <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:14 }}>
          {[["pix","PIX 🟢","Instantâneo"],["cartao","Cartão 💳","Crédito/Débito"]].map(([v,label,sub])=>(
            <button key={v} onClick={()=>setPayment(v)} style={{ padding:"14px",borderRadius:12,cursor:"pointer",border:payment===v?`2px solid ${p}`:"2px solid #e8ddd5",background:payment===v?"#fff5f5":"#fff",textAlign:"left",transition:"all .2s" }}>
              <div style={{ fontFamily:"Georgia,serif",fontWeight:700,fontSize:15 }}>{label}</div>
              <div style={{ fontSize:12,color:"#888" }}>{sub}</div>
            </button>
          ))}
        </div>
        {payment==="pix"&&(
          <div style={{ background:"#f0faf4",borderRadius:12,padding:20,textAlign:"center",border:"2px dashed #22a861" }}>
            <div style={{ fontSize:40,marginBottom:6 }}>📱</div>
            <div style={{ fontFamily:"'Playfair Display',Georgia,serif",fontWeight:700,fontSize:15,marginBottom:4 }}>Chave PIX</div>
            <div style={{ background:"#fff",borderRadius:8,padding:"8px 16px",display:"inline-block",fontFamily:"monospace",fontSize:14,color:p,fontWeight:700,border:"1px solid #c8e8d5",margin:"6px 0" }}>{brand.pix}</div>
            <div style={{ fontSize:12,color:"#555",fontFamily:"Georgia,serif" }}>Valor: <strong>R$ {fmt(total)}</strong></div>
          </div>
        )}
        {payment==="cartao"&&(
          <div>
            {[["cnum","Número do Cartão","0000 0000 0000 0000"],["cname","Nome no Cartão","NOME COMPLETO"]].map(([k,l,ph])=>(
              <div key={k} style={{ marginBottom:12 }}><label style={{ display:"block",fontFamily:"Georgia,serif",fontSize:13,color:"#555",marginBottom:4 }}>{l}</label>
                <input value={card[k.slice(1)]} onChange={e=>setCard(c=>({...c,[k.slice(1)]:e.target.value}))} placeholder={ph} style={fieldStyle(errors[k])}/>
                {errors[k]&&<div style={{ color:p,fontSize:12,marginTop:2 }}>{errors[k]}</div>}
              </div>
            ))}
            <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:12 }}>
              {[["cexp","Validade","MM/AA"],["ccvv","CVV","123"]].map(([k,l,ph])=>(
                <div key={k}><label style={{ display:"block",fontFamily:"Georgia,serif",fontSize:13,color:"#555",marginBottom:4 }}>{l}</label>
                  <input value={card[k.slice(1)]} onChange={e=>setCard(c=>({...c,[k.slice(1)]:e.target.value}))} placeholder={ph} style={{...fieldStyle(errors[k]),boxSizing:"border-box"}}/>
                  {errors[k]&&<div style={{ color:p,fontSize:12,marginTop:2 }}>{errors[k]}</div>}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div style={{ background:"#fff",borderRadius:16,padding:20,boxShadow:"0 2px 16px rgba(0,0,0,.08)",marginBottom:16 }}>
        <h3 style={{ fontFamily:"'Playfair Display',Georgia,serif",fontSize:18,margin:"0 0 10px",color:p }}>🧾 Resumo</h3>
        {cart.map(i=>(<div key={i.id} style={{ display:"flex",justifyContent:"space-between",padding:"5px 0",borderBottom:"1px solid #f5ede6",fontFamily:"Georgia,serif",fontSize:13 }}><span>{i.emoji} {i.nome||i.name} ×{i.qty}</span><span style={{ fontWeight:700 }}>R$ {fmt((i.price||i.preco||0)*i.qty)}</span></div>))}
        <div style={{ display:"flex",justifyContent:"space-between",paddingTop:10,fontFamily:"'Playfair Display',Georgia,serif",fontWeight:700,fontSize:18,color:p }}><span>Total</span><span>R$ {fmt(total)}</span></div>
      </div>

      <button onClick={handleSubmit} disabled={loading} style={{ width:"100%",padding:18,background:loading?"#aaa":p,color:"#fff",border:"none",borderRadius:14,fontFamily:"'Playfair Display',Georgia,serif",fontWeight:700,fontSize:18,cursor:loading?"not-allowed":"pointer",transition:"all .2s" }}>
        {loading ? "Enviando pedido..." : `Confirmar Pedido ${brand.emoji}`}
      </button>
    </div>
  );
}

// ── ConfirmationPage ──────────────────────────────────────────────────────
function ConfirmationPage({ order, onNewOrder, brand }) {
  const p = brand.color.primary;
  const itens = order.itens || order.cart || [];
  return (
    <div style={{ maxWidth:500,margin:"0 auto",padding:"40px 16px",textAlign:"center" }}>
      <div style={{ fontSize:80,marginBottom:16,animation:"bounce .6s ease" }}>🎉</div>
      <h2 style={{ fontFamily:"'Playfair Display',Georgia,serif",fontSize:28,margin:"0 0 8px" }}>Pedido Confirmado!</h2>
      <p style={{ fontFamily:"Georgia,serif",color:"#888",fontSize:15,margin:"0 0 24px" }}>Seu pedido foi salvo com sucesso</p>
      <div style={{ background:p,borderRadius:16,padding:"16px 24px",marginBottom:24,display:"inline-block" }}>
        <div style={{ color:"rgba(255,255,255,.7)",fontFamily:"Georgia,serif",fontSize:13 }}>Número do Pedido</div>
        <div style={{ color:"#fff",fontFamily:"'Playfair Display',Georgia,serif",fontWeight:700,fontSize:32,letterSpacing:2 }}>{order.numero||order.number}</div>
      </div>
      <div style={{ background:"#fff",borderRadius:16,padding:20,boxShadow:"0 2px 16px rgba(0,0,0,.08)",marginBottom:16,textAlign:"left" }}>
        <div style={{ fontFamily:"'Playfair Display',Georgia,serif",fontWeight:700,fontSize:16,color:p,marginBottom:10 }}>Itens</div>
        {itens.map((i,idx)=>(<div key={idx} style={{ display:"flex",justifyContent:"space-between",padding:"5px 0",borderBottom:"1px solid #f5ede6",fontFamily:"Georgia,serif",fontSize:13 }}><span>{i.emoji} {i.nome||i.name} ×{i.qty||i.quantidade}</span><span style={{ fontWeight:700 }}>R$ {fmt((i.price||i.preco_unit||i.preco||0)*(i.qty||i.quantidade||1))}</span></div>))}
        <div style={{ display:"flex",justifyContent:"space-between",paddingTop:10,fontFamily:"'Playfair Display',Georgia,serif",fontWeight:700,fontSize:18,color:p }}><span>Total</span><span>R$ {fmt(order.total)}</span></div>
      </div>
      <div style={{ background:"#fff8f0",borderRadius:16,padding:16,marginBottom:20,border:"2px dashed #f4a614" }}>
        <div style={{ fontSize:24,marginBottom:4 }}>⏱️</div>
        <div style={{ fontFamily:"'Playfair Display',Georgia,serif",fontWeight:700,fontSize:18 }}>Tempo estimado</div>
        <div style={{ fontFamily:"Georgia,serif",color:p,fontSize:22,fontWeight:700,marginTop:4 }}>35 – 50 minutos</div>
      </div>
      <button onClick={onNewOrder} style={{ width:"100%",padding:16,background:p,color:"#fff",border:"none",borderRadius:12,fontFamily:"'Playfair Display',Georgia,serif",fontWeight:700,fontSize:17,cursor:"pointer" }}>
        Fazer Novo Pedido {brand.emoji}
      </button>
    </div>
  );
}

// ── LoginPage ─────────────────────────────────────────────────────────────
function LoginPage({ onLogin }) {
  const [user, setUser] = useState("");
  const [pass, setPass] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true); setError("");
    try {
      const { token } = await authApi.login(user, pass);
      localStorage.setItem("admin_token", token);
      onLogin();
    } catch(err) {
      setError(err.message || "Credenciais inválidas");
    } finally { setLoading(false); }
  };

  return (
    <div style={{ minHeight:"100vh",background:"#1a1a1a",display:"flex",alignItems:"center",justifyContent:"center",padding:20 }}>
      <div style={{ background:"#fff",borderRadius:20,padding:"40px 32px",width:"100%",maxWidth:380,textAlign:"center",boxShadow:"0 20px 60px rgba(0,0,0,.4)" }}>
        <div style={{ fontSize:48,marginBottom:12 }}>🍕</div>
        <h2 style={{ fontFamily:"'Playfair Display',Georgia,serif",fontSize:24,margin:"0 0 6px" }}>Painel Admin</h2>
        <p style={{ color:"#888",fontFamily:"Georgia,serif",fontSize:14,margin:"0 0 28px" }}>Entre com suas credenciais</p>
        <form onSubmit={handleLogin}>
          {[["Usuário",user,setUser,"text"],["Senha",pass,setPass,"password"]].map(([l,v,sv,type])=>(
            <div key={l} style={{ marginBottom:14,textAlign:"left" }}>
              <label style={{ display:"block",fontFamily:"Georgia,serif",fontSize:13,color:"#555",marginBottom:5 }}>{l}</label>
              <input type={type} value={v} onChange={e=>sv(e.target.value)} required
                style={{ width:"100%",padding:"12px 14px",borderRadius:10,border:"2px solid #e8ddd5",fontFamily:"Georgia,serif",fontSize:14,outline:"none",boxSizing:"border-box" }}/>
            </div>
          ))}
          {error&&<div style={{ color:"#C41E3A",fontSize:13,fontFamily:"Georgia,serif",marginBottom:14,background:"#fff5f5",padding:"8px 12px",borderRadius:8 }}>{error}</div>}
          <button type="submit" disabled={loading} style={{ width:"100%",padding:14,background:"#1a1a1a",color:"#fff",border:"none",borderRadius:12,fontFamily:"'Playfair Display',Georgia,serif",fontWeight:700,fontSize:16,cursor:"pointer" }}>
            {loading?"Entrando...":"Entrar"}
          </button>
        </form>
      </div>
    </div>
  );
}

// ── BrandEditor ───────────────────────────────────────────────────────────
function BrandEditor({ brand, onChange }) {
  const [local, setLocal] = useState({...brand});
  const [customHex, setCustomHex] = useState(brand.color.primary);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);
  const upd = (k,v) => setLocal(b=>({...b,[k]:v}));
  const p = local.color.primary;

  const handleSave = async () => {
    setLoading(true);
    try {
      const updated = await marcaApi.atualizar(local);
      onChange(updated);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch(err) { alert("Erro ao salvar: " + err.message); }
    finally { setLoading(false); }
  };

  return (
    <div>
      {/* Prévia */}
      <div style={{ background:"#fff",borderRadius:16,overflow:"hidden",boxShadow:"0 2px 16px rgba(0,0,0,.08)",marginBottom:20 }}>
        <div style={{ background:"#f0ebe6",padding:"8px 14px",fontFamily:"Georgia,serif",fontSize:11,color:"#999",fontWeight:700,letterSpacing:1 }}>PRÉVIA AO VIVO</div>
        <div style={{ background:p,padding:"11px 16px",display:"flex",alignItems:"center",gap:10,transition:"background .35s" }}>
          <span style={{ fontSize:20 }}>{local.emoji}</span>
          <span style={{ fontFamily:"'Playfair Display',Georgia,serif",fontWeight:700,fontSize:16,color:"#fff" }}>{local.name||"Nome"}</span>
          <div style={{ marginLeft:"auto",background:"rgba(255,255,255,.2)",borderRadius:99,padding:"4px 12px",fontSize:12,fontFamily:"Georgia,serif",color:"#fff" }}>🛒 0</div>
        </div>
        <div style={{ background:`linear-gradient(135deg,${p},${local.color.dark})`,padding:"14px",textAlign:"center",color:"#fff",transition:"background .35s" }}>
          <div style={{ fontSize:28,marginBottom:4 }}>{local.emoji}</div>
          <div style={{ fontFamily:"'Playfair Display',Georgia,serif",fontWeight:700,fontSize:17 }}>{local.name}</div>
          <div style={{ fontSize:11,opacity:.8,marginTop:3,maxWidth:260,margin:"3px auto 0",lineHeight:1.4 }}>{local.tagline}</div>
        </div>
        <div style={{ padding:12,display:"flex",gap:8 }}>
          {["🍕","🔥","🧀"].map((e,i)=>(
            <div key={i} style={{ flex:1,background:"#fff5f0",borderRadius:10,padding:"10px 6px",textAlign:"center" }}>
              <div style={{ fontSize:26 }}>{e}</div>
              <div style={{ marginTop:6 }}><span style={{ background:p,color:"#fff",fontSize:10,borderRadius:99,padding:"3px 8px",fontFamily:"Georgia,serif",fontWeight:700 }}>Adicionar</span></div>
            </div>
          ))}
        </div>
      </div>

      {/* Campos */}
      <div style={{ background:"#fff",borderRadius:16,padding:20,boxShadow:"0 1px 8px rgba(0,0,0,.06)",marginBottom:14 }}>
        <h4 style={{ fontFamily:"'Playfair Display',Georgia,serif",fontSize:17,margin:"0 0 14px" }}>🏷️ Identidade</h4>
        {[["Nome da Pizzaria","name","Ex: La Bella Pizza"],["Slogan","tagline","Sua frase"],["Chave PIX","pix","seu@pix.com.br"]].map(([l,k,ph])=>(
          <div key={k} style={{ marginBottom:12 }}>
            <label style={{ display:"block",fontFamily:"Georgia,serif",fontSize:13,color:"#555",marginBottom:5 }}>{l}</label>
            <input value={local[k]} onChange={e=>upd(k,e.target.value)} placeholder={ph}
              style={{ width:"100%",padding:"11px 14px",borderRadius:10,border:"2px solid #e8ddd5",fontFamily:"Georgia,serif",fontSize:14,outline:"none",boxSizing:"border-box" }}/>
          </div>
        ))}
      </div>

      <div style={{ background:"#fff",borderRadius:16,padding:20,boxShadow:"0 1px 8px rgba(0,0,0,.06)",marginBottom:14 }}>
        <h4 style={{ fontFamily:"'Playfair Display',Georgia,serif",fontSize:17,margin:"0 0 14px" }}>🎭 Ícone</h4>
        <div style={{ display:"flex",flexWrap:"wrap",gap:8 }}>
          {LOGO_EMOJIS.map(em=>(
            <button key={em} onClick={()=>upd("emoji",em)} style={{ width:46,height:46,borderRadius:10,fontSize:24,border:local.emoji===em?`3px solid ${p}`:"2px solid #e8ddd5",background:local.emoji===em?"#fff5f5":"#fff",cursor:"pointer" }}>{em}</button>
          ))}
        </div>
      </div>

      <div style={{ background:"#fff",borderRadius:16,padding:20,boxShadow:"0 1px 8px rgba(0,0,0,.06)",marginBottom:20 }}>
        <h4 style={{ fontFamily:"'Playfair Display',Georgia,serif",fontSize:17,margin:"0 0 14px" }}>🎨 Cor Principal</h4>
        <div style={{ display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8,marginBottom:16 }}>
          {PRESET_COLORS.map(c=>(
            <button key={c.name} onClick={()=>upd("color",c)} style={{ padding:"10px 6px",borderRadius:10,cursor:"pointer",border:local.color.primary===c.primary?"3px solid #1a1a1a":"2px solid #e8ddd5",background:"#fff",textAlign:"center" }}>
              <div style={{ width:30,height:30,borderRadius:99,background:c.primary,margin:"0 auto 6px",boxShadow:"0 2px 8px rgba(0,0,0,.2)" }}/>
              <div style={{ fontFamily:"Georgia,serif",fontSize:11,color:"#555" }}>{c.name}</div>
            </button>
          ))}
        </div>
        <div style={{ borderTop:"1px solid #f0ebe6",paddingTop:14 }}>
          <label style={{ display:"block",fontFamily:"Georgia,serif",fontSize:13,color:"#555",marginBottom:8 }}>Cor personalizada</label>
          <div style={{ display:"flex",gap:10,alignItems:"center" }}>
            <input type="color" value={customHex} onChange={e=>setCustomHex(e.target.value)}
              style={{ width:44,height:40,border:"2px solid #e8ddd5",borderRadius:8,cursor:"pointer",padding:2,flexShrink:0 }}/>
            <input value={customHex} onChange={e=>setCustomHex(e.target.value)} placeholder="#C41E3A"
              style={{ flex:1,padding:"10px 14px",borderRadius:10,border:"2px solid #e8ddd5",fontFamily:"monospace",fontSize:14,outline:"none" }}/>
            <button onClick={()=>upd("color",{name:"Personalizada",primary:customHex,dark:customHex})}
              style={{ padding:"10px 14px",borderRadius:10,background:customHex,color:"#fff",border:"none",cursor:"pointer",fontFamily:"Georgia,serif",fontWeight:700,fontSize:13,flexShrink:0 }}>
              Aplicar
            </button>
          </div>
        </div>
      </div>

      <button onClick={handleSave} disabled={loading} style={{ width:"100%",padding:16,background:saved?"#22a861":p,color:"#fff",border:"none",borderRadius:12,fontFamily:"'Playfair Display',Georgia,serif",fontWeight:700,fontSize:17,cursor:"pointer",transition:"all .35s" }}>
        {loading?"Salvando..." : saved?"✅ Salvo com sucesso!":"💾 Salvar e Publicar"}
      </button>
    </div>
  );
}

// ── AdminPanel ────────────────────────────────────────────────────────────
function AdminPanel({ onBack, brand, onBrandChange }) {
  const [tab,setTab]=useState("pedidos");
  const [pedidos,setPedidos]=useState([]);
  const [products,setProducts]=useState([]);
  const [stats,setStats]=useState(null);
  const [loading,setLoading]=useState(true);
  const [showForm,setShowForm]=useState(false);
  const [editItem,setEditItem]=useState(null);
  const [form,setForm]=useState({nome:"",descricao:"",preco:"",categoria:"Pizzas",emoji:"🍕"});
  const p = brand.color.primary;

  // Carrega dados iniciais
  useEffect(() => {
    Promise.all([
      pedidosApi.listar(),
      produtosApi.todos(),
      pedidosApi.statsHoje(),
    ]).then(([ped,prod,st]) => {
      setPedidos(ped); setProducts(prod); setStats(st);
    }).catch(console.error)
    .finally(()=>setLoading(false));
  }, []);

  // Socket real-time
  useSocket({
    "pedido:novo": (p) => setPedidos(prev=>[p,...prev]),
    "pedido:status": ({numero,status}) => setPedidos(prev=>prev.map(p=>p.number===numero?{...p,status}:p)),
    "produto:criado": (p) => setProducts(prev=>[...prev,p]),
    "produto:atualizado": (p) => setProducts(prev=>prev.map(x=>x.id===p.id?p:x)),
    "produto:removido": ({id}) => setProducts(prev=>prev.filter(x=>x.id!==id)),
    "marca:atualizada": (m) => onBrandChange(m),
  });

  const handleStatus = async (numero, status) => {
    try {
      await pedidosApi.atualizarStatus(numero, status);
      setPedidos(prev=>prev.map(p=>p.number===numero?{...p,status}:p));
    } catch(err) { alert(err.message); }
  };

  const openAdd = () => { setEditItem(null); setForm({nome:"",descricao:"",preco:"",categoria:"Pizzas",emoji:"🍕"}); setShowForm(true); };
  const openEdit = (prod) => { setEditItem(prod); setForm({nome:prod.nome,descricao:prod.descricao,preco:prod.preco,categoria:prod.categoria,emoji:prod.emoji}); setShowForm(true); };

  const handleSaveProd = async () => {
    if(!form.nome.trim()||!form.preco) return;
    try {
      if(editItem) {
        const updated = await produtosApi.atualizar(editItem.id,{...form,preco:parseFloat(form.preco),ativo:true});
        setProducts(prev=>prev.map(x=>x.id===editItem.id?updated:x));
      } else {
        const created = await produtosApi.criar({...form,preco:parseFloat(form.preco)});
        setProducts(prev=>[...prev,created]);
      }
      setShowForm(false);
    } catch(err) { alert(err.message); }
  };

  const handleDelete = async (id) => {
    if(!confirm("Remover produto?")) return;
    try { await produtosApi.remover(id); setProducts(prev=>prev.filter(x=>x.id!==id)); }
    catch(err) { alert(err.message); }
  };

  const TABS = [["pedidos","📋 Pedidos",pedidos.length],["cardapio","🍕 Cardápio",products.length],["marca","🎨 Marca",null]];

  return (
    <div style={{ minHeight:"100vh",background:"#f8f3ee" }}>
      <div style={{ background:"#1a1a1a",padding:"0 16px",display:"flex",alignItems:"center",gap:12,height:60 }}>
        <button onClick={onBack} style={{ background:"none",border:"none",color:"#aaa",cursor:"pointer",fontSize:20 }}>←</button>
        <span style={{ fontFamily:"'Playfair Display',Georgia,serif",color:"#fff",fontWeight:700,fontSize:18 }}>{brand.emoji} Painel {brand.name}</span>
        <div style={{ marginLeft:"auto",display:"flex",alignItems:"center",gap:6 }}>
          <div style={{ background:"#22a861",borderRadius:99,width:8,height:8,animation:"pulse 2s infinite" }}/>
          <span style={{ color:"#aaa",fontFamily:"Georgia,serif",fontSize:12 }}>ONLINE</span>
          <button onClick={()=>{ localStorage.removeItem("admin_token"); window.location.reload(); }}
            style={{ marginLeft:10,background:"none",border:"1px solid #555",color:"#aaa",borderRadius:8,padding:"4px 10px",cursor:"pointer",fontSize:12,fontFamily:"Georgia,serif" }}>
            Sair
          </button>
        </div>
      </div>

      {stats&&(
        <div style={{ background:"#fff",padding:"12px 16px",borderBottom:"1px solid #e8ddd5" }}>
          <div style={{ maxWidth:900,margin:"0 auto",display:"flex",gap:16,flexWrap:"wrap" }}>
            {[["📦 Pedidos Hoje",stats.total_pedidos],["💰 Faturamento",`R$ ${fmt(stats.faturamento)}`],["✅ Entregues",stats.entregues],["🔥 Em Preparo",stats.em_preparo]].map(([l,v])=>(
              <div key={l} style={{ background:"#f8f3ee",borderRadius:10,padding:"8px 16px",flex:1,minWidth:120 }}>
                <div style={{ fontFamily:"Georgia,serif",fontSize:12,color:"#888" }}>{l}</div>
                <div style={{ fontFamily:"'Playfair Display',Georgia,serif",fontWeight:700,fontSize:20,color:"#1a1a1a" }}>{v}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ display:"flex",borderBottom:"1px solid #e8ddd5",background:"#fff",overflowX:"auto" }}>
        {TABS.map(([id,label,count])=>(
          <button key={id} onClick={()=>setTab(id)} style={{ padding:"13px 18px",border:"none",cursor:"pointer",background:"none",fontFamily:"Georgia,serif",fontSize:14,color:tab===id?p:"#666",borderBottom:tab===id?`3px solid ${p}`:"3px solid transparent",fontWeight:tab===id?700:400,display:"flex",alignItems:"center",gap:6,flexShrink:0 }}>
            {label}
            {count!==null&&<span style={{ background:tab===id?p:"#eee",color:tab===id?"#fff":"#666",borderRadius:99,padding:"1px 8px",fontSize:12 }}>{count}</span>}
          </button>
        ))}
      </div>

      <div style={{ maxWidth:900,margin:"0 auto",padding:"20px 16px" }}>
        {loading&&<Spinner color={p}/>}

        {!loading&&tab==="pedidos"&&(
          pedidos.length===0
          ? <div style={{ textAlign:"center",padding:"60px 20px",color:"#aaa" }}><div style={{ fontSize:48,marginBottom:12 }}>📋</div><div style={{ fontFamily:"Georgia,serif",fontSize:16 }}>Aguardando pedidos...</div></div>
          : pedidos.map(o=>(
            <div key={o.number} style={{ background:"#fff",borderRadius:16,padding:20,marginBottom:14,boxShadow:"0 2px 12px rgba(0,0,0,.07)" }}>
              <div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:10,flexWrap:"wrap",gap:8 }}>
                <div>
                  <span style={{ fontFamily:"'Playfair Display',Georgia,serif",fontWeight:700,fontSize:18,color:p }}>{o.number}</span>
                  <span style={{ marginLeft:10,fontFamily:"Georgia,serif",fontSize:13,color:"#666" }}>{o.form?.nome} · {o.form?.tel}</span>
                </div>
                <span style={{ background:STATUS_COLORS[o.status]?.bg,color:STATUS_COLORS[o.status]?.text,padding:"4px 12px",borderRadius:99,fontSize:12,fontFamily:"Georgia,serif",fontWeight:700 }}>{o.status}</span>
              </div>
              <div style={{ fontFamily:"Georgia,serif",fontSize:13,color:"#555",marginBottom:10,lineHeight:1.7 }}>
                📍 {o.form?.rua}, {o.form?.num} — {o.form?.bairro}, {o.form?.cidade}<br/>
                {o.payment==="pix"?"💚 PIX":"💳 Cartão"} · <strong style={{ color:p }}>R$ {fmt(o.total)}</strong>
              </div>
              <div style={{ marginBottom:12 }}>
                {(o.cart||o.itens||[]).map((i,idx)=>(
                  <span key={idx} style={{ display:"inline-block",background:"#f8f3ee",borderRadius:99,padding:"3px 10px",marginRight:6,marginBottom:4,fontSize:12,fontFamily:"Georgia,serif" }}>
                    {i.emoji} {i.name||i.nome} ×{i.qty||i.quantidade}
                  </span>
                ))}
              </div>
              <div style={{ display:"flex",gap:6,flexWrap:"wrap" }}>
                {STATUS_FLOW.map(s=>(<button key={s} onClick={()=>handleStatus(o.number,s)} style={{ padding:"7px 13px",borderRadius:99,cursor:"pointer",fontSize:12,fontFamily:"Georgia,serif",fontWeight:o.status===s?700:400,border:o.status===s?`2px solid ${p}`:"2px solid #e8ddd5",background:o.status===s?p:"#fff",color:o.status===s?"#fff":"#555",transition:"all .2s" }}>{s}</button>))}
              </div>
            </div>
          ))
        )}

        {!loading&&tab==="cardapio"&&(
          <>
            <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14 }}>
              <h3 style={{ fontFamily:"'Playfair Display',Georgia,serif",fontSize:22,margin:0 }}>Cardápio</h3>
              <button onClick={openAdd} style={{ background:p,color:"#fff",border:"none",borderRadius:99,padding:"10px 20px",cursor:"pointer",fontFamily:"Georgia,serif",fontWeight:700,fontSize:14 }}>+ Novo</button>
            </div>
            {showForm&&(
              <div style={{ background:"#fff",borderRadius:16,padding:20,marginBottom:16,boxShadow:"0 2px 16px rgba(0,0,0,.1)" }}>
                <h4 style={{ fontFamily:"'Playfair Display',Georgia,serif",fontSize:17,margin:"0 0 14px",color:p }}>{editItem?"✏️ Editar":"➕ Novo Produto"}</h4>
                {[["Nome","nome","Ex: Margherita"],["Descrição","descricao","Ingredientes..."],["Emoji","emoji","🍕"]].map(([l,k,ph])=>(
                  <div key={k} style={{ marginBottom:10 }}><label style={{ display:"block",fontFamily:"Georgia,serif",fontSize:13,color:"#555",marginBottom:3 }}>{l}</label>
                    <input value={form[k]} onChange={e=>setForm(f=>({...f,[k]:e.target.value}))} placeholder={ph} style={{ width:"100%",padding:"10px 14px",borderRadius:10,border:"2px solid #e8ddd5",fontFamily:"Georgia,serif",fontSize:14,outline:"none",boxSizing:"border-box" }}/>
                  </div>
                ))}
                <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:10 }}>
                  <div><label style={{ display:"block",fontFamily:"Georgia,serif",fontSize:13,color:"#555",marginBottom:3 }}>Preço (R$)</label>
                    <input type="number" value={form.preco} onChange={e=>setForm(f=>({...f,preco:e.target.value}))} placeholder="0.00" style={{ width:"100%",padding:"10px 14px",borderRadius:10,border:"2px solid #e8ddd5",fontFamily:"Georgia,serif",fontSize:14,outline:"none",boxSizing:"border-box" }}/></div>
                  <div><label style={{ display:"block",fontFamily:"Georgia,serif",fontSize:13,color:"#555",marginBottom:3 }}>Categoria</label>
                    <select value={form.categoria} onChange={e=>setForm(f=>({...f,categoria:e.target.value}))} style={{ width:"100%",padding:"10px 14px",borderRadius:10,border:"2px solid #e8ddd5",fontFamily:"Georgia,serif",fontSize:14,outline:"none",background:"#fff",boxSizing:"border-box" }}>
                      {["Pizzas","Combos","Bebidas","Sobremesas"].map(c=><option key={c}>{c}</option>)}
                    </select></div>
                </div>
                <div style={{ display:"flex",gap:10 }}>
                  <button onClick={handleSaveProd} style={{ flex:1,padding:12,background:p,color:"#fff",border:"none",borderRadius:10,fontFamily:"Georgia,serif",fontWeight:700,cursor:"pointer" }}>{editItem?"Salvar":"Adicionar"}</button>
                  <button onClick={()=>setShowForm(false)} style={{ padding:"12px 18px",background:"#f0ebe6",color:"#555",border:"none",borderRadius:10,fontFamily:"Georgia,serif",cursor:"pointer" }}>Cancelar</button>
                </div>
              </div>
            )}
            <div style={{ display:"grid",gap:10 }}>
              {products.map(prod=>(
                <div key={prod.id} style={{ background:"#fff",borderRadius:12,padding:"13px 16px",boxShadow:"0 1px 8px rgba(0,0,0,.06)",display:"flex",alignItems:"center",gap:12 }}>
                  <span style={{ fontSize:30,flexShrink:0 }}>{prod.emoji}</span>
                  <div style={{ flex:1,minWidth:0 }}>
                    <div style={{ fontFamily:"Georgia,serif",fontWeight:700,fontSize:14 }}>{prod.nome}</div>
                    <div style={{ fontSize:11,color:"#888",marginTop:2 }}>{prod.descricao?.substring(0,50)}…</div>
                    <div style={{ display:"flex",gap:6,marginTop:4 }}>
                      <span style={{ background:"#fff5f5",color:p,fontSize:11,fontWeight:700,padding:"2px 8px",borderRadius:99 }}>R$ {fmt(prod.preco)}</span>
                      <span style={{ background:"#f0ebe6",color:"#888",fontSize:11,padding:"2px 8px",borderRadius:99 }}>{prod.categoria}</span>
                      {!prod.ativo&&<span style={{ background:"#f5f5f5",color:"#999",fontSize:11,padding:"2px 8px",borderRadius:99 }}>Inativo</span>}
                    </div>
                  </div>
                  <div style={{ display:"flex",gap:6,flexShrink:0 }}>
                    <button onClick={()=>openEdit(prod)} style={{ padding:"6px 10px",borderRadius:8,background:"#f0ebe6",border:"none",cursor:"pointer",fontSize:13 }}>✏️</button>
                    <button onClick={()=>handleDelete(prod.id)} style={{ padding:"6px 10px",borderRadius:8,background:"#fff5f5",border:"none",cursor:"pointer",fontSize:13 }}>🗑️</button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {!loading&&tab==="marca"&&<BrandEditor brand={brand} onChange={onBrandChange}/>}
      </div>
    </div>
  );
}

// ── Main App ──────────────────────────────────────────────────────────────
export default function App() {
  const [page,setPage]=useState("menu");
  const [brand,setBrand]=useState(DEFAULT_BRAND);
  const [products,setProducts]=useState([]);
  const [cart,setCart]=useState([]);
  const [cartOpen,setCartOpen]=useState(false);
  const [category,setCategory]=useState("Todos");
  const [search,setSearch]=useState("");
  const [toast,setToast]=useState(null);
  const [confirmedOrder,setConfirmedOrder]=useState(null);
  const [loadingInit,setLoadingInit]=useState(true);
  const [adminLoggedIn,setAdminLoggedIn]=useState(false);

  // Carrega dados iniciais
  useEffect(() => {
    Promise.all([marcaApi.carregar(), produtosApi.listar()])
      .then(([m,p]) => { setBrand(m); setProducts(p); })
      .catch(() => {}) // usa defaults se backend offline
      .finally(() => setLoadingInit(false));
  }, []);

  // Socket para atualizações em tempo real no menu
  useSocket({
    "produto:criado": (p) => setProducts(prev=>[...prev,p]),
    "produto:atualizado": (p) => setProducts(prev=>prev.map(x=>x.id===p.id?p:x)),
    "produto:removido": ({id}) => setProducts(prev=>prev.filter(x=>x.id!==id)),
    "marca:atualizada": (m) => setBrand(m),
  });

  const cartCount = cart.reduce((s,i)=>s+i.qty,0);
  const p = brand.color.primary;

  const addToCart = (product) => {
    setCart(prev => {
      const ex = prev.find(i=>i.id===product.id);
      if(ex) return prev.map(i=>i.id===product.id?{...i,qty:i.qty+1}:i);
      return [...prev, {...product, qty:1, price: product.preco || product.price, name: product.nome || product.name}];
    });
    setToast(`${product.nome||product.name} adicionado!`);
  };
  const updateCart = (id,qty) => { if(qty<=0) setCart(prev=>prev.filter(i=>i.id!==id)); else setCart(prev=>prev.map(i=>i.id===id?{...i,qty}:i)); };

  const filteredProducts = products.filter(prod => {
    const matchCat = category==="Todos"||prod.categoria===category||prod.category===category;
    const name = (prod.nome||prod.name||"").toLowerCase();
    const desc = (prod.descricao||prod.desc||"").toLowerCase();
    const matchSearch = !search||name.includes(search.toLowerCase())||desc.includes(search.toLowerCase());
    return matchCat&&matchSearch;
  });

  // Admin
  if(page==="admin") {
    if(!adminLoggedIn) return <LoginPage onLogin={()=>setAdminLoggedIn(true)}/>;
    return <AdminPanel onBack={()=>setPage("menu")} brand={brand} onBrandChange={setBrand}/>;
  }

  if(page==="confirm") return (
    <><Navbar brand={brand} cartCount={0} onCartClick={()=>{}} onLogoClick={()=>setPage("menu")} searchQuery="" onSearch={()=>{}}/>
    <ConfirmationPage order={confirmedOrder} onNewOrder={()=>setPage("menu")} brand={brand}/></>
  );

  if(page==="checkout") return (
    <><Navbar brand={brand} cartCount={cartCount} onCartClick={()=>setCartOpen(true)} onLogoClick={()=>setPage("menu")} searchQuery={search} onSearch={setSearch}/>
    <CheckoutPage cart={cart} onBack={()=>setPage("menu")} onConfirm={(o)=>{ setConfirmedOrder(o); setCart([]); setPage("confirm"); }} brand={brand}/>
    {cartOpen&&<CartPanel cart={cart} onClose={()=>setCartOpen(false)} onUpdate={updateCart} onCheckout={()=>{setCartOpen(false);setPage("checkout")}} brand={brand}/>}</>
  );

  return (
    <div style={{ minHeight:"100vh",background:"#FFF8F0",fontFamily:"Georgia,serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700;900&display=swap');
        @keyframes slideUp{from{opacity:0;transform:translateX(-50%) translateY(20px)}to{opacity:1;transform:translateX(-50%) translateY(0)}}
        @keyframes slideInRight{from{transform:translateX(100%)}to{transform:translateX(0)}}
        @keyframes bounce{0%,100%{transform:translateY(0)}50%{transform:translateY(-16px)}}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}
        @keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
        *{box-sizing:border-box}
        input::placeholder{color:rgba(255,255,255,.6)}
      `}</style>

      <Navbar brand={brand} cartCount={cartCount} onCartClick={()=>setCartOpen(true)} onLogoClick={()=>{setPage("menu");setCategory("Todos");setSearch("");}} searchQuery={search} onSearch={setSearch}/>
      <CategoryBar selected={category} onSelect={setCategory} brand={brand}/>

      {category==="Todos"&&!search&&(
        <div style={{ background:`linear-gradient(135deg,${p} 0%,${brand.color.dark} 100%)`,padding:"32px 16px",textAlign:"center",color:"#fff",transition:"background .4s" }}>
          <div style={{ maxWidth:600,margin:"0 auto" }}>
            <div style={{ fontSize:48,marginBottom:8 }}>{brand.emoji}</div>
            <h1 style={{ fontFamily:"'Playfair Display',Georgia,serif",fontSize:"clamp(24px,5vw,36px)",fontWeight:900,margin:"0 0 8px",lineHeight:1.2 }}>{brand.name}</h1>
            <p style={{ fontFamily:"Georgia,serif",fontSize:15,opacity:.85,margin:"0 0 16px",maxWidth:400,marginLeft:"auto",marginRight:"auto" }}>{brand.tagline}</p>
            <div style={{ display:"flex",gap:16,justifyContent:"center",flexWrap:"wrap" }}>
              {["⏱️ 35-50 min","🚴 Grátis acima R$50","⭐ 4.9 (2.4k)"].map(t=>(
                <span key={t} style={{ fontSize:13,opacity:.9,background:"rgba(255,255,255,.15)",padding:"5px 12px",borderRadius:99 }}>{t}</span>
              ))}
            </div>
          </div>
        </div>
      )}

      <div style={{ maxWidth:900,margin:"0 auto",padding:"24px 16px 80px" }}>
        {loadingInit ? <Spinner color={p}/> : (
          filteredProducts.length===0
          ? <div style={{ textAlign:"center",padding:"60px 20px",color:"#aaa" }}><div style={{ fontSize:48,marginBottom:12 }}>🔍</div><div style={{ fontFamily:"Georgia,serif",fontSize:16 }}>Nenhum produto encontrado</div></div>
          : <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(220px,1fr))",gap:16 }}>
              {filteredProducts.map(prod=><ProductCard key={prod.id} product={prod} onAdd={addToCart} brand={brand}/>)}
            </div>
        )}
      </div>

      <button onClick={()=>setPage("admin")} style={{ position:"fixed",bottom:20,right:20,background:"#1a1a1a",color:"#fff",border:"none",borderRadius:99,padding:"10px 18px",cursor:"pointer",fontFamily:"Georgia,serif",fontSize:13,fontWeight:700,boxShadow:"0 4px 16px rgba(0,0,0,.3)",zIndex:50 }}>⚙️ Admin</button>

      {cartOpen&&<CartPanel cart={cart} onClose={()=>setCartOpen(false)} onUpdate={updateCart} onCheckout={()=>{setCartOpen(false);setPage("checkout")}} brand={brand}/>}
      {toast&&<Toast message={toast} onDone={()=>setToast(null)}/>}
    </div>
  );
}
