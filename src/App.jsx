import { useState, useEffect } from "react";
import Saisie from "./components/Saisie";
import Journal from "./components/Journal";
import Facture from "./components/Facture";
import Config from "./components/Config";
import Toast from "./components/Toast";

const DAYS_KEY = "agriprestas_days";
const CFG_KEY  = "agriprestas_cfg";

export const defaultCfg = {
  nom: "", metier: "Conductrice de tracteur indépendante",
  adr1: "", adr2: "", tel: "", email: "",
  bce: "", tva: "", iban: "", bic: "",
  taux: "", mini: "", tvap: "21", pause: "30",
  mois: "", fnum: ""
};

function getDefaultMois() {
  const n = new Date();
  return `${n.getFullYear()}-${String(n.getMonth()+1).padStart(2,"0")}`;
}

export function loadLS(key, def) {
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : def; }
  catch { return def; }
}
export function saveLS(key, val) {
  try { localStorage.setItem(key, JSON.stringify(val)); } catch {}
}

export function toMin(t) { const [h,m] = t.split(":").map(Number); return h*60+m; }
export function fmMin(m) { return `${Math.floor(m/60)}h${String(m%60).padStart(2,"0")}`; }
export function fmDate(d) {
  try { return new Date(d+"T12:00:00").toLocaleDateString("fr-BE",{day:"2-digit",month:"2-digit",year:"numeric"}); }
  catch { return d; }
}
export function moisLabel(mois) {
  if (!mois) return "—";
  const [y,m] = mois.split("-");
  return new Date(y, m-1, 1).toLocaleDateString("fr-BE",{month:"long",year:"numeric"});
}
export function todayStr() { return new Date().toISOString().split("T")[0]; }
export function todayFr() { return new Date().toLocaleDateString("fr-BE",{day:"2-digit",month:"2-digit",year:"numeric"}); }

export default function App() {
  const [tab, setTab] = useState("saisie");
  const [days, setDays] = useState(() => loadLS(DAYS_KEY, []));
  const [cfg, setCfg] = useState(() => {
    const c = loadLS(CFG_KEY, defaultCfg);
    if (!c.mois) c.mois = getDefaultMois();
    if (!c.fnum) c.fnum = `${new Date().getFullYear()}-001`;
    if (!c.tvap) c.tvap = "21";
    if (!c.pause) c.pause = "30";
    return c;
  });
  const [toast, setToast] = useState("");

  useEffect(() => { saveLS(DAYS_KEY, days); }, [days]);
  useEffect(() => { saveLS(CFG_KEY, cfg); }, [cfg]);

  function showToast(msg) {
    setToast(msg);
    setTimeout(() => setToast(""), 2800);
  }

  function addDay(jour) {
    const newDays = [...days, jour].sort((a,b) => a.date.localeCompare(b.date));
    setDays(newDays);
    showToast("✅ Journée ajoutée !");
  }

  function deleteDay(id) {
    setDays(days.filter(d => d.id !== id));
    showToast("🗑️ Journée supprimée");
  }

  function clearDays() {
    setDays([]);
    showToast("🗑️ Journal effacé");
  }

  const tabs = [
    { id: "saisie",  label: "📝 Saisie" },
    { id: "journal", label: "📋 Journal" },
    { id: "facture", label: "🧾 Facture" },
    { id: "config",  label: "⚙️ Config" },
  ];

  return (
    <div className="app">
      <header className="app-header">
        <div className="app-logo">🚜</div>
        <div>
          <h1 className="app-title">AgriPrestas</h1>
          <p className="app-sub">Suivi des prestations · Conductrice indépendante</p>
        </div>
      </header>

      <nav className="tab-bar">
        {tabs.map(t => (
          <button
            key={t.id}
            className={`tab ${tab === t.id ? "on" : ""}`}
            onClick={() => setTab(t.id)}
          >{t.label}</button>
        ))}
      </nav>

      {tab === "saisie"  && <Saisie  cfg={cfg} onAdd={addDay} showToast={showToast} />}
      {tab === "journal" && <Journal days={days} cfg={cfg} onDelete={deleteDay} onClear={clearDays} onFacture={() => setTab("facture")} />}
      {tab === "facture" && <Facture days={days} cfg={cfg} />}
      {tab === "config"  && <Config  cfg={cfg} onChange={setCfg} showToast={showToast} />}

      <Toast message={toast} />
    </div>
  );
}
