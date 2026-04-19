import { useState, useEffect } from "react";
import Saisie from "./components/Saisie";
import Journal from "./components/Journal";
import Facture from "./components/Facture";
import Config from "./components/Config";
import Toast from "./components/Toast";

const DAYS_KEY    = "agriprestas_days";
const CFG_KEY     = "agriprestas_cfg";
const ARCHIVE_KEY = "agriprestas_archive";
const CLIENTS_KEY = "agriprestas_clients";

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
  const [archive, setArchive] = useState(() => loadLS(ARCHIVE_KEY, []));
  const [clients, setClients] = useState(() => loadLS(CLIENTS_KEY, []));
  const [cfg, setCfg] = useState(() => {
    const c = loadLS(CFG_KEY, defaultCfg);
    if (!c.mois) c.mois = getDefaultMois();
    if (!c.fnum) c.fnum = `${new Date().getFullYear()}-001`;
    if (!c.tvap) c.tvap = "21";
    if (!c.pause) c.pause = "30";
    return c;
  });
  const [toast, setToast] = useState("");
  const [editDay, setEditDay] = useState(null);
  const [copyDay, setCopyDay] = useState(null);

  useEffect(() => { saveLS(DAYS_KEY, days); }, [days]);
  useEffect(() => { saveLS(CFG_KEY, cfg); }, [cfg]);
  useEffect(() => { saveLS(ARCHIVE_KEY, archive); }, [archive]);
  useEffect(() => { saveLS(CLIENTS_KEY, clients); }, [clients]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 2800);
    return () => clearTimeout(t);
  }, [toast]);

  function showToast(msg) { setToast(msg); }

  function addDay(jour) {
    const newDays = [...days, jour].sort((a,b) => a.date.localeCompare(b.date));
    setDays(newDays);
    showToast("✅ Journée ajoutée !");
  }

  function updateDay(jour) {
    const newDays = days.map(d => d.id === jour.id ? jour : d)
                        .sort((a,b) => a.date.localeCompare(b.date));
    setDays(newDays);
  }

  function deleteDay(id) {
    setDays(days.filter(d => d.id !== id));
    showToast("🗑️ Journée supprimée");
  }

  function clearDays() {
    setDays([]);
    showToast("🗑️ Journal effacé");
  }

  // Archiver le mois en cours
  function archiverMois() {
    if (!days.length) { showToast("⚠️ Aucune journée à archiver"); return; }
    const mois = cfg.mois || getDefaultMois();
    const label = moisLabel(mois);
    // Cherche si ce mois est déjà archivé
    const existing = archive.findIndex(a => a.mois === mois);
    let newArchive;
    if (existing >= 0) {
      newArchive = archive.map((a,i) => i === existing ? { ...a, days: [...days] } : a);
    } else {
      newArchive = [...archive, { mois, label, days: [...days], archivedAt: new Date().toISOString() }];
    }
    setArchive(newArchive);
    setDays([]);
    // Incrémenter le numéro de facture
    const parts = (cfg.fnum || "2025-001").split("-");
    const newNum = parts.length === 2
      ? `${parts[0]}-${String(parseInt(parts[1])+1).padStart(3,"0")}`
      : cfg.fnum;
    // Passer au mois suivant
    const [y, m] = mois.split("-").map(Number);
    const next = m === 12
      ? `${y+1}-01`
      : `${y}-${String(m+1).padStart(2,"0")}`;
    setCfg(c => ({ ...c, mois: next, fnum: newNum }));
    showToast(`✅ ${label} archivé !`);
  }

  // Modifier une journée
  function handleEdit(jour) {
    setEditDay(jour);
    setCopyDay(null);
    setTab("saisie");
  }

  // Copier une journée (formulaire pré-rempli mais nouvel ID)
  function handleCopy(jour) {
    setCopyDay(jour);
    setEditDay(null);
    setTab("saisie");
    showToast("📋 Journée copiée — modifiez et validez !");
  }

  // Ajouter / modifier un client
  function saveClient(client) {
    if (client.id) {
      setClients(clients.map(c => c.id === client.id ? client : c));
    } else {
      setClients([...clients, { ...client, id: Date.now() }]);
    }
  }

  function deleteClient(id) {
    setClients(clients.filter(c => c.id !== id));
  }

  const tabs = [
    { id: "saisie",    label: "📝 Saisie" },
    { id: "journal",   label: "📋 Journal" },
    { id: "facture",   label: "🧾 Facture" },
    { id: "historique",label: "🗂️ Historique" },
    { id: "config",    label: "⚙️ Config" },
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

      {tab === "saisie" && (
        <Saisie
          cfg={cfg}
          clients={clients}
          onAdd={addDay}
          onUpdate={updateDay}
          editDay={editDay}
          copyDay={copyDay}
          clearEdit={() => { setEditDay(null); setCopyDay(null); }}
          showToast={showToast}
        />
      )}
      {tab === "journal" && (
        <Journal
          days={days}
          cfg={cfg}
          clients={clients}
          onDelete={deleteDay}
          onClear={clearDays}
          onFacture={() => setTab("facture")}
          onEdit={handleEdit}
          onCopy={handleCopy}
          onArchiver={archiverMois}
        />
      )}
      {tab === "facture" && (
        <Facture days={days} cfg={cfg} clients={clients} />
      )}
      {tab === "historique" && (
        <Historique archive={archive} cfg={cfg} clients={clients} />
      )}
      {tab === "config" && (
        <Config
          cfg={cfg}
          clients={clients}
          onChange={setCfg}
          onSaveClient={saveClient}
          onDeleteClient={deleteClient}
          showToast={showToast}
        />
      )}

      <Toast message={toast} />
    </div>
  );
}

// ── HISTORIQUE (inline simple) ──
function Historique({ archive, cfg, clients }) {
  const [selected, setSelected] = useState(null);

  if (!archive.length) {
    return (
      <div className="card">
        <div className="card-title">🗂️ Historique des mois archivés</div>
        <div className="empty">Aucun mois archivé pour le moment.<br/>Archivez un mois depuis l'onglet 📋 Journal.</div>
      </div>
    );
  }

  const mois = selected ? archive.find(a => a.mois === selected) : null;

  return (
    <div>
      <div className="card">
        <div className="card-title">🗂️ Historique des mois archivés</div>
        <div className="month-filter">
          {archive.slice().reverse().map(a => (
            <button
              key={a.mois}
              className={`month-btn ${selected === a.mois ? "on" : ""}`}
              onClick={() => setSelected(selected === a.mois ? null : a.mois)}
            >{a.label}</button>
          ))}
        </div>
      </div>

      {mois && (
        <ArchiveMois mois={mois} cfg={cfg} clients={clients} />
      )}
    </div>
  );
}

function ArchiveMois({ mois, cfg, clients }) {
  const { fmMin, fmDate, todayFr, moisLabel } = { fmMin, fmDate, todayFr, moisLabel };
  const days = mois.days;
  const tvr = parseFloat(cfg.tvap) || 21;
  const totalNet  = days.reduce((s,d) => s+d.net,  0);
  const totalHTVA = days.reduce((s,d) => s+d.htva, 0);
  const totalTVA  = totalHTVA * tvr / 100;
  const totalTTC  = totalHTVA + totalTVA;

  function handlePrint() { window.print(); }

  return (
    <div>
      <div className="print-banner no-print">
        <div className="print-banner-title">📄 {mois.label}</div>
        <p className="print-banner-text">
          <strong>PC/Mac</strong> : Ctrl+P &nbsp;|&nbsp; <strong>iPhone</strong> : Partager → Imprimer
        </p>
        <button className="btn print-btn" onClick={handlePrint}>🖨️ Imprimer / PDF</button>
      </div>

      <div className="facture-zone">
        <div className="f-header">
          <div className="f-left">
            <div className="f-name">{cfg.nom || "Votre Nom"}</div>
            <div className="f-tag">🚜 {cfg.metier}</div>
            <div className="f-coords">
              {cfg.adr1 && <span>{cfg.adr1}<br/></span>}
              {cfg.adr2 && <span>{cfg.adr2}<br/></span>}
              {cfg.tel  && <span>📞 {cfg.tel}<br/></span>}
              {cfg.email&& <span>✉️ {cfg.email}</span>}
            </div>
          </div>
          <div className="f-right">
            <div className="f-ref-title">ARCHIVE</div>
            <div className="f-ref-sub">Période : {mois.label}</div>
            {cfg.tva && <div className="f-tva-badge">TVA : {cfg.tva}</div>}
          </div>
        </div>
        <hr className="f-divider"/>

        <table className="f-table">
          <thead>
            <tr>
              <th>Date</th><th>Horaire</th><th>H. nettes</th>
              <th>Client</th><th>Lieu</th><th>Travaux</th><th>HTVA</th>
            </tr>
          </thead>
          <tbody>
            {days.map((d,i) => {
              const client = clients.find(c => c.id === d.clientId);
              return (
                <tr key={d.id} style={{background: i%2===0?"#faf6ef":"#fff"}}>
                  <td>{fmDate(d.date)}</td>
                  <td style={{fontFamily:"monospace"}}>{d.deb}–{d.fin}</td>
                  <td style={{textAlign:"center",fontWeight:"bold"}}>{fmMin(d.net)}</td>
                  <td>{client ? client.nom : "—"}</td>
                  <td>{d.lieu}</td>
                  <td>{d.trav||"—"}</td>
                  <td style={{textAlign:"right",fontWeight:"bold"}}>{d.htva.toFixed(2)} €</td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="f-total-row">
              <td colSpan={2}><strong>TOTAUX</strong></td>
              <td style={{textAlign:"center"}}><strong>{fmMin(totalNet)}</strong></td>
              <td colSpan={3}></td>
              <td style={{textAlign:"right"}}><strong>{totalHTVA.toFixed(2)} €</strong></td>
            </tr>
          </tfoot>
        </table>

        <div className="f-totals-wrap">
          <table className="f-totals">
            <tbody>
              <tr><td>Total HTVA</td><td>{totalHTVA.toFixed(2)} €</td></tr>
              <tr><td>TVA {tvr}%</td><td>{totalTVA.toFixed(2)} €</td></tr>
              <tr className="f-grand"><td><strong>TOTAL TTC</strong></td><td><strong>{totalTTC.toFixed(2)} €</strong></td></tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
