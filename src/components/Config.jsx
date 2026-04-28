import { useState, useRef } from "react";

export default function Config({ cfg, clients, onChange, onSaveClient, onDeleteClient, showToast }) {
  const [clientForm, setClientForm] = useState({ nom: "", localite: "", adr1: "", adr2: "", tva: "" });
  const [editClientId, setEditClientId] = useState(null);
  const [showClientForm, setShowClientForm] = useState(false);
  const logoRef = useRef(null);

  const set = (k, v) => onChange(c => ({ ...c, [k]: v }));
  const setC = (k, v) => setClientForm(f => ({ ...f, [k]: v }));

  function handleLogoUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 500000) { showToast("⚠️ Image trop grande (max 500 Ko)"); return; }
    const reader = new FileReader();
    reader.onload = ev => set("logo", ev.target.result);
    reader.readAsDataURL(file);
  }

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
      {/* PERSONNALISATION */}
      <div className="card">
        <div className="card-title">🎨 Personnalisation</div>

        {/* LOGO */}
        <div style={{ marginBottom: "16px" }}>
          <label className="lbl" style={{ marginBottom: "8px", display: "block" }}>Logo / Photo</label>
          <div style={{ display: "flex", alignItems: "center", gap: "14px", flexWrap: "wrap" }}>
            <div style={{
              width: "80px", height: "80px",
              border: "2px dashed var(--color-primary)",
              borderRadius: "10px",
              display: "flex", alignItems: "center", justifyContent: "center",
              background: "#f8f6f0", overflow: "hidden", cursor: "pointer"
            }} onClick={() => logoRef.current?.click()}>
              {cfg.logo
                ? <img src={cfg.logo} alt="logo" style={{width:"100%",height:"100%",objectFit:"contain"}} />
                : <span style={{fontSize:"28px"}}>🌿</span>}
            </div>
            <div>
              <button className="btn primary small" onClick={() => logoRef.current?.click()}>
                📁 Choisir une image
              </button>
              {cfg.logo && (
                <button className="btn danger small" style={{marginLeft:"8px"}} onClick={() => set("logo", "")}>
                  🗑️ Supprimer
                </button>
              )}
              <p style={{fontSize:"11px",color:"#9a8878",marginTop:"6px"}}>PNG, JPG — max 500 Ko</p>
            </div>
          </div>
          <input ref={logoRef} type="file" accept="image/*" style={{display:"none"}} onChange={handleLogoUpload} />
        </div>

        {/* COULEURS */}
        <div className="g2">
          <div className="field">
            <label className="lbl">Couleur principale</label>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <input type="color" value={cfg.couleurPrimaire || "#2d5a27"}
                onChange={e => set("couleurPrimaire", e.target.value)}
                style={{ width: "50px", height: "40px", border: "1.5px solid var(--border)", borderRadius: "8px", cursor: "pointer", padding: "2px" }} />
              <input className="inp" type="text" value={cfg.couleurPrimaire || "#2d5a27"}
                onChange={e => set("couleurPrimaire", e.target.value)}
                style={{ fontFamily: "monospace", fontSize: "13px" }} />
            </div>
          </div>
          <div className="field">
            <label className="lbl">Couleur secondaire</label>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <input type="color" value={cfg.couleurSecondaire || "#8b6914"}
                onChange={e => set("couleurSecondaire", e.target.value)}
                style={{ width: "50px", height: "40px", border: "1.5px solid var(--border)", borderRadius: "8px", cursor: "pointer", padding: "2px" }} />
              <input className="inp" type="text" value={cfg.couleurSecondaire || "#8b6914"}
                onChange={e => set("couleurSecondaire", e.target.value)}
                style={{ fontFamily: "monospace", fontSize: "13px" }} />
            </div>
          </div>
        </div>

        {/* APERÇU */}
        <div style={{ marginTop: "14px", padding: "12px", background: cfg.couleurPrimaire || "#2d5a27", borderRadius: "10px", display: "flex", gap: "10px", alignItems: "center" }}>
          <div style={{ width: "32px", height: "32px", background: cfg.couleurSecondaire || "#8b6914", borderRadius: "6px" }}></div>
          <span style={{ color: "#fff", fontWeight: "600", fontSize: "13px" }}>Aperçu des couleurs</span>
        </div>
      </div>

      {/* INFOS PERSO */}
      <div className="card">
        <div className="card-title">👤 Vos informations</div>
        <div className="g2">
          <Field label="Prénom et Nom"><input className="inp" type="text" value={cfg.nom||""} placeholder="Marie Dupont" onChange={e => set("nom", e.target.value)} /></Field>
          <Field label="Activité"><input className="inp" type="text" value={cfg.metier||""} onChange={e => set("metier", e.target.value)} /></Field>
          <Field label="Adresse ligne 1"><input className="inp" type="text" value={cfg.adr1||""} placeholder="12 rue des Champs" onChange={e => set("adr1", e.target.value)} /></Field>
          <Field label="Adresse ligne 2"><input className="inp" type="text" value={cfg.adr2||""} placeholder="1234 Votrecommune" onChange={e => set("adr2", e.target.value)} /></Field>
          <Field label="Téléphone"><input className="inp" type="tel" value={cfg.tel||""} placeholder="+32 xxx xx xx xx" onChange={e => set("tel", e.target.value)} /></Field>
          <Field label="Email"><input className="inp" type="email" value={cfg.email||""} placeholder="marie@exemple.be" onChange={e => set("email", e.target.value)} /></Field>
        </div>
      </div>

      {/* RÉFÉRENCES LÉGALES */}
      <div className="card">
        <div className="card-title">🏛️ Références légales</div>
        <div className="g2">
          <Field label="N° BCE"><input className="inp" type="text" value={cfg.bce||""} placeholder="BE 0xxx.xxx.xxx" onChange={e => set("bce", e.target.value)} /></Field>
          <Field label="N° TVA"><input className="inp" type="text" value={cfg.tva||""} placeholder="BE 0xxx.xxx.xxx" onChange={e => set("tva", e.target.value)} /></Field>
          <Field label="IBAN"><input className="inp" type="text" value={cfg.iban||""} placeholder="BE XX XXXX XXXX XXXX" onChange={e => set("iban", e.target.value)} /></Field>
          <Field label="BIC"><input className="inp" type="text" value={cfg.bic||""} placeholder="GEBABEBB" onChange={e => set("bic", e.target.value)} /></Field>
        </div>
      </div>

      {/* TARIFS */}
      <div className="card">
        <div className="card-title">💶 Tarification</div>
        <div className="g3">
          <Field label="€ / heure"><input className="inp" type="number" value={cfg.taux||""} placeholder="35" min="0" step="0.5" onChange={e => set("taux", e.target.value)} /></Field>
          <Field label="Minimum €/jour"><input className="inp" type="number" value={cfg.mini||""} placeholder="150" min="0" onChange={e => set("mini", e.target.value)} /></Field>
          <Field label="TVA %"><input className="inp" type="number" value={cfg.tvap||"21"} min="0" max="30" onChange={e => set("tvap", e.target.value)} /></Field>
        </div>
      </div>

      {/* FACTURATION */}
      <div className="card">
        <div className="card-title">📅 Facturation</div>
        <div className="g2">
          <Field label="Mois concerné"><input className="inp" type="month" value={cfg.mois||""} onChange={e => set("mois", e.target.value)} /></Field>
          <Field label="N° de facture"><input className="inp" type="text" value={cfg.fnum||""} placeholder="2025-001" onChange={e => set("fnum", e.target.value)} /></Field>
        </div>
      </div>

      {/* CLIENTS */}
      <div className="card">
        <div className="card-title">👥 Mes clients</div>
        {clients.length > 0 && (
          <div style={{ marginBottom: "14px" }}>
            {clients.map(c => (
              <div key={c.id} style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "10px 12px", background: "#f8f6f0", border: "1px solid var(--border)",
                borderRadius: "8px", marginBottom: "6px"
              }}>
                <div>
                  <div style={{ fontWeight: "600", fontSize: "13px" }}>{c.nom}</div>
                  <div style={{ fontSize: "11px", color: "#9a8878" }}>
                    {c.localite && <span>{c.localite}</span>}
                    {c.tva && <span> · TVA : {c.tva}</span>}
                  </div>
                </div>
                <div style={{ display: "flex", gap: "6px" }}>
                  <button className="btn-icon edit" onClick={() => handleEditClient(c)}>✏️</button>
                  <button className="btn-icon delete" onClick={() => {
                    if (window.confirm(`Supprimer "${c.nom}" ?`)) onDeleteClient(c.id);
                  }}>✕</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {showClientForm ? (
          <div style={{ background: "#fff8e1", border: "1.5px solid var(--color-secondary)", borderRadius: "10px", padding: "14px", marginBottom: "10px" }}>
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
          <button className="btn primary" onClick={() => {
            setShowClientForm(true);
            setEditClientId(null);
            setClientForm({ nom:"", localite:"", adr1:"", adr2:"", tva:"" });
          }}>➕ Ajouter un client</button>
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
