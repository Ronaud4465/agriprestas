import { useState, useEffect } from "react";
import { supabase } from "./supabase";
import Auth from "./Auth";
import Saisie from "./components/Saisie";
import Journal from "./components/Journal";
import Facture from "./components/Facture";
import Config from "./components/Config";
import Toast from "./components/Toast";

export const defaultCfg = {
  nom: "", metier: "Conductrice de tracteur indépendante",
  adr1: "", adr2: "", tel: "", email: "",
  bce: "", tva: "", iban: "", bic: "",
  taux: "", mini: "", tvap: "21",
  mois: "", fnum: "",
  couleurPrimaire: "#2d5a27",
  couleurSecondaire: "#8b6914",
  logo: ""
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
  const [session, setSession] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [tab, setTab] = useState("saisie");
  const [days, setDays] = useState([]);
  const [archive, setArchive] = useState([]);
  const [clients, setClients] = useState([]);
  const [cfg, setCfg] = useState(defaultCfg);
  const [toast, setToast] = useState("");
  const [editDay, setEditDay] = useState(null);
  const [copyDay, setCopyDay] = useState(null);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setAuthLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (!session) {
        setDays([]); setArchive([]); setClients([]); setCfg(defaultCfg);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (session?.user) loadAllData(session.user.id);
  }, [session]);

  useEffect(() => {
    document.documentElement.style.setProperty("--color-primary", cfg.couleurPrimaire || "#2d5a27");
    document.documentElement.style.setProperty("--color-secondary", cfg.couleurSecondaire || "#8b6914");
  }, [cfg.couleurPrimaire, cfg.couleurSecondaire]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 2800);
    return () => clearTimeout(t);
  }, [toast]);

  function showToast(msg) { setToast(msg); }

  async function loadAllData(userId) {
    setSyncing(true);
    try {
      const { data: joursData } = await supabase
        .from("journees").select("*").eq("user_id", userId).order("date");
      if (joursData) {
        setDays(joursData.map(r => ({
          id: r.id, date: r.date, deb: r.deb, fin: r.fin,
          brut: r.brut, net: r.net, lieu: r.lieu, trav: r.trav,
          note: r.note, clientId: r.client_id, taux: r.taux,
          mini: r.mini, pause: r.pause, htva: r.htva
        })));
      }

      const { data: clientsData } = await supabase
        .from("clients").select("*").eq("user_id", userId);
      if (clientsData) {
        setClients(clientsData.map(r => ({
          id: r.id, nom: r.nom, localite: r.localite,
          adr1: r.adr1, adr2: r.adr2, tva: r.tva
        })));
      }

      const { data: cfgData } = await supabase
        .from("configs").select("*").eq("user_id", userId).single();
      if (cfgData?.data) {
        const c = { ...defaultCfg, ...cfgData.data };
        if (!c.mois) c.mois = getDefaultMois();
        if (!c.fnum) c.fnum = `${new Date().getFullYear()}-001`;
        setCfg(c);
      } else {
        setCfg({ ...defaultCfg, mois: getDefaultMois(), fnum: `${new Date().getFullYear()}-001` });
      }

      const { data: archivesData } = await supabase
        .from("archives").select("*").eq("user_id", userId).order("archived_at");
      if (archivesData) {
        setArchive(archivesData.map(r => ({
          mois: r.mois, label: r.label,
          days: r.data?.days || [], archivedAt: r.archived_at
        })));
      }
    } catch (e) {
      showToast("⚠️ Erreur de chargement");
    }
    setSyncing(false);
  }

  async function addDay(jour) {
    const userId = session.user.id;
    const row = {
      id: jour.id, user_id: userId, date: jour.date, deb: jour.deb,
      fin: jour.fin, brut: jour.brut, net: jour.net, lieu: jour.lieu,
      trav: jour.trav, note: jour.note, client_id: jour.clientId,
      taux: jour.taux, mini: jour.mini, pause: jour.pause, htva: jour.htva
    };
    const { error } = await supabase.from("journees").insert(row);
    if (error) { showToast("⚠️ Erreur sauvegarde"); return; }
    const newDays = [...days, jour].sort((a,b) => a.date.localeCompare(b.date));
    setDays(newDays);
    showToast("✅ Journée ajoutée !");
  }

  async function updateDay(jour) {
    const userId = session.user.id;
    const row = {
      date: jour.date, deb: jour.deb, fin: jour.fin, brut: jour.brut,
      net: jour.net, lieu: jour.lieu, trav: jour.trav, note: jour.note,
      client_id: jour.clientId, taux: jour.taux, mini: jour.mini,
      pause: jour.pause, htva: jour.htva
    };
    const { error } = await supabase.from("journees").update(row).eq("id", jour.id).eq("user_id", userId);
    if (error) { showToast("⚠️ Erreur mise à jour"); return; }
    setDays(days.map(d => d.id === jour.id ? jour : d).sort((a,b) => a.date.localeCompare(b.date)));
  }

  async function deleteDay(id) {
    const { error } = await supabase.from("journees").delete().eq("id", id).eq("user_id", session.user.id);
    if (error) { showToast("⚠️ Erreur suppression"); return; }
    setDays(days.filter(d => d.id !== id));
    showToast("🗑️ Journée supprimée");
  }

  async function clearDays() {
    const { error } = await supabase.from("journees").delete().eq("user_id", session.user.id);
    if (error) { showToast("⚠️ Erreur suppression"); return; }
    setDays([]);
    showToast("🗑️ Journal effacé");
  }

  async function saveCfg(newCfg) {
    const userId = session.user.id;
    await supabase.from("configs").upsert({ user_id: userId, data: newCfg, updated_at: new Date().toISOString() });
    setCfg(newCfg);
  }

  async function archiverMois() {
    if (!days.length) { showToast("⚠️ Aucune journée à archiver"); return; }
    const userId = session.user.id;
    const mois = cfg.mois || getDefaultMois();
    const label = moisLabel(mois);

    const { error } = await supabase.from("archives").insert({
      user_id: userId, mois, label,
      data: { days: [...days] },
      archived_at: new Date().toISOString()
    });

    if (error) { showToast("⚠️ Erreur archivage"); return; }

    await supabase.from("journees").delete().eq("user_id", userId);
    setDays([]);

    setArchive([...archive, { mois, label, days: [...days], archivedAt: new Date().toISOString() }]);

    const parts = (cfg.fnum || "2025-001").split("-");
    const newNum = parts.length === 2
      ? `${parts[0]}-${String(parseInt(parts[1])+1).padStart(3,"0")}` : cfg.fnum;
    const [y, m] = mois.split("-").map(Number);
    const next = m === 12 ? `${y+1}-01` : `${y}-${String(m+1).padStart(2,"0")}`;
    await saveCfg({ ...cfg, mois: next, fnum: newNum });
    showToast(`✅ ${label} archivé !`);
  }

  function handleEdit(jour) { setEditDay(jour); setCopyDay(null); setTab("saisie"); }
  function handleCopy(jour) { setCopyDay(jour); setEditDay(null); setTab("saisie"); showToast("📋 Journée copiée — modifiez et validez !"); }

  async function saveClient(client) {
    const userId = session.user.id;
    if (client.id && clients.find(c => c.id === client.id)) {
      await supabase.from("clients").update({
        nom: client.nom, localite: client.localite,
        adr1: client.adr1, adr2: client.adr2, tva: client.tva
      }).eq("id", client.id).eq("user_id", userId);
      setClients(clients.map(c => c.id === client.id ? client : c));
    } else {
      const newId = Date.now();
      await supabase.from("clients").insert({ id: newId, user_id: userId, nom: client.nom, localite: client.localite, adr1: client.adr1, adr2: client.adr2, tva: client.tva });
      setClients([...clients, { ...client, id: newId }]);
    }
  }

  async function deleteClient(id) {
    await supabase.from("clients").delete().eq("id", id).eq("user_id", session.user.id);
    setClients(clients.filter(c => c.id !== id));
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    showToast("👋 Déconnecté");
  }

  const tabs = [
    { id: "saisie",     label: "📝 Saisie" },
    { id: "journal",    label: "📋 Journal" },
    { id: "facture",    label: "🧾 Facture" },
    { id: "historique", label: "🗂️ Historique" },
    { id: "config",     label: "⚙️ Config" },
  ];

  if (authLoading) return (
    <div style={{display:"flex",alignItems:"center",justifyContent:"center",height:"100vh",flexDirection:"column",gap:"12px"}}>
      <div style={{fontSize:"2rem"}}>🌿</div>
      <div style={{color:"#666"}}>Chargement…</div>
    </div>
  );

  if (!session) return <Auth />;

  return (
    <div className="app">
      <header className="app-header">
        <div className="app-logo">
          {cfg.logo
            ? <img src={cfg.logo} alt="logo" style={{width:"100%",height:"100%",objectFit:"contain",borderRadius:"10px"}} />
            : <span>🌿</span>}
        </div>
        <div style={{flex:1}}>
          <h1 className="app-title">FieldLog</h1>
          <p className="app-sub">Suivi des prestations · Indépendant</p>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:"8px"}}>
          {syncing && <span style={{fontSize:"0.75rem",color:"#999"}}>⟳ sync…</span>}
          <button onClick={handleLogout} style={{background:"none",border:"1px solid #ccc",borderRadius:"6px",padding:"4px 10px",cursor:"pointer",fontSize:"0.8rem",color:"#666"}}>
            Déconnexion
          </button>
        </div>
      </header>

      <nav className="tab-bar">
        {tabs.map(t => (
          <button key={t.id} className={`tab ${tab === t.id ? "on" : ""}`} onClick={() => setTab(t.id)}>{t.label}</button>
        ))}
      </nav>

      {tab === "saisie" && (
        <Saisie cfg={cfg} clients={clients} onAdd={addDay} onUpdate={updateDay}
          editDay={editDay} copyDay={copyDay}
          clearEdit={() => { setEditDay(null); setCopyDay(null); }}
          showToast={showToast} />
      )}
      {tab === "journal" && (
        <Journal days={days} cfg={cfg} clients={clients}
          onDelete={deleteDay} onClear={clearDays}
          onFacture={() => setTab("facture")}
          onEdit={handleEdit} onCopy={handleCopy} onArchiver={archiverMois} />
      )}
      {tab === "facture" && <Facture days={days} cfg={cfg} clients={clients} />}
      {tab === "historique" && <Historique archive={archive} cfg={cfg} clients={clients} />}
      {tab === "config" && (
        <Config cfg={cfg} clients={clients} onChange={saveCfg}
          onSaveClient={saveClient} onDeleteClient={deleteClient} showToast={showToast} />
      )}
      <Toast message={toast} />
    </div>
  );
}

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
            <button key={a.mois} className={`month-btn ${selected === a.mois ? "on" : ""}`}
              onClick={() => setSelected(selected === a.mois ? null : a.mois)}>
              {a.label}
            </button>
          ))}
        </div>
      </div>
      {mois && <ArchiveMois mois={mois} cfg={cfg} clients={clients} />}
    </div>
  );
}

function ArchiveMois({ mois, cfg, clients }) {
  const days = mois.days;
  const tvr = parseFloat(cfg.tvap) || 21;
  const totalNet  = days.reduce((s,d) => s+d.net,  0);
  const totalHTVA = days.reduce((s,d) => s+d.htva, 0);
  const totalTVA  = totalHTVA * tvr / 100;
  const totalTTC  = totalHTVA + totalTVA;
  return (
    <div>
      <div className="print-banner no-print">
        <div className="print-banner-title">📄 {mois.label}</div>
        <p className="print-banner-text"><strong>PC/Mac</strong> : Ctrl+P &nbsp;|&nbsp; <strong>iPhone</strong> : Partager → Imprimer</p>
        <button className="btn print-btn" onClick={() => window.print()}>🖨️ Imprimer / PDF</button>
      </div>
      <div className="facture-zone">
        <FactureHeader cfg={cfg} />
        <div className="f-right-block">
          <div className="f-ref-title">ARCHIVE</div>
          <div className="f-ref-sub">Période : {mois.label}</div>
        </div>
        <hr className="f-divider"/>
        <FactureTable days={days} clients={clients} totalNet={totalNet} totalHTVA={totalHTVA} />
        <FactureTotaux totalHTVA={totalHTVA} totalTVA={totalTVA} totalTTC={totalTTC} tvr={tvr} />
        <FactureFooter cfg={cfg} />
      </div>
    </div>
  );
}

export function FactureHeader({ cfg }) {
  return (
    <div className="f-header">
      <div className="f-left">
        {cfg.logo && <img src={cfg.logo} alt="logo" style={{height:"60px",marginBottom:"8px",display:"block"}} />}
        <div className="f-name">{cfg.nom || "Votre Nom"}</div>
        <div className="f-tag">{cfg.metier || "Indépendant"}</div>
        <div className="f-coords">
          {cfg.adr1  && <span>{cfg.adr1}<br/></span>}
          {cfg.adr2  && <span>{cfg.adr2}<br/></span>}
          {cfg.tel   && <span>📞 {cfg.tel}<br/></span>}
          {cfg.email && <span>✉️ {cfg.email}</span>}
        </div>
      </div>
    </div>
  );
}

export function FactureTable({ days, clients, totalNet, totalHTVA }) {
  return (
    <table className="f-table">
      <thead>
        <tr>
          <th>Date</th><th>Horaire</th><th>H. nettes</th>
          <th>Client</th><th>Lieu</th><th>Travaux</th><th>Taux</th><th>HTVA</th>
        </tr>
      </thead>
      <tbody>
        {days.length ? days.map((d,i) => {
          const client = clients.find(c => String(c.id) === String(d.clientId));
          return (
            <tr key={d.id} style={{background: i%2===0?"#f8f6f0":"#fff"}}>
              <td>{fmDate(d.date)}</td>
              <td style={{fontFamily:"monospace"}}>{d.deb}–{d.fin}</td>
              <td style={{textAlign:"center",fontWeight:"bold"}}>{fmMin(d.net)}</td>
              <td>{client ? client.nom : "—"}</td>
              <td>{d.lieu}</td>
              <td>{d.trav||"—"}</td>
              <td style={{textAlign:"right"}}>{d.taux?d.taux+"€/h":"—"}</td>
              <td style={{textAlign:"right",fontWeight:"bold"}}>{d.htva.toFixed(2)} €</td>
            </tr>
          );
        }) : <tr><td colSpan={8} style={{textAlign:"center",color:"#999",padding:"14px"}}>Aucune prestation</td></tr>}
      </tbody>
      <tfoot>
        <tr className="f-total-row">
          <td colSpan={2}><strong>TOTAUX</strong></td>
          <td style={{textAlign:"center"}}><strong>{fmMin(totalNet)}</strong></td>
          <td colSpan={4}></td>
          <td style={{textAlign:"right"}}><strong>{totalHTVA.toFixed(2)} €</strong></td>
        </tr>
      </tfoot>
    </table>
  );
}

export function FactureTotaux({ totalHTVA, totalTVA, totalTTC, tvr }) {
  return (
    <div className="f-totals-wrap">
      <table className="f-totals">
        <tbody>
          <tr><td>Total HTVA</td><td>{totalHTVA.toFixed(2)} €</td></tr>
          <tr><td>TVA {tvr}%</td><td>{totalTVA.toFixed(2)} €</td></tr>
          <tr className="f-grand"><td><strong>TOTAL TTC</strong></td><td><strong>{totalTTC.toFixed(2)} €</strong></td></tr>
        </tbody>
      </table>
    </div>
  );
}

export function FactureFooter({ cfg }) {
  return (
    <div className="f-footer">
      {cfg.nom||"—"} · {cfg.metier||"Indépendant"}
      {cfg.tva ? ` · TVA : ${cfg.tva}` : ""}
      {cfg.bce ? ` · BCE : ${cfg.bce}` : ""}
      {" · "}Généré le {todayFr()}
    </div>
  );
}
