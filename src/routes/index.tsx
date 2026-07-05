// @ts-nocheck
import { createFileRoute } from "@tanstack/react-router";
import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  Search, ShoppingBag, Plus, Minus, Trash2, MapPin, Package,
  Users, Truck, Settings, BarChart2, X, Check, Edit2, ChevronLeft, ChevronRight,
  Clock, TrendingUp, Tag, Snowflake, Save, Lock, LogOut, Copy,
  CreditCard, Banknote, AlertCircle, Store, Wallet, Star, Printer, Image as ImageIcon,
  FileDown, Radio
} from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "GORIEEE Muzqaymoq — Premium sifat" },
      { name: "description", content: "GORIEEE muzqaymoq: online buyurtma, yetkazib berish va do'kon boshqaruvi." },
      { property: "og:title", content: "GORIEEE Muzqaymoq" },
      { property: "og:description", content: "Premium sifat, har bir qoshiqda." },
      { property: "og:type", content: "website" },
    ],
  }),
  component: App,
});

/* ---------------- helpers ---------------- */
const FLAVORS = [
  { emoji: "🍓", color: "#FF5C8A" }, { emoji: "🍫", color: "#C97B3D" },
  { emoji: "🍋", color: "#FFD93D" }, { emoji: "🥝", color: "#8DDA6B" },
  { emoji: "🫐", color: "#6C8CFF" }, { emoji: "🍒", color: "#FF4D6D" },
  { emoji: "🌰", color: "#B08968" }, { emoji: "🍯", color: "#FFB84D" },
  { emoji: "🥥", color: "#E8E4D8" }, { emoji: "🍊", color: "#FF9F43" },
];
function hashStr(s) { let h = 0; for (let i = 0; i < s.length; i++) h = (h << 5) - h + s.charCodeAt(i); return Math.abs(h); }
const flavorFor = (seed) => FLAVORS[hashStr(seed || "x") % FLAVORS.length];
const uid = () => Math.random().toString(36).slice(2, 10);
const fmt = (n) => new Intl.NumberFormat("uz-UZ").format(Math.round(n || 0)) + " so'm";
const todayStr = () => new Date().toDateString();

const DEFAULT_INFO = { name: "GORIEEE Muzqaymoq", tagline: "Premium sifat, har bir qoshiqda", address: "Toshkent shahri", phone: "+998 90 000 00 00" };
const DEFAULT_CATEGORIES = [
  { id: "c1", name: "Mevali" }, { id: "c2", name: "Shokoladli" },
  { id: "c3", name: "Yong'oqli" }, { id: "c4", name: "Maxsus" },
];
const DEFAULT_PRODUCTS = [
  { id: "p1", name: "Qulupnayli", categoryId: "c1", price: 15000, desc: "Yangi qulupnay bilan tayyorlangan, yengil va tetiklantiruvchi ta'm.", popular: true, image: "" },
  { id: "p2", name: "Limonli sorbet", categoryId: "c1", price: 14000, desc: "Muzdek limon sorbeti, yozgi kunlar uchun ideal.", popular: false, image: "" },
  { id: "p3", name: "Shokoladli", categoryId: "c2", price: 16000, desc: "Belgiya qora shokoladi qo'shilgan klassik ta'm.", popular: true, image: "" },
  { id: "p4", name: "Fistashkali", categoryId: "c3", price: 18000, desc: "Haqiqiy fistashka yong'og'idan tayyorlangan premium ta'm.", popular: true, image: "" },
  { id: "p5", name: "Bananli split", categoryId: "c4", price: 22000, desc: "Banan, krem va qovurilgan yong'oq bilan boy tarkib.", popular: false, image: "" },
  { id: "p6", name: "Ko'k moviy", categoryId: "c4", price: 17000, desc: "Ko'k mevalar aralashmasidan tayyorlangan maxsus retsept.", popular: false, image: "" },
];
const DEFAULT_ADMIN_AUTH = { username: "svitlo_gorieee", password: "admin2026" };

function safeGet(key, fallback) {
  try {
    if (typeof window === "undefined") return fallback;
    const raw = window.localStorage.getItem(key);
    return raw != null ? JSON.parse(raw) : fallback;
  } catch { return fallback; }
}
function safeSet(key, value) {
  try {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch (e) { console.error("storage error", key, e); }
}

/* ---------------- receipt printing ---------------- */
function printReceipt(order, info) {
  const win = window.open("", "_blank", "width=380,height=640");
  if (!win) return;
  const lines = order.items.map(i =>
    `<tr><td>${i.name} x${i.qty}</td><td style="text-align:right">${fmt(i.price * i.qty)}</td></tr>`
  ).join("");
  const d = new Date(order.createdAt);
  const dateStr = d.toLocaleString("uz-UZ");
  win.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>Chek #${order.id}</title>
    <style>
      * { box-sizing: border-box; }
      body { font-family: 'Courier New', monospace; width: 300px; margin: 0 auto; padding: 12px; color: #000; }
      h1 { text-align: center; font-size: 16px; margin: 4px 0; }
      .sub { text-align: center; font-size: 11px; margin-bottom: 6px; }
      hr { border: none; border-top: 1px dashed #000; margin: 8px 0; }
      table { width: 100%; font-size: 12px; border-collapse: collapse; }
      td { padding: 2px 0; vertical-align: top; }
      .row { display: flex; justify-content: space-between; font-size: 12px; padding: 2px 0; }
      .total { font-size: 15px; font-weight: 700; }
      .foot { text-align: center; font-size: 11px; margin-top: 10px; }
      @media print { body { width: auto; padding: 0; } }
    </style></head><body>
    <h1>${info.name}</h1>
    <div class="sub">${info.tagline || ""}</div>
    <div class="sub">${info.address || ""} · ${info.phone || ""}</div>
    <hr/>
    <div class="row"><span>Chek №</span><span>${order.id.toUpperCase()}</span></div>
    <div class="row"><span>Sana</span><span>${dateStr}</span></div>
    <div class="row"><span>Mijoz</span><span>${order.customerName}</span></div>
    <div class="row"><span>Tel</span><span>${order.phone}</span></div>
    <div class="row"><span>Manzil</span><span style="text-align:right;max-width:180px">${order.address}</span></div>
    <hr/>
    <table>${lines}</table>
    <hr/>
    <div class="row total"><span>JAMI</span><span>${fmt(order.total)}</span></div>
    <div class="row"><span>To'lov</span><span>${order.paymentMethod} · ${order.paymentStatus}</span></div>
    <hr/>
    <div class="foot">Xaridingiz uchun rahmat!<br/>Yana tashrif buyuring 🍦</div>
    <script>window.onload=()=>{window.print();setTimeout(()=>window.close(),300);}</script>
    </body></html>`);
  win.document.close();
}

/* ---------------- PDF helpers ---------------- */
function downloadReceiptPDF(order, info) {
  const doc = new jsPDF({ unit: "mm", format: [80, 200] });
  let y = 8;
  doc.setFont("helvetica", "bold"); doc.setFontSize(12);
  doc.text(info.name || "Chek", 40, y, { align: "center" }); y += 5;
  doc.setFont("helvetica", "normal"); doc.setFontSize(8);
  if (info.tagline) { doc.text(info.tagline, 40, y, { align: "center" }); y += 4; }
  doc.text(`${info.address || ""} · ${info.phone || ""}`, 40, y, { align: "center" }); y += 4;
  doc.setLineDashPattern([1, 1], 0); doc.line(4, y, 76, y); y += 4;
  doc.setFontSize(9);
  doc.text(`Chek: ${order.id.toUpperCase()}`, 4, y); y += 4;
  doc.text(`Sana: ${new Date(order.createdAt).toLocaleString("uz-UZ")}`, 4, y); y += 4;
  doc.text(`Mijoz: ${order.customerName}`, 4, y); y += 4;
  doc.text(`Tel: ${order.phone}`, 4, y); y += 4;
  const addrLines = doc.splitTextToSize(`Manzil: ${order.address}`, 72);
  addrLines.forEach((l) => { doc.text(l, 4, y); y += 4; });
  doc.line(4, y, 76, y); y += 4;
  order.items.forEach((it) => {
    doc.text(`${it.name} x${it.qty}`, 4, y);
    doc.text(fmt(it.price * it.qty), 76, y, { align: "right" });
    y += 4;
  });
  doc.line(4, y, 76, y); y += 5;
  doc.setFont("helvetica", "bold"); doc.setFontSize(11);
  doc.text("JAMI", 4, y); doc.text(fmt(order.total), 76, y, { align: "right" }); y += 5;
  doc.setFont("helvetica", "normal"); doc.setFontSize(8);
  doc.text(`To'lov: ${order.paymentMethod} · ${order.paymentStatus}`, 4, y); y += 5;
  doc.text("Rahmat! Yana tashrif buyuring", 40, y, { align: "center" });
  doc.save(`chek-${order.id}.pdf`);
}

function downloadSalesReportPDF(period, orders, info) {
  const doc = new jsPDF();
  doc.setFontSize(16); doc.setFont("helvetica", "bold");
  doc.text(`${info.name || "Do'kon"} — Savdo hisoboti`, 14, 16);
  doc.setFontSize(10); doc.setFont("helvetica", "normal");
  doc.text(`Davr: ${period.label}   ·   Yaratilgan: ${new Date().toLocaleString("uz-UZ")}`, 14, 23);
  const revenue = orders.reduce((s, o) => s + (o.paymentStatus === "to'langan" ? o.total : 0), 0);
  const debt = orders.reduce((s, o) => s + (o.paymentStatus === "qarz" ? o.total : 0), 0);
  const qty = orders.reduce((s, o) => s + o.items.reduce((x, it) => x + it.qty, 0), 0);
  doc.setFont("helvetica", "bold"); doc.setFontSize(11);
  doc.text(`Buyurtmalar: ${orders.length}   Sotilgan dona: ${qty}   Tushum: ${fmt(revenue)}   Qarz: ${fmt(debt)}`, 14, 32);
  autoTable(doc, {
    startY: 38,
    head: [["Sana", "Mijoz", "Tel", "Mahsulotlar", "Summa", "To'lov"]],
    body: orders.map((o) => [
      new Date(o.createdAt).toLocaleString("uz-UZ"),
      o.customerName, o.phone,
      o.items.map((i) => `${i.name} x${i.qty}`).join(", "),
      fmt(o.total),
      `${o.paymentMethod} · ${o.paymentStatus}`,
    ]),
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [124, 108, 255] },
  });
  doc.save(`hisobot-${period.key}-${Date.now()}.pdf`);
}

/* ---------------- image helpers ---------------- */
function getProductImages(p) {
  if (Array.isArray(p.images) && p.images.length) return p.images;
  if (p.image) return [p.image];
  return [];
}

/* ---------------- root ---------------- */
function App() {
  const [mode, setMode] = useState("client");
  const [loaded, setLoaded] = useState(false);
  const [loginModal, setLoginModal] = useState(null);
  const [loggedEmployee, setLoggedEmployee] = useState(null);

  const [info, setInfo] = useState(DEFAULT_INFO);
  const [categories, setCategories] = useState(DEFAULT_CATEGORIES);
  const [products, setProducts] = useState(DEFAULT_PRODUCTS);
  const [shops, setShops] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [orders, setOrders] = useState([]);
  const [debtPayments, setDebtPayments] = useState([]);
  const [adminAuth, setAdminAuth] = useState(DEFAULT_ADMIN_AUTH);

  useEffect(() => {
    setInfo(safeGet("pi_info", DEFAULT_INFO));
    setCategories(safeGet("pi_categories", DEFAULT_CATEGORIES));
    setProducts(safeGet("pi_products", DEFAULT_PRODUCTS));
    setShops(safeGet("pi_shops", []));
    setEmployees(safeGet("pi_employees", []));
    setVehicles(safeGet("pi_vehicles", []));
    setOrders(safeGet("pi_orders", []));
    setDebtPayments(safeGet("pi_debt_payments", []));
    setAdminAuth(safeGet("pi_admin_auth", DEFAULT_ADMIN_AUTH));
    setLoaded(true);
  }, []);

  // Real-time cross-tab sync: when another tab (admin/employee/client) updates
  // localStorage, mirror it here so status changes reflect live.
  useEffect(() => {
    const map = {
      pi_info: setInfo, pi_categories: setCategories, pi_products: setProducts,
      pi_shops: setShops, pi_employees: setEmployees, pi_vehicles: setVehicles,
      pi_orders: setOrders, pi_debt_payments: setDebtPayments, pi_admin_auth: setAdminAuth,
    };
    const onStorage = (e) => {
      if (!e.key || !(e.key in map) || e.newValue == null) return;
      try { map[e.key](JSON.parse(e.newValue)); } catch { /* ignore */ }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const persist = {
    info: (v) => { setInfo(v); safeSet("pi_info", v); },
    categories: (v) => { setCategories(v); safeSet("pi_categories", v); },
    products: (v) => { setProducts(v); safeSet("pi_products", v); },
    shops: (v) => { setShops(v); safeSet("pi_shops", v); },
    employees: (v) => { setEmployees(v); safeSet("pi_employees", v); },
    vehicles: (v) => { setVehicles(v); safeSet("pi_vehicles", v); },
    orders: (v) => { setOrders(v); safeSet("pi_orders", v); },
    debtPayments: (v) => { setDebtPayments(v); safeSet("pi_debt_payments", v); },
    adminAuth: (v) => { setAdminAuth(v); safeSet("pi_admin_auth", v); },
  };

  const handleSearchSubmit = (value) => {
    const v = value.trim().toLowerCase();
    if (v === "admin") setLoginModal("admin");
    else if (v === "ishchi") setLoginModal("employee");
  };

  const tryAdminLogin = (u, p) => {
    if (u === adminAuth.username && p === adminAuth.password) { setMode("admin"); setLoginModal(null); return null; }
    return "Login yoki parol noto'g'ri";
  };
  const tryEmployeeLogin = (u, p) => {
    const emp = employees.find((e) => e.username === u && e.password === p);
    if (emp) { setLoggedEmployee(emp); setMode("employee"); setLoginModal(null); return null; }
    return "Login yoki parol noto'g'ri";
  };

  if (!loaded) {
    return <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#0B0B0E", color: "#98989F", fontFamily: "sans-serif" }}>Yuklanmoqda...</div>;
  }

  return (
    <div style={{
      "--bg": "#0B0B0E", "--panel": "rgba(255,255,255,0.055)", "--panel-solid": "#17171B",
      "--border": "rgba(255,255,255,0.10)", "--text": "#F5F5F7", "--dim": "#98989F",
      "--accent": "#7C6CFF", "--accent2": "#4C5FD5", "--good": "#3DDC97", "--warn": "#FFB84D", "--bad": "#FF5C6C",
      fontFamily: "'Inter','SF Pro Display','Segoe UI',sans-serif", minHeight: "100vh",
      background: "radial-gradient(circle at 50% -10%, #1C1C22 0%, #0B0B0E 55%)", color: "var(--text)",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        * { box-sizing: border-box; }
        button { font-family: inherit; cursor: pointer; }
        input, select, textarea { font-family: inherit; }
        body::-webkit-scrollbar { display: none; }
        .glass { background: var(--panel); border: 1px solid var(--border); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px); }
      `}</style>

      {mode === "client" && (
        <ClientView
          info={info} categories={categories} products={products} orders={orders} setOrders={persist.orders}
          onSearchSubmit={handleSearchSubmit}
        />
      )}
      {mode === "admin" && (
        <AdminView
          onLogout={() => setMode("client")}
          info={info} setInfo={persist.info}
          categories={categories} setCategories={persist.categories}
          products={products} setProducts={persist.products}
          shops={shops} setShops={persist.shops}
          employees={employees} setEmployees={persist.employees}
          vehicles={vehicles} setVehicles={persist.vehicles}
          orders={orders} setOrders={persist.orders}
          debtPayments={debtPayments} setDebtPayments={persist.debtPayments}
          adminAuth={adminAuth} setAdminAuth={persist.adminAuth}
        />
      )}
      {mode === "employee" && loggedEmployee && (
        <EmployeeView
          employee={employees.find((e) => e.id === loggedEmployee.id) || loggedEmployee}
          shops={shops} vehicles={vehicles} setVehicles={persist.vehicles}
          orders={orders} setOrders={persist.orders} info={info}
          onLogout={() => { setLoggedEmployee(null); setMode("client"); }}
        />
      )}

      {loginModal && (
        <LoginModal
          kind={loginModal}
          onClose={() => setLoginModal(null)}
          onSubmit={loginModal === "admin" ? tryAdminLogin : tryEmployeeLogin}
        />
      )}
    </div>
  );
}

/* ---------------- shared UI atoms ---------------- */
function GlassCard({ children, style }) {
  return <div className="glass" style={{ borderRadius: 18, padding: 16, marginBottom: 12, ...style }}>{children}</div>;
}
function Pill({ children, tone = "default", style }) {
  const tones = {
    default: { bg: "rgba(255,255,255,0.08)", fg: "var(--dim)" },
    good: { bg: "rgba(61,220,151,0.15)", fg: "var(--good)" },
    warn: { bg: "rgba(255,184,77,0.15)", fg: "var(--warn)" },
    bad: { bg: "rgba(255,92,108,0.15)", fg: "var(--bad)" },
    accent: { bg: "rgba(124,108,255,0.18)", fg: "#B3A8FF" },
  };
  const t = tones[tone];
  return <span style={{ background: t.bg, color: t.fg, borderRadius: 999, padding: "3px 10px", fontSize: 11, fontWeight: 700, ...style }}>{children}</span>;
}
function GhostBtn({ onClick, children, danger, primary, style }) {
  return (
    <button onClick={onClick} style={{
      border: primary ? "none" : "1px solid var(--border)", borderRadius: 10, padding: "7px 12px", fontSize: 12, fontWeight: 700,
      background: primary ? "linear-gradient(135deg,var(--accent),var(--accent2))" : danger ? "rgba(255,92,108,0.12)" : "rgba(255,255,255,0.06)",
      color: primary ? "#fff" : danger ? "var(--bad)" : "var(--text)",
      display: "inline-flex", alignItems: "center", gap: 5, ...style,
    }}>{children}</button>
  );
}
function Field(props) {
  return <input {...props} style={{ border: "1px solid var(--border)", background: "rgba(255,255,255,0.04)", color: "var(--text)",
    borderRadius: 10, padding: "10px 12px", fontSize: 13, width: "100%", outline: "none", ...(props.style || {}) }} />;
}
function Select({ children, ...props }) {
  return <select {...props} style={{ border: "1px solid var(--border)", background: "#17171B", color: "var(--text)",
    borderRadius: 10, padding: "10px 12px", fontSize: 13, outline: "none", ...(props.style || {}) }}>{children}</select>;
}

function ProductImage({ product, height = 88, fontSize = 40 }) {
  const f = flavorFor(product.name);
  const imgs = getProductImages(product);
  if (imgs.length) {
    return <div style={{ height, background: `linear-gradient(135deg, ${f.color}22, #000)`, overflow: "hidden", position: "relative" }}>
      <img src={imgs[0]} alt={product.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      {imgs.length > 1 && <span style={{ position: "absolute", right: 6, top: 6, background: "rgba(0,0,0,0.55)", color: "#fff", fontSize: 10, fontWeight: 700, borderRadius: 999, padding: "2px 7px" }}>+{imgs.length - 1}</span>}
    </div>;
  }
  return <div style={{ height, background: `linear-gradient(135deg, ${f.color}55, ${f.color}10)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize }}>{f.emoji}</div>;
}

function ImageGallery({ images, name, color, emoji }) {
  const [idx, setIdx] = useState(0);
  if (!images.length) {
    return <div style={{ height: "100%", background: `linear-gradient(160deg, ${color}77, ${color}10)`, display: "flex", alignItems: "flex-end", padding: 20 }}>
      <div style={{ fontSize: 110, position: "absolute", right: 10, top: 30, opacity: 0.9 }}>{emoji}</div>
    </div>;
  }
  const prev = () => setIdx((i) => (i - 1 + images.length) % images.length);
  const next = () => setIdx((i) => (i + 1) % images.length);
  return (
    <div style={{ height: "100%", position: "relative", background: "#000" }}>
      <img src={images[idx]} alt={name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      {images.length > 1 && (
        <>
          <button onClick={prev} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", background: "rgba(0,0,0,0.55)", border: "none", color: "#fff", borderRadius: 999, width: 34, height: 34, display: "flex", alignItems: "center", justifyContent: "center" }}><ChevronLeft size={18} /></button>
          <button onClick={next} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "rgba(0,0,0,0.55)", border: "none", color: "#fff", borderRadius: 999, width: 34, height: 34, display: "flex", alignItems: "center", justifyContent: "center" }}><ChevronRight size={18} /></button>
          <div style={{ position: "absolute", bottom: 12, left: 0, right: 0, display: "flex", gap: 5, justifyContent: "center" }}>
            {images.map((_, i) => (
              <span key={i} onClick={() => setIdx(i)} style={{ width: i === idx ? 20 : 6, height: 6, borderRadius: 999, background: i === idx ? "#fff" : "rgba(255,255,255,0.5)", cursor: "pointer", transition: "width .2s" }} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

/* ---------------- LOGIN MODAL ---------------- */
function LoginModal({ kind, onClose, onSubmit }) {
  const [u, setU] = useState(""); const [p, setP] = useState(""); const [err, setErr] = useState(null);
  const submit = () => { const e = onSubmit(u, p); if (e) setErr(e); };
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: 20 }}>
      <div className="glass" style={{ borderRadius: 24, padding: 26, width: "100%", maxWidth: 340, background: "#151518" }}>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 14 }}>
          <div style={{ width: 52, height: 52, borderRadius: 16, background: "linear-gradient(135deg,var(--accent),var(--accent2))",
              display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Lock size={22} color="#fff" />
          </div>
        </div>
        <div style={{ textAlign: "center", fontWeight: 800, fontSize: 17, marginBottom: 2 }}>
          {kind === "admin" ? "Admin panelga kirish" : "Ishchi kirishi"}
        </div>
        <div style={{ textAlign: "center", fontSize: 12, color: "var(--dim)", marginBottom: 18 }}>Login va parolingizni kiriting</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <Field placeholder="Login" value={u} onChange={(e) => setU(e.target.value)} />
          <Field placeholder="Parol" type="password" value={p} onChange={(e) => setP(e.target.value)} onKeyDown={(e) => e.key === "Enter" && submit()} />
        </div>
        {err && <div style={{ color: "var(--bad)", fontSize: 12, marginTop: 10, display: "flex", alignItems: "center", gap: 5 }}><AlertCircle size={13} /> {err}</div>}
        <div style={{ display: "flex", gap: 8, marginTop: 18 }}>
          <GhostBtn style={{ flex: 1, justifyContent: "center" }} onClick={onClose}>Bekor qilish</GhostBtn>
          <GhostBtn style={{ flex: 1, justifyContent: "center" }} primary onClick={submit}>Kirish</GhostBtn>
        </div>
      </div>
    </div>
  );
}

/* ---------------- CLIENT VIEW ---------------- */
function ClientView({ info, categories, products, orders, setOrders, onSearchSubmit }) {
  const [query, setQuery] = useState("");
  const [activeCat, setActiveCat] = useState(null);
  const [detail, setDetail] = useState(null);
  const [cart, setCart] = useState({});
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [customer, setCustomer] = useState({ name: "", phone: "", address: "" });
  const [payMethod, setPayMethod] = useState("naqd");
  const [confirmed, setConfirmed] = useState(null);

  const onQueryChange = (v) => { setQuery(v); onSearchSubmit(v); };

  const filtered = products.filter((p) =>
    (!activeCat || p.categoryId === activeCat) &&
    (!query || p.name.toLowerCase().includes(query.toLowerCase())) &&
    !["admin", "ishchi"].includes(query.trim().toLowerCase())
  );
  const popular = products.filter((p) => p.popular);

  const cartItems = Object.entries(cart).filter(([, q]) => q > 0)
    .map(([id, qty]) => ({ product: products.find((p) => p.id === id), qty })).filter((c) => c.product);
  const cartTotal = cartItems.reduce((s, c) => s + c.product.price * c.qty, 0);
  const cartCount = cartItems.reduce((s, c) => s + c.qty, 0);
  const add = (id) => setCart((c) => ({ ...c, [id]: (c[id] || 0) + 1 }));
  const sub = (id) => setCart((c) => ({ ...c, [id]: Math.max(0, (c[id] || 0) - 1) }));

  const submitOrder = () => {
    if (!customer.name.trim() || !customer.phone.trim() || !customer.address.trim() || cartItems.length === 0) return;
    const order = {
      id: uid(),
      items: cartItems.map((c) => ({ productId: c.product.id, name: c.product.name, price: c.product.price, qty: c.qty })),
      total: cartTotal, customerName: customer.name, phone: customer.phone, address: customer.address,
      paymentMethod: payMethod, paymentStatus: payMethod === "qarz" ? "qarz" : "to'langan",
      shopId: null, employeeId: null, vehicleId: null, stockDeducted: false,
      status: "yangi", createdAt: Date.now(),
    };
    setOrders([order, ...orders]);
    setConfirmed(order);
    setCart({}); setCheckoutOpen(false);
    setCustomer({ name: "", phone: "", address: "" }); setPayMethod("naqd");
  };

  if (detail) return <ProductDetail product={detail} onBack={() => setDetail(null)} qty={cart[detail.id] || 0} onAdd={() => add(detail.id)} onSub={() => sub(detail.id)} />;

  return (
    <div style={{ maxWidth: 480, margin: "0 auto", padding: "20px 16px 110px", position: "relative" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 800, letterSpacing: -0.5, margin: 0 }}>{info.name}</h1>
          <div style={{ fontSize: 12, color: "var(--dim)" }}>{info.tagline}</div>
        </div>
        <div style={{ width: 42, height: 42, borderRadius: 14, background: "linear-gradient(135deg,var(--accent),var(--accent2))",
            display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>🍦</div>
      </div>

      <div className="glass" style={{ borderRadius: 14, padding: "10px 14px", display: "flex", alignItems: "center", gap: 10, marginBottom: 18 }}>
        <Search size={16} color="var(--dim)" />
        <input value={query} onChange={(e) => onQueryChange(e.target.value)} placeholder="Mahsulot qidirish..."
          style={{ flex: 1, background: "transparent", border: "none", outline: "none", color: "var(--text)", fontSize: 14 }} />
      </div>

      {confirmed && <ReceiptCard order={confirmed} info={info} onClose={() => setConfirmed(null)} />}

      {!query && !activeCat && popular.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontWeight: 800, fontSize: 14, marginBottom: 10, display: "flex", alignItems: "center", gap: 6 }}>
            <Star size={14} color="var(--warn)" /> Mashhur mahsulotlar
          </div>
          <div style={{ display: "flex", gap: 10, overflowX: "auto", paddingBottom: 6 }}>
            {popular.map((p) => (
              <div key={p.id} onClick={() => setDetail(p)} style={{ minWidth: 130, cursor: "pointer" }} className="glass">
                <div style={{ borderRadius: 18, overflow: "hidden" }}>
                  <ProductImage product={p} height={80} fontSize={34} />
                  <div style={{ padding: 10 }}>
                    <div style={{ fontWeight: 700, fontSize: 12 }}>{p.name}</div>
                    <div style={{ fontSize: 11, color: "var(--dim)", marginTop: 2 }}>{fmt(p.price)}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 6, marginBottom: 14 }}>
        <CatChip label="Barchasi" active={!activeCat} onClick={() => setActiveCat(null)} />
        {categories.map((c) => <CatChip key={c.id} label={c.name} active={activeCat === c.id} onClick={() => setActiveCat(c.id)} />)}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        {filtered.map((p) => {
          const qty = cart[p.id] || 0;
          return (
            <div key={p.id} className="glass" style={{ borderRadius: 18, overflow: "hidden" }}>
              <div onClick={() => setDetail(p)} style={{ cursor: "pointer" }}>
                <ProductImage product={p} />
              </div>
              <div style={{ padding: 12 }}>
                <div style={{ fontWeight: 700, fontSize: 13 }}>{p.name}</div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 8 }}>
                  <span style={{ fontWeight: 800, fontSize: 13 }}>{fmt(p.price)}</span>
                  {qty === 0 ? (
                    <button onClick={() => add(p.id)} style={{ background: "linear-gradient(135deg,var(--accent),var(--accent2))", border: "none", color: "#fff",
                        borderRadius: 10, width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center" }}><Plus size={15} /></button>
                  ) : (
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <button onClick={() => sub(p.id)} style={{ background: "rgba(255,255,255,0.08)", border: "none", color: "#fff", borderRadius: 8, width: 24, height: 24 }}><Minus size={12} /></button>
                      <span style={{ fontSize: 12, fontWeight: 700 }}>{qty}</span>
                      <button onClick={() => add(p.id)} style={{ background: "linear-gradient(135deg,var(--accent),var(--accent2))", border: "none", color: "#fff", borderRadius: 8, width: 24, height: 24 }}><Plus size={12} /></button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {cartCount > 0 && !checkoutOpen && (
        <div style={{ position: "fixed", bottom: 16, left: 16, right: 16, maxWidth: 448, margin: "0 auto" }}>
          <button onClick={() => setCheckoutOpen(true)} style={{ width: "100%", background: "linear-gradient(135deg,var(--accent),var(--accent2))",
              border: "none", color: "#fff", borderRadius: 18, padding: "15px 18px", display: "flex", alignItems: "center", justifyContent: "space-between",
              fontWeight: 800, boxShadow: "0 10px 30px rgba(124,108,255,0.35)" }}>
            <span style={{ display: "flex", alignItems: "center", gap: 8 }}><ShoppingBag size={18} /> Savatcha ({cartCount})</span>
            <span>{fmt(cartTotal)}</span>
          </button>
        </div>
      )}

      {checkoutOpen && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "flex-end", justifyContent: "center", zIndex: 60 }}>
          <div className="glass" style={{ background: "#141417", width: "100%", maxWidth: 480, borderRadius: "24px 24px 0 0", padding: 20, maxHeight: "88vh", overflowY: "auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <div style={{ fontWeight: 800, fontSize: 17 }}>Buyurtma</div>
              <button onClick={() => setCheckoutOpen(false)} style={{ background: "none", border: "none", color: "var(--text)" }}><X size={22} /></button>
            </div>
            {cartItems.map((c) => (
              <div key={c.product.id} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, padding: "7px 0", borderBottom: "1px solid var(--border)" }}>
                <span>{flavorFor(c.product.name).emoji} {c.product.name} x{c.qty}</span>
                <span style={{ fontWeight: 700 }}>{fmt(c.product.price * c.qty)}</span>
              </div>
            ))}
            <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", fontWeight: 800 }}>
              <span>Jami</span><span>{fmt(cartTotal)}</span>
            </div>
            <div style={{ fontSize: 12, fontWeight: 700, color: "var(--dim)", margin: "10px 0 8px" }}>To'lov usuli</div>
            <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
              <PayOption icon={<Banknote size={15} />} label="Naqd" active={payMethod === "naqd"} onClick={() => setPayMethod("naqd")} />
              <PayOption icon={<CreditCard size={15} />} label="Karta" active={payMethod === "karta"} onClick={() => setPayMethod("karta")} />
              <PayOption icon={<Wallet size={15} />} label="Qarz" active={payMethod === "qarz"} onClick={() => setPayMethod("qarz")} />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <Field placeholder="Ismingiz" value={customer.name} onChange={(e) => setCustomer({ ...customer, name: e.target.value })} />
              <Field placeholder="Telefon raqamingiz" value={customer.phone} onChange={(e) => setCustomer({ ...customer, phone: e.target.value })} />
              <Field placeholder="Yetkazib berish manzili" value={customer.address} onChange={(e) => setCustomer({ ...customer, address: e.target.value })} />
            </div>
            <button onClick={submitOrder} style={{ width: "100%", marginTop: 16, background: "linear-gradient(135deg,var(--accent),var(--accent2))",
                border: "none", color: "#fff", borderRadius: 14, padding: 14, fontWeight: 800, fontSize: 15 }}>Buyurtma berish</button>
          </div>
        </div>
      )}

      <div style={{ textAlign: "center", fontSize: 11, color: "rgba(255,255,255,0.25)", marginTop: 26 }}>
        Xodim yoki admin bo'lsangiz, qidiruvga "ishchi" yoki "admin" deb yozing
      </div>
    </div>
  );
}

function ReceiptCard({ order, info, onClose }) {
  return (
    <GlassCard style={{ background: "rgba(61,220,151,0.08)", borderColor: "rgba(61,220,151,0.3)" }}>
      <div style={{ display: "flex", gap: 8, alignItems: "center", fontWeight: 800, marginBottom: 8, color: "var(--good)" }}>
        <Check size={18} /> Buyurtma qabul qilindi
      </div>
      <div style={{ background: "#fff", color: "#000", borderRadius: 12, padding: 14, fontFamily: "'Courier New',monospace", fontSize: 12 }}>
        <div style={{ textAlign: "center", fontWeight: 800, fontSize: 14 }}>{info.name}</div>
        <div style={{ textAlign: "center", fontSize: 10, marginBottom: 6 }}>{info.address} · {info.phone}</div>
        <div style={{ borderTop: "1px dashed #000", margin: "6px 0" }} />
        <div style={{ display: "flex", justifyContent: "space-between" }}><span>Chek №</span><span>{order.id.toUpperCase()}</span></div>
        <div style={{ display: "flex", justifyContent: "space-between" }}><span>Sana</span><span>{new Date(order.createdAt).toLocaleString("uz-UZ")}</span></div>
        <div style={{ display: "flex", justifyContent: "space-between" }}><span>Mijoz</span><span>{order.customerName}</span></div>
        <div style={{ display: "flex", justifyContent: "space-between" }}><span>Tel</span><span>{order.phone}</span></div>
        <div style={{ borderTop: "1px dashed #000", margin: "6px 0" }} />
        {order.items.map((it, i) => (
          <div key={i} style={{ display: "flex", justifyContent: "space-between" }}>
            <span>{it.name} x{it.qty}</span><span>{fmt(it.price * it.qty)}</span>
          </div>
        ))}
        <div style={{ borderTop: "1px dashed #000", margin: "6px 0" }} />
        <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 800, fontSize: 14 }}>
          <span>JAMI</span><span>{fmt(order.total)}</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between" }}><span>To'lov</span><span>{order.paymentMethod} · {order.paymentStatus}</span></div>
        <div style={{ textAlign: "center", marginTop: 8, fontSize: 10 }}>Rahmat! Yana tashrif buyuring 🍦</div>
      </div>
      <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
        <GhostBtn primary onClick={() => printReceipt(order, info)}><Printer size={13} /> Chekni chop etish</GhostBtn>
        <GhostBtn onClick={onClose}>Yopish</GhostBtn>
      </div>
    </GlassCard>
  );
}

function PayOption({ icon, label, active, onClick }) {
  return (
    <button onClick={onClick} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4, padding: "10px 6px",
        borderRadius: 12, border: active ? "1px solid var(--accent)" : "1px solid var(--border)",
        background: active ? "rgba(124,108,255,0.15)" : "rgba(255,255,255,0.03)", color: active ? "#fff" : "var(--dim)" }}>
      {icon}<span style={{ fontSize: 11, fontWeight: 700 }}>{label}</span>
    </button>
  );
}
function CatChip({ label, active, onClick }) {
  return (
    <button onClick={onClick} style={{ whiteSpace: "nowrap", padding: "8px 16px", borderRadius: 999, fontWeight: 700, fontSize: 12,
        border: active ? "none" : "1px solid var(--border)",
        background: active ? "linear-gradient(135deg,var(--accent),var(--accent2))" : "rgba(255,255,255,0.04)", color: "#fff" }}>{label}</button>
  );
}

function ProductDetail({ product, onBack, qty, onAdd, onSub }) {
  const f = flavorFor(product.name);
  const imgs = getProductImages(product);
  return (
    <div style={{ maxWidth: 480, margin: "0 auto", minHeight: "100vh" }}>
      <div style={{ height: 320, position: "relative", overflow: "hidden" }}>
        <ImageGallery images={imgs} name={product.name} color={f.color} emoji={f.emoji} />
        <button onClick={onBack} style={{ position: "absolute", top: 20, left: 20, background: "rgba(0,0,0,0.55)", border: "none", color: "#fff",
            borderRadius: 12, width: 38, height: 38, display: "flex", alignItems: "center", justifyContent: "center", zIndex: 5 }}><ChevronLeft size={20} /></button>
      </div>
      <div style={{ padding: 20 }}>
        <div style={{ fontSize: 24, fontWeight: 800 }}>{product.name}</div>
        <div style={{ fontSize: 20, fontWeight: 800, color: "var(--accent)", marginTop: 4 }}>{fmt(product.price)}</div>
        <div style={{ fontSize: 14, color: "var(--dim)", marginTop: 14, lineHeight: 1.7 }}>{product.desc || "Tavsif kiritilmagan."}</div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 30 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <button onClick={onSub} style={{ background: "rgba(255,255,255,0.08)", border: "none", color: "#fff", borderRadius: 12, width: 40, height: 40 }}><Minus size={16} /></button>
            <span style={{ fontWeight: 800, fontSize: 18 }}>{qty}</span>
            <button onClick={onAdd} style={{ background: "linear-gradient(135deg,var(--accent),var(--accent2))", border: "none", color: "#fff", borderRadius: 12, width: 40, height: 40 }}><Plus size={16} /></button>
          </div>
        </div>
        <button onClick={onAdd} style={{ width: "100%", marginTop: 26, background: "linear-gradient(135deg,var(--accent),var(--accent2))",
            border: "none", color: "#fff", borderRadius: 14, padding: 15, fontWeight: 800, fontSize: 15 }}>Savatga qo'shish</button>
      </div>
    </div>
  );
}

/* ---------------- ADMIN VIEW ---------------- */
const ADMIN_TABS = [
  { id: "orders", label: "Buyurtmalar", icon: Package },
  { id: "employees", label: "Ishchilar", icon: Users },
  { id: "vehicles", label: "Avtomobillar", icon: Truck },
  { id: "shops", label: "Do'konlar", icon: Store },
  { id: "products", label: "Mahsulotlar", icon: Tag },
  { id: "categories", label: "Kategoriyalar", icon: Snowflake },
  { id: "debtors", label: "Qarzdorlar", icon: Wallet },
  { id: "report", label: "Hisobot", icon: BarChart2 },
  { id: "settings", label: "Sozlamalar", icon: Settings },
];

function AdminView(props) {
  const [tab, setTab] = useState("orders");
  return (
    <div style={{ maxWidth: 920, margin: "0 auto", padding: 16 }}>
      <TopBar title="Boshqaruv paneli" onLogout={props.onLogout} />
      <div style={{ display: "flex", gap: 8, overflowX: "auto", marginBottom: 18, paddingBottom: 4 }}>
        {ADMIN_TABS.map((t) => {
          const Icon = t.icon; const active = tab === t.id;
          return (
            <button key={t.id} onClick={() => setTab(t.id)} style={{ display: "flex", alignItems: "center", gap: 6, whiteSpace: "nowrap",
                padding: "9px 14px", borderRadius: 12, fontWeight: 700, fontSize: 12,
                border: active ? "none" : "1px solid var(--border)",
                background: active ? "linear-gradient(135deg,var(--accent),var(--accent2))" : "rgba(255,255,255,0.04)", color: "#fff" }}>
              <Icon size={14} /> {t.label}
            </button>
          );
        })}
      </div>
      {tab === "orders" && <OrdersTab {...props} />}
      {tab === "employees" && <EmployeesTab {...props} />}
      {tab === "vehicles" && <VehiclesTab {...props} />}
      {tab === "shops" && <ShopsTab {...props} />}
      {tab === "products" && <ProductsTab {...props} />}
      {tab === "categories" && <CategoriesTab {...props} />}
      {tab === "debtors" && <DebtorsTab {...props} />}
      {tab === "report" && <ReportTab {...props} />}
      {tab === "settings" && <SettingsTab {...props} />}
    </div>
  );
}

function TopBar({ title, onLogout }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
      <div style={{ fontSize: 19, fontWeight: 800 }}>{title}</div>
      <GhostBtn onClick={onLogout}><LogOut size={13} /> Chiqish</GhostBtn>
    </div>
  );
}

function copyOrder(o, shops, employees) {
  const shop = shops.find((s) => s.id === o.shopId)?.name || "—";
  const emp = employees.find((e) => e.id === o.employeeId)?.name || "—";
  const text = `Buyurtma #${o.id}\nMijoz: ${o.customerName} (${o.phone})\nManzil: ${o.address}\nDo'kon: ${shop}\nIshchi: ${emp}\nMahsulotlar:\n${o.items.map((i) => `- ${i.name} x${i.qty} = ${fmt(i.price * i.qty)}`).join("\n")}\nJami: ${fmt(o.total)}\nTo'lov: ${o.paymentMethod} (${o.paymentStatus})\nHolat: ${o.status}`;
  try { navigator.clipboard.writeText(text); } catch { /* ignore */ }
  return text;
}

function OrdersTab({ orders, setOrders, shops, employees, vehicles, setVehicles, info }) {
  const STATUSES = ["yangi", "tayyorlanmoqda", "yetkazilmoqda", "yakunlandi"];

  const setField = (id, field, val) => setOrders(orders.map((o) => (o.id === id ? { ...o, [field]: val } : o)));

  const setStatus = (o, status) => {
    let next = { ...o, status };
    if (status === "yakunlandi" && !o.stockDeducted && o.vehicleId) {
      const totalQty = o.items.reduce((s, it) => s + it.qty, 0);
      setVehicles(vehicles.map((v) => (v.id === o.vehicleId ? { ...v, stock: Math.max(0, (v.stock || 0) - totalQty) } : v)));
      next.stockDeducted = true;
    }
    setOrders(orders.map((x) => (x.id === o.id ? next : x)));
  };

  const assignEmployee = (o, empId) => {
    const emp = employees.find((e) => e.id === empId);
    setOrders(orders.map((x) => (x.id === o.id ? { ...x, employeeId: empId || null, vehicleId: emp?.vehicleId || null, shopId: emp?.shopId || x.shopId } : x)));
  };

  const remove = (id) => setOrders(orders.filter((o) => o.id !== id));

  if (orders.length === 0) return <GlassCard>Hozircha buyurtmalar yo'q.</GlassCard>;

  return (
    <>
      {orders.map((o) => (
        <GlassCard key={o.id}>
          <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
            <div>
              <div style={{ fontWeight: 800 }}>{o.customerName} · {o.phone}</div>
              <div style={{ fontSize: 12, color: "var(--dim)", display: "flex", alignItems: "center", gap: 4 }}><MapPin size={12} /> {o.address}</div>
            </div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              <Pill tone={o.paymentStatus === "qarz" ? "bad" : "good"}>{o.paymentMethod} · {o.paymentStatus}</Pill>
              <Pill tone="accent">{o.status}</Pill>
            </div>
          </div>
          <div style={{ marginTop: 10, fontSize: 13 }}>
            {o.items.map((it, i) => <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "3px 0" }}>
              <span>{flavorFor(it.name).emoji} {it.name} x{it.qty}</span><span style={{ fontWeight: 700 }}>{fmt(it.price * it.qty)}</span>
            </div>)}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 10 }}>
            <Select value={o.shopId || ""} onChange={(e) => setField(o.id, "shopId", e.target.value || null)}>
              <option value="">Do'kon: belgilanmagan</option>
              {shops.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </Select>
            <Select value={o.employeeId || ""} onChange={(e) => assignEmployee(o, e.target.value || null)}>
              <option value="">Ishchi: belgilanmagan</option>
              {employees.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
            </Select>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 12, flexWrap: "wrap", gap: 8 }}>
            <span style={{ fontWeight: 800 }}>{fmt(o.total)}</span>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              <GhostBtn onClick={() => printReceipt(o, info)}><Printer size={12} /> Chek</GhostBtn>
              {o.paymentStatus === "qarz" && <GhostBtn onClick={() => setField(o.id, "paymentStatus", "to'langan")}>Qarzni yopish</GhostBtn>}
              <GhostBtn onClick={() => copyOrder(o, shops, employees)}><Copy size={12} /> Nusxa</GhostBtn>
              <GhostBtn danger onClick={() => remove(o.id)}><Trash2 size={12} /></GhostBtn>
            </div>
          </div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 8 }}>
            {STATUSES.map((s) => <GhostBtn key={s} primary={o.status === s} onClick={() => setStatus(o, s)}>{s}</GhostBtn>)}
          </div>
        </GlassCard>
      ))}
    </>
  );
}

function EmployeesTab({ employees, setEmployees, shops, vehicles, orders }) {
  const [form, setForm] = useState(null);
  const startNew = () => setForm({ id: null, name: "", phone: "", username: "", password: "", shopId: "", vehicleId: "", debt: 0 });
  const save = () => {
    if (!form.name.trim() || !form.username.trim() || !form.password.trim()) return;
    if (form.id) setEmployees(employees.map((e) => (e.id === form.id ? { ...form, debt: Number(form.debt) || 0 } : e)));
    else setEmployees([...employees, { ...form, id: uid(), debt: Number(form.debt) || 0 }]);
    setForm(null);
  };
  const remove = (id) => setEmployees(employees.filter((e) => e.id !== id));

  return (
    <>
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 10 }}>
        <GhostBtn primary onClick={startNew}><Plus size={13} /> Ishchi qo'shish</GhostBtn>
      </div>
      {form && (
        <GlassCard>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 8 }}>
            <Field placeholder="Ismi" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <Field placeholder="Telefon" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            <Field placeholder="Login" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} />
            <Field placeholder="Parol" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
            <Select value={form.shopId} onChange={(e) => setForm({ ...form, shopId: e.target.value })}>
              <option value="">Do'kon tanlang</option>
              {shops.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </Select>
            <Select value={form.vehicleId} onChange={(e) => setForm({ ...form, vehicleId: e.target.value })}>
              <option value="">Avtomobil tanlang</option>
              {vehicles.map((v) => <option key={v.id} value={v.id}>{v.model} ({v.plate})</option>)}
            </Select>
            <Field placeholder="Qarzi (so'm)" type="number" value={form.debt} onChange={(e) => setForm({ ...form, debt: e.target.value })} />
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <GhostBtn primary onClick={save}><Save size={12} /> Saqlash</GhostBtn>
            <GhostBtn onClick={() => setForm(null)}>Bekor qilish</GhostBtn>
          </div>
        </GlassCard>
      )}
      {employees.map((e) => {
        const empOrders = orders.filter((o) => o.employeeId === e.id);
        const delivered = empOrders.filter((o) => o.status === "yakunlandi");
        const deliveredQty = delivered.reduce((s, o) => s + o.items.reduce((x, it) => x + it.qty, 0), 0);
        const shopName = shops.find((s) => s.id === e.shopId)?.name || "—";
        const vehicle = vehicles.find((v) => v.id === e.vehicleId);
        return (
          <GlassCard key={e.id}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <div style={{ fontWeight: 700 }}>{e.name}</div>
                <div style={{ fontSize: 12, color: "var(--dim)" }}>{e.phone} · login: {e.username}</div>
                <div style={{ fontSize: 12, color: "var(--dim)", marginTop: 4 }}>Do'kon: {shopName} · Avtomobil: {vehicle ? `${vehicle.model} (${vehicle.plate})` : "—"}</div>
                <div style={{ display: "flex", gap: 6, marginTop: 8, flexWrap: "wrap" }}>
                  <Pill tone="accent">{delivered.length} ta yetkazilgan</Pill>
                  <Pill>{deliveredQty} dona mahsulot</Pill>
                  <Pill tone={e.debt > 0 ? "bad" : "good"}>Qarzi: {fmt(e.debt || 0)}</Pill>
                </div>
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                <GhostBtn onClick={() => setForm(e)}><Edit2 size={12} /></GhostBtn>
                <GhostBtn danger onClick={() => remove(e.id)}><Trash2 size={12} /></GhostBtn>
              </div>
            </div>
          </GlassCard>
        );
      })}
      {employees.length === 0 && <GlassCard>Ishchilar qo'shilmagan.</GlassCard>}
    </>
  );
}

function VehiclesTab({ vehicles, setVehicles, employees }) {
  const [form, setForm] = useState(null);
  const [loadForm, setLoadForm] = useState(null);
  const startNew = () => setForm({ id: null, model: "", plate: "", status: "faol", stock: 0, loadHistory: [] });
  const save = () => {
    if (!form.model.trim()) return;
    if (form.id) setVehicles(vehicles.map((v) => (v.id === form.id ? form : v)));
    else setVehicles([...vehicles, { ...form, id: uid(), stock: 0, loadHistory: [] }]);
    setForm(null);
  };
  const remove = (id) => setVehicles(vehicles.filter((v) => v.id !== id));

  const addLoad = () => {
    const amount = Number(loadForm.amount);
    if (!amount) return;
    setVehicles(vehicles.map((v) => v.id === loadForm.vehicleId
      ? { ...v, stock: (v.stock || 0) + amount, loadHistory: [{ date: todayStr(), amount }, ...(v.loadHistory || [])].slice(0, 10) }
      : v));
    setLoadForm(null);
  };

  return (
    <>
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 10 }}>
        <GhostBtn primary onClick={startNew}><Plus size={13} /> Avtomobil qo'shish</GhostBtn>
      </div>
      {form && (
        <GlassCard>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 8 }}>
            <Field placeholder="Modeli" value={form.model} onChange={(e) => setForm({ ...form, model: e.target.value })} />
            <Field placeholder="Davlat raqami" value={form.plate} onChange={(e) => setForm({ ...form, plate: e.target.value })} />
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <GhostBtn primary onClick={save}><Save size={12} /> Saqlash</GhostBtn>
            <GhostBtn onClick={() => setForm(null)}>Bekor qilish</GhostBtn>
          </div>
        </GlassCard>
      )}
      {vehicles.map((v) => {
        const emp = employees.find((e) => e.vehicleId === v.id);
        return (
          <GlassCard key={v.id}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <div style={{ fontWeight: 700 }}>{v.model} <span style={{ fontWeight: 400, color: "var(--dim)", fontSize: 12 }}>{v.plate}</span></div>
                <div style={{ fontSize: 12, color: "var(--dim)" }}>Ishchi: {emp?.name || "biriktirilmagan"}</div>
                <div style={{ marginTop: 8 }}><Pill tone={v.stock > 0 ? "good" : "warn"}>Qoldiq: {v.stock || 0} dona/kg</Pill></div>
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                <GhostBtn onClick={() => setForm(v)}><Edit2 size={12} /></GhostBtn>
                <GhostBtn danger onClick={() => remove(v.id)}><Trash2 size={12} /></GhostBtn>
              </div>
            </div>
            {loadForm?.vehicleId === v.id ? (
              <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                <Field placeholder="Miqdor (kg/dona)" type="number" value={loadForm.amount} onChange={(e) => setLoadForm({ ...loadForm, amount: e.target.value })} />
                <GhostBtn primary onClick={addLoad}>Qo'shish</GhostBtn>
                <GhostBtn onClick={() => setLoadForm(null)}>X</GhostBtn>
              </div>
            ) : (
              <GhostBtn style={{ marginTop: 10 }} onClick={() => setLoadForm({ vehicleId: v.id, amount: "" })}><Plus size={12} /> Bugungi yuklama qo'shish</GhostBtn>
            )}
            {v.loadHistory?.length > 0 && (
              <div style={{ fontSize: 11, color: "var(--dim)", marginTop: 8 }}>
                So'nggi yuklamalar: {v.loadHistory.slice(0, 3).map((h) => `${h.date}: +${h.amount}`).join(" · ")}
              </div>
            )}
          </GlassCard>
        );
      })}
      {vehicles.length === 0 && <GlassCard>Avtomobillar qo'shilmagan.</GlassCard>}
    </>
  );
}

function ShopsTab({ shops, setShops }) {
  const [form, setForm] = useState(null);
  const startNew = () => setForm({ id: null, name: "", address: "" });
  const save = () => {
    if (!form.name.trim()) return;
    if (form.id) setShops(shops.map((s) => (s.id === form.id ? form : s)));
    else setShops([...shops, { ...form, id: uid() }]);
    setForm(null);
  };
  const remove = (id) => setShops(shops.filter((s) => s.id !== id));
  return (
    <>
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 10 }}>
        <GhostBtn primary onClick={startNew}><Plus size={13} /> Do'kon qo'shish</GhostBtn>
      </div>
      {form && (
        <GlassCard>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 8 }}>
            <Field placeholder="Nomi" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <Field placeholder="Manzili" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <GhostBtn primary onClick={save}><Save size={12} /> Saqlash</GhostBtn>
            <GhostBtn onClick={() => setForm(null)}>Bekor qilish</GhostBtn>
          </div>
        </GlassCard>
      )}
      {shops.map((s) => (
        <GlassCard key={s.id}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div><div style={{ fontWeight: 700 }}>{s.name}</div><div style={{ fontSize: 12, color: "var(--dim)" }}>{s.address}</div></div>
            <div style={{ display: "flex", gap: 6 }}>
              <GhostBtn onClick={() => setForm(s)}><Edit2 size={12} /></GhostBtn>
              <GhostBtn danger onClick={() => remove(s.id)}><Trash2 size={12} /></GhostBtn>
            </div>
          </div>
        </GlassCard>
      ))}
      {shops.length === 0 && <GlassCard>Do'konlar qo'shilmagan.</GlassCard>}
    </>
  );
}

const MAX_IMAGES = 15;
function ProductsTab({ products, setProducts, categories }) {
  const [form, setForm] = useState(null);
  const fileRef = useRef(null);
  const startNew = () => setForm({ id: null, name: "", categoryId: categories[0]?.id || "", price: "", desc: "", popular: false, images: [] });
  const startEdit = (p) => setForm({ ...p, price: String(p.price), images: getProductImages(p) });
  const save = () => {
    if (!form.name.trim() || !form.price) return;
    const clean = { ...form, price: Number(form.price), images: form.images || [], image: "" };
    if (form.id) setProducts(products.map((p) => (p.id === form.id ? clean : p)));
    else setProducts([...products, { ...clean, id: uid() }]);
    setForm(null);
  };
  const remove = (id) => setProducts(products.filter((p) => p.id !== id));

  const onFiles = (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    const room = MAX_IMAGES - (form.images?.length || 0);
    if (room <= 0) { alert(`Maksimum ${MAX_IMAGES} ta rasm`); return; }
    const slice = files.slice(0, room);
    Promise.all(slice.map((file) => new Promise((res) => {
      if (file.size > 2 * 1024 * 1024) { res(null); return; }
      const r = new FileReader();
      r.onload = () => res(r.result);
      r.onerror = () => res(null);
      r.readAsDataURL(file);
    }))).then((results) => {
      const ok = results.filter(Boolean);
      setForm((f) => ({ ...f, images: [...(f.images || []), ...ok] }));
      if (results.some((r) => !r)) alert("Ba'zi rasmlar 2MB dan katta bo'lgani uchun tashlab yuborildi");
    });
    e.target.value = "";
  };
  const removeImg = (i) => setForm((f) => ({ ...f, images: f.images.filter((_, idx) => idx !== i) }));
  const moveImg = (i, dir) => setForm((f) => {
    const arr = [...f.images]; const j = i + dir;
    if (j < 0 || j >= arr.length) return f;
    [arr[i], arr[j]] = [arr[j], arr[i]];
    return { ...f, images: arr };
  });

  return (
    <>
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 10 }}>
        <GhostBtn primary onClick={startNew}><Plus size={13} /> Mahsulot qo'shish</GhostBtn>
      </div>
      {form && (
        <GlassCard>
          <div style={{ marginBottom: 10 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
              <div style={{ fontWeight: 700, fontSize: 13 }}>Rasmlar ({form.images?.length || 0}/{MAX_IMAGES})</div>
              <div>
                <input ref={fileRef} type="file" accept="image/*" multiple onChange={onFiles} style={{ display: "none" }} />
                <GhostBtn onClick={() => fileRef.current?.click()} primary><ImageIcon size={12} /> Rasm(lar) yuklash</GhostBtn>
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(90px,1fr))", gap: 8 }}>
              {(form.images || []).map((src, i) => (
                <div key={i} style={{ position: "relative", height: 90, borderRadius: 10, overflow: "hidden", border: "1px solid var(--border)" }}>
                  <img src={src} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  {i === 0 && <span style={{ position: "absolute", top: 4, left: 4, background: "var(--accent)", color: "#fff", fontSize: 9, fontWeight: 700, borderRadius: 4, padding: "2px 5px" }}>ASOSIY</span>}
                  <button onClick={() => removeImg(i)} style={{ position: "absolute", top: 4, right: 4, background: "rgba(0,0,0,0.7)", border: "none", color: "#fff", borderRadius: 6, width: 20, height: 20, display: "flex", alignItems: "center", justifyContent: "center" }}><X size={11} /></button>
                  <div style={{ position: "absolute", bottom: 4, left: 4, right: 4, display: "flex", gap: 3, justifyContent: "space-between" }}>
                    <button onClick={() => moveImg(i, -1)} disabled={i === 0} style={{ flex: 1, background: "rgba(0,0,0,0.6)", border: "none", color: i === 0 ? "#555" : "#fff", borderRadius: 4, fontSize: 10, padding: "2px 0" }}>◀</button>
                    <button onClick={() => moveImg(i, 1)} disabled={i === form.images.length - 1} style={{ flex: 1, background: "rgba(0,0,0,0.6)", border: "none", color: i === form.images.length - 1 ? "#555" : "#fff", borderRadius: 4, fontSize: 10, padding: "2px 0" }}>▶</button>
                  </div>
                </div>
              ))}
              {(!form.images || form.images.length === 0) && (
                <div style={{ height: 90, borderRadius: 10, border: "1px dashed var(--border)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--dim)" }}><ImageIcon size={24} /></div>
              )}
            </div>
            <div style={{ fontSize: 11, color: "var(--dim)", marginTop: 6 }}>10-15 tagacha rasm yuklash mumkin. Har biri max 2MB. Birinchi rasm asosiy hisoblanadi.</div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 8 }}>
            <Field placeholder="Nomi" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <Select value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })}>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </Select>
            <Field placeholder="Narxi" type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
            <Field placeholder="Tavsif" value={form.desc} onChange={(e) => setForm({ ...form, desc: e.target.value })} />
          </div>
          <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, marginBottom: 8 }}>
            <input type="checkbox" checked={form.popular} onChange={(e) => setForm({ ...form, popular: e.target.checked })} /> Mashhur mahsulot
          </label>
          <div style={{ display: "flex", gap: 8 }}>
            <GhostBtn primary onClick={save}><Save size={12} /> Saqlash</GhostBtn>
            <GhostBtn onClick={() => setForm(null)}>Bekor qilish</GhostBtn>
          </div>
        </GlassCard>
      )}
      {products.map((p) => (
        <GlassCard key={p.id}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
            <div style={{ display: "flex", gap: 12, alignItems: "center", minWidth: 0 }}>
              <div style={{ width: 48, height: 48, borderRadius: 12, overflow: "hidden", flexShrink: 0 }}>
                <ProductImage product={p} height={48} fontSize={22} />
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontWeight: 700 }}>{p.name} {p.popular && <Star size={11} color="var(--warn)" style={{ display: "inline" }} />}</div>
                <div style={{ fontSize: 12, color: "var(--dim)" }}>{categories.find((c) => c.id === p.categoryId)?.name || "—"} · {fmt(p.price)}</div>
              </div>
            </div>
            <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
              <GhostBtn onClick={() => startEdit(p)}><Edit2 size={12} /></GhostBtn>
              <GhostBtn danger onClick={() => remove(p.id)}><Trash2 size={12} /></GhostBtn>
            </div>
          </div>
        </GlassCard>
      ))}
    </>
  );
}

function CategoriesTab({ categories, setCategories }) {
  const [name, setName] = useState("");
  const add = () => { if (!name.trim()) return; setCategories([...categories, { id: uid(), name }]); setName(""); };
  const remove = (id) => setCategories(categories.filter((c) => c.id !== id));
  return (
    <>
      <GlassCard>
        <div style={{ display: "flex", gap: 8 }}>
          <Field placeholder="Yangi kategoriya" value={name} onChange={(e) => setName(e.target.value)} />
          <GhostBtn primary onClick={add}><Plus size={13} /></GhostBtn>
        </div>
      </GlassCard>
      {categories.map((c) => (
        <GlassCard key={c.id}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontWeight: 700 }}>{c.name}</span>
            <GhostBtn danger onClick={() => remove(c.id)}><Trash2 size={12} /></GhostBtn>
          </div>
        </GlassCard>
      ))}
    </>
  );
}

function DebtorsTab({ orders, setOrders, debtPayments, setDebtPayments }) {
  const groups = useMemo(() => {
    const map = {};
    orders.filter((o) => o.paymentMethod === "qarz").forEach((o) => {
      const key = o.phone;
      if (!map[key]) map[key] = { phone: o.phone, name: o.customerName, unpaid: 0, orderIds: [] };
      if (o.paymentStatus === "qarz") { map[key].unpaid += o.total; map[key].orderIds.push(o.id); }
    });
    return Object.values(map).filter((g) => g.unpaid > 0);
  }, [orders]);

  const closeDebt = (g) => {
    setOrders(orders.map((o) => (g.orderIds.includes(o.id) ? { ...o, paymentStatus: "to'langan" } : o)));
    setDebtPayments([{ phone: g.phone, name: g.name, amount: g.unpaid, date: new Date().toLocaleString("uz-UZ") }, ...debtPayments]);
  };

  return (
    <>
      {groups.length === 0 && <GlassCard>Qarzdorlar yo'q.</GlassCard>}
      {groups.map((g) => (
        <GlassCard key={g.phone}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontWeight: 700 }}>{g.name}</div>
              <div style={{ fontSize: 12, color: "var(--dim)" }}>{g.phone}</div>
            </div>
            <Pill tone="bad">{fmt(g.unpaid)}</Pill>
          </div>
          <GhostBtn style={{ marginTop: 10 }} primary onClick={() => closeDebt(g)}>Qarzni yopish</GhostBtn>
        </GlassCard>
      ))}
      {debtPayments.length > 0 && (
        <GlassCard>
          <div style={{ fontWeight: 800, marginBottom: 8 }}>To'lov tarixi</div>
          {debtPayments.slice(0, 15).map((p, i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: 12, padding: "5px 0", borderBottom: "1px solid var(--border)", color: "var(--dim)" }}>
              <span>{p.name} · {p.date}</span><span style={{ color: "var(--good)", fontWeight: 700 }}>{fmt(p.amount)}</span>
            </div>
          ))}
        </GlassCard>
      )}
    </>
  );
}

function ReportTab({ orders }) {
  const totalRevenue = orders.reduce((s, o) => s + (o.paymentStatus === "to'langan" ? o.total : 0), 0);
  const totalDebt = orders.filter((o) => o.paymentStatus === "qarz").reduce((s, o) => s + o.total, 0);
  const today = todayStr();
  const todayOrders = orders.filter((o) => new Date(o.createdAt).toDateString() === today);
  const todayRevenue = todayOrders.reduce((s, o) => s + (o.paymentStatus === "to'langan" ? o.total : 0), 0);
  const byMethod = { naqd: 0, karta: 0, qarz: 0 };
  todayOrders.forEach((o) => { byMethod[o.paymentMethod] = (byMethod[o.paymentMethod] || 0) + o.total; });
  const soldByProduct = {};
  orders.forEach((o) => o.items.forEach((it) => { soldByProduct[it.name] = (soldByProduct[it.name] || 0) + it.qty; }));
  const top = Object.entries(soldByProduct).sort((a, b) => b[1] - a[1]).slice(0, 5);

  return (
    <>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(140px,1fr))", gap: 10, marginBottom: 12 }}>
        <StatBox label="Jami tushum" value={fmt(totalRevenue)} icon={<TrendingUp size={16} />} />
        <StatBox label="Jami qarz" value={fmt(totalDebt)} icon={<Wallet size={16} />} tone="bad" />
        <StatBox label="Bugungi buyurtmalar" value={todayOrders.length} icon={<Clock size={16} />} />
        <StatBox label="Bugungi tushum" value={fmt(todayRevenue)} icon={<TrendingUp size={16} />} tone="good" />
      </div>
      <GlassCard>
        <div style={{ fontWeight: 800, marginBottom: 8 }}>Bugun to'lov usullari bo'yicha</div>
        {Object.entries(byMethod).map(([k, v]) => (
          <div key={k} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, padding: "5px 0", borderBottom: "1px solid var(--border)" }}>
            <span style={{ textTransform: "capitalize" }}>{k}</span><span style={{ fontWeight: 700 }}>{fmt(v)}</span>
          </div>
        ))}
      </GlassCard>
      <GlassCard>
        <div style={{ fontWeight: 800, marginBottom: 8 }}>Eng ko'p sotilgan</div>
        {top.map(([name, qty]) => (
          <div key={name} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, padding: "5px 0", borderBottom: "1px solid var(--border)" }}>
            <span>{flavorFor(name).emoji} {name}</span><span style={{ fontWeight: 700 }}>{qty} dona</span>
          </div>
        ))}
      </GlassCard>
    </>
  );
}
function StatBox({ label, value, icon, tone }) {
  const color = tone === "bad" ? "var(--bad)" : tone === "good" ? "var(--good)" : "var(--accent)";
  return (
    <div className="glass" style={{ borderRadius: 16, padding: 14 }}>
      <div style={{ color, marginBottom: 6 }}>{icon}</div>
      <div style={{ fontWeight: 800, fontSize: 15 }}>{value}</div>
      <div style={{ fontSize: 11, color: "var(--dim)" }}>{label}</div>
    </div>
  );
}

function SettingsTab({ adminAuth, setAdminAuth, info, setInfo }) {
  const [form, setForm] = useState(adminAuth);
  const [iForm, setIForm] = useState(info);
  const [saved, setSaved] = useState(false);
  const save = () => { setAdminAuth(form); setInfo(iForm); setSaved(true); setTimeout(() => setSaved(false), 2000); };
  return (
    <>
      <GlassCard>
        <div style={{ fontWeight: 800, marginBottom: 10 }}>Do'kon ma'lumotlari (chekda ko'rinadi)</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10, maxWidth: 420 }}>
          <Field placeholder="Do'kon nomi" value={iForm.name} onChange={(e) => setIForm({ ...iForm, name: e.target.value })} />
          <Field placeholder="Slogan" value={iForm.tagline} onChange={(e) => setIForm({ ...iForm, tagline: e.target.value })} />
          <Field placeholder="Manzil" value={iForm.address || ""} onChange={(e) => setIForm({ ...iForm, address: e.target.value })} />
          <Field placeholder="Telefon" value={iForm.phone || ""} onChange={(e) => setIForm({ ...iForm, phone: e.target.value })} />
        </div>
      </GlassCard>
      <GlassCard>
        <div style={{ fontWeight: 800, marginBottom: 10 }}>Admin login/parol</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10, maxWidth: 320 }}>
          <Field placeholder="Login" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} />
          <Field placeholder="Parol" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
        </div>
      </GlassCard>
      <GhostBtn primary onClick={save}><Save size={12} /> Barchasini saqlash</GhostBtn>
      {saved && <span style={{ color: "var(--good)", fontSize: 12, marginLeft: 10 }}>Saqlandi!</span>}
    </>
  );
}

/* ---------------- EMPLOYEE VIEW ---------------- */
function EmployeeView({ employee, shops, vehicles, setVehicles, orders, setOrders, onLogout, info }) {
  const shop = shops.find((s) => s.id === employee.shopId);
  const vehicle = vehicles.find((v) => v.id === employee.vehicleId);
  const myOrders = orders.filter((o) => o.employeeId === employee.id);
  const today = todayStr();
  const todayDelivered = myOrders.filter((o) => o.status === "yakunlandi" && new Date(o.createdAt).toDateString() === today);

  const setStatus = (o, status) => {
    let next = { ...o, status };
    if (status === "yakunlandi" && !o.stockDeducted && o.vehicleId) {
      const totalQty = o.items.reduce((s, it) => s + it.qty, 0);
      setVehicles(vehicles.map((v) => (v.id === o.vehicleId ? { ...v, stock: Math.max(0, (v.stock || 0) - totalQty) } : v)));
      next.stockDeducted = true;
    }
    setOrders(orders.map((x) => (x.id === o.id ? next : x)));
  };
  const markPaid = (o) => setOrders(orders.map((x) => (x.id === o.id ? { ...x, paymentStatus: "to'langan" } : x)));

  const STATUSES = ["tayyorlanmoqda", "yetkazilmoqda", "yakunlandi"];

  return (
    <div style={{ maxWidth: 480, margin: "0 auto", padding: 16 }}>
      <TopBar title={`Salom, ${employee.name}`} onLogout={onLogout} />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>
        <StatBox label="Do'kon" value={shop?.name || "—"} icon={<Store size={16} />} />
        <StatBox label="Avtomobil qoldig'i" value={vehicle ? `${vehicle.stock || 0}` : "—"} icon={<Truck size={16} />} />
        <StatBox label="Bugun yetkazilgan" value={todayDelivered.length} icon={<Check size={16} />} tone="good" />
        <StatBox label="Mening qarzim" value={fmt(employee.debt || 0)} icon={<Wallet size={16} />} tone={employee.debt > 0 ? "bad" : "good"} />
      </div>
      <div style={{ fontWeight: 800, marginBottom: 8 }}>Menga biriktirilgan buyurtmalar</div>
      {myOrders.length === 0 && <GlassCard>Hozircha buyurtma biriktirilmagan.</GlassCard>}
      {myOrders.map((o) => (
        <GlassCard key={o.id}>
          <div style={{ fontWeight: 700 }}>{o.customerName} · {o.phone}</div>
          <div style={{ fontSize: 12, color: "var(--dim)", marginBottom: 8 }}><MapPin size={12} style={{ display: "inline" }} /> {o.address}</div>
          {o.items.map((it, i) => <div key={i} style={{ fontSize: 12, display: "flex", justifyContent: "space-between" }}>
            <span>{flavorFor(it.name).emoji} {it.name} x{it.qty}</span><span>{fmt(it.price * it.qty)}</span>
          </div>)}
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 10 }}>
            <Pill tone={o.paymentStatus === "qarz" ? "bad" : "good"}>{o.paymentMethod} · {o.paymentStatus}</Pill>
            <GhostBtn onClick={() => printReceipt(o, info)}><Printer size={12} /> Chek</GhostBtn>
            {o.paymentStatus === "qarz" && <GhostBtn onClick={() => markPaid(o)}>To'landi</GhostBtn>}
          </div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 8 }}>
            {STATUSES.map((s) => <GhostBtn key={s} primary={o.status === s} onClick={() => setStatus(o, s)}>{s}</GhostBtn>)}
          </div>
        </GlassCard>
      ))}
    </div>
  );
}
