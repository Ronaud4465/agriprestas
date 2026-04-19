import { useState } from "react";

export default function Config({ cfg, clients, onChange, onSaveClient, onDeleteClient, showToast }) {
  const [clientForm, setClientForm] = useState({ nom: "", localite: "", adr1: "", adr2: "", tva: "" });
  const [editClientId, setEditClientId] = useState(null);
  const [showClientForm, setShowClientForm] = useState(false);

  const set = (k, v) => onChange(c => ({ ...c, [k]: v }));
  const setC = (k, v) => setClientForm(f => ({ ...f, [k]: v }));

  function handleSaveClient() {
    if (!clientForm.nom.trim()) { showToast("⚠️ Le nom du client est obligatoire"); return; }
    onSaveClient(editClientId ? { ...clientForm, id: editClientId } : clientForm);
    setClientForm({ nom: "", localite: "", adr1: "", adr2: "", tva: "" });
    setEditClientId(null);
    setShowClientForm(false);
    showToast("✅ Client sauvegardé !");
  }

  function handleEditClient(c) {
    setClientForm({ nom: c.nom||"", localite: c.localite||"", adr1: c.adr1||"", adr2: c.adr2||"", tva: c.tva||"" });
    setEditClientId(c.id);
    setShowClientForm(true);
  }

  function handleCancelClient() {
    setClientForm({ nom: "", localite: "", adr1: "", adr2: "", tva: "" });
    setEditClientId(null);
    setShowClientForm(false);
  }

  return (
    <div>
      {/* INFOS PERSO */}
      <div className="card">
        <div className="card-title">👤 Vos informations</div>
        <div className="g2">
          <Field label="Prénom et Nom"><input className="inp" type="text" value={cfg.nom} placeholder="Marie Dupont" onChange={e => set("nom", e.target.value)} /></Field>
          <Field label="Activité"><input className="inp" type="text" value={cfg.metier} onChange={e => set("metier", e.target.value)} /></Field>
          <Field label="Adresse ligne 1"><input className="inp" type="text" value={cfg.adr1} placeholder="12 rue des Champs" onChange={e => set("adr1", e.target.value)} /></Field>
          <Field label="Adresse ligne 2"><input className="inp" type="text" value={cfg.adr2} placeholder="1234 Votrecommune" onChange={e => set("adr2", e.target.value)} /></Field>
          <Field label="Téléphone"><input className="inp" type="tel" value={cfg.tel} placeholder="+32 xxx xx xx xx" onChange={e => set("tel", e.target.value)} /></Field>
          <Field label="Email"><input className="inp" type="email" value={cfg.email} placeholder="marie@exemple.be" onChange={e => set("email", e.target.value)} /></Field>
        </div>
      </div>

      {/* RÉFÉRENCES LÉGALES */}
      <div className="card">
        <div className="card-title">🏛️ Références légales</div>
        <div className="g2">
          <Field label="N° BCE"><input className="inp" type="text" value={cfg.bce} placeholder="BE 0xxx.xxx.xxx" onChange={e => set("bce", e.target.value)} /></Field>
          <Field label="N° TVA"><input className="inp" type="text" value={cfg.tva} placeholder="BE 0xxx.xxx.xxx" onChange={e => set("tva", e.target.value)} /></Field>
          <Field label="IBAN"><input className="inp" type="text" value={cfg.iban} placeholder="BE XX XXXX XXXX XXXX" onChange={e => set("iban", e.target.value)} /></Field>
          <Field label="BIC"><input className="inp" type="text" value={cfg.bic} placeholder="GEBABEBB" onChange={e => set("bic", e.target.value)} /></Field>
        </div>
      </div>

      {/* TARIFS */}
      <div className="card">
        <div className="card-title">💶 Tarification</div>
        <div className="g3">
          <Field label="€ / heure"><input className="inp" type="number" value={cfg.taux} placeholder="35" min="0" step="0.5" onChange={e => set("taux", e.target.value)} /></Field>
          <Field label="Minimum €/jour"><input className="inp" type="number" value={cfg.mini} placeholder="150" min="0" onChange={e => set("mini", e.target.value)} /></Field>
          <Field label="TVA %"><input className="inp" type="number" value={cfg.tvap} min="0" max="30" onChange={e => set("tvap", e.target.value)} /></Field>
        </div>
      </div>

      {/* FACTURATION */}
      <div className="card">
        <div className="card-title">📅 Facturation</div>
        <div className="g2">
          <Field label="Mois concerné"><input className="inp" type="month" value={cfg.mois} onChange={e => set("mois", e.target.value)} /></Field>
          <Field label="N° de facture"><input className="inp" type="text" value={cfg.fnum} placeholder="2025-001" onChange={e => set("fnum", e.target.value)} /></Field>
        </div>
      </div>

      {/* CLIENTS */}
      <div className="card">
        <div className="card-title">👥 Mes clients</div>

        {/* LISTE DES CLIENTS */}
        {clients.length > 0 && (
          <div style={{ marginBottom: "14px" }}>
            {clients.map(c => (
              <div key={c.id} style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "10px 12px", background: "#faf6ef", border: "1px solid #d4c4b0",
                borderRadius: "8px", marginBottom: "6px"
              }}>
                <div>
                  <div style={{ fontWeight: "600", fontSize: "13px", color: "#3d2b1f" }}>{c.nom}</div>
                  <div style={{ fontSize: "11px", color: "#9a8878" }}>
                    {c.localite && <span>{c.localite}</span>}
                    {c.tva && <span> · TVA : {c.tva}</span>}
                  </div>
                </div>
                <div style={{ display: "flex", gap: "6px" }}>
                  <button className="btn-icon edit" onClick={() => handleEditClient(c)}>✏️</button>
                  <button className="btn-icon delete" onClick={() => {
                    if (window.confirm(`Supprimer le client "${c.nom}" ?`)) onDeleteClient(c.id);
                  }}>✕</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* FORMULAIRE AJOUT/MODIF CLIENT */}
        {showClientForm ? (
          <div style={{ background: "#fff3cd", border: "1.5px solid #c8a84b", borderRadius: "10px", padding: "14px", marginBottom: "10px" }}>
            <div style={{ fontWeight: "600", fontSize: "13px", color: "#7a5c3a", marginBottom: "12px" }}>
              {editClientId ? "✏️ Modifier le client" : "➕ Nouveau client"}
            </div>
            <div className="g2">
              <Field label="Nom / Société *"><input className="inp" type="text" value={clientForm.nom} placeholder="Ferme Dupont" onChange={e => setC("nom", e.target.value)} /></Field>
              <Field label="Localité"><input className="inp" type="text" value={clientForm.localite} placeholder="La Chapelle" onChange={e => setC("localite", e.target.value)} /></Field>
              <Field label="Adresse ligne 1"><input className="inp" type="text" value={clientForm.adr1} placeholder="12 rue des Champs" onChange={e => setC("adr1", e.target.value)} /></Field>
              <Field label="Adresse ligne 2"><input className="inp" type="text" value={clientForm.adr2} placeholder="1234 La Chapelle" onChange={e => setC("adr2", e.target.value)} /></Field>
              <Field label="N° TVA client"><input className="inp" type="text" value={clientForm.tva} placeholder="BE 0xxx.xxx.xxx" onChange={e => setC("tva", e.target.value)} /></Field>
            </div>
            <div className="acts" style={{ marginTop: "10px" }}>
              <button className="btn primary" onClick={handleSaveClient}>💾 Sauvegarder</button>
              <button className="btn" onClick={handleCancelClient}>Annuler</button>
            </div>
          </div>
        ) : (
          <button className="btn primary" onClick={() => { setShowClientForm(true); setEditClientId(null); setClientForm({ nom:"", localite:"", adr1:"", adr2:"", tva:"" }); }}>
            ➕ Ajouter un client
          </button>
        )}
      </div>

      <div className="acts">
        <button className="btn primary" onClick={() => showToast("✅ Paramètres sauvegardés !")}>💾 Sauvegarder</button>
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div className="field">
      <label className="lbl">{label}</label>
      {children}
    </div>
  );
}
