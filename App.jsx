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
  return `${n.getFullYear()}-${String(n.getMonth()+1).padStart(2,"00")}`;
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
    setDays([...days, jour].sort((a,b) => a.date.localeCompare(b.date)));
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
      await supabase.from("clients").insert({ id: newId, user_id: userId, nom: client.nom, localite: client.l
