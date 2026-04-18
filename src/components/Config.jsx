export default function Config({ cfg, onChange, showToast }) {
  const set = (k, v) => onChange(c => ({ ...c, [k]: v }));

  return (
    <div>
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

      <div className="card">
        <div className="card-title">🏛️ Références légales</div>
        <div className="g2">
          <Field label="N° BCE / Entreprise"><input className="inp" type="text" value={cfg.bce} placeholder="BE 0xxx.xxx.xxx" onChange={e => set("bce", e.target.value)} /></Field>
          <Field label="N° TVA"><input className="inp" type="text" value={cfg.tva} placeholder="BE 0xxx.xxx.xxx" onChange={e => set("tva", e.target.value)} /></Field>
          <Field label="IBAN"><input className="inp" type="text" value={cfg.iban} placeholder="BE XX XXXX XXXX XXXX" onChange={e => set("iban", e.target.value)} /></Field>
          <Field label="BIC"><input className="inp" type="text" value={cfg.bic} placeholder="GEBABEBB" onChange={e => set("bic", e.target.value)} /></Field>
        </div>
      </div>

      <div className="card">
        <div className="card-title">💶 Tarification</div>
        <div className="g3">
          <Field label="€ / heure"><input className="inp" type="number" value={cfg.taux} placeholder="35" min="0" step="0.5" onChange={e => set("taux", e.target.value)} /></Field>
          <Field label="Minimum €/jour"><input className="inp" type="number" value={cfg.mini} placeholder="150" min="0" onChange={e => set("mini", e.target.value)} /></Field>
          <Field label="TVA %"><input className="inp" type="number" value={cfg.tvap} min="0" max="30" onChange={e => set("tvap", e.target.value)} /></Field>
        </div>
      </div>

      <div className="card">
        <div className="card-title">⏸️ Pause déjeuner</div>
        <div className="g2">
          <Field label="Durée de la pause (minutes)">
            <input className="inp" type="number" value={cfg.pause} min="0" max="120" step="5"
              onChange={e => set("pause", e.target.value)} />
          </Field>
          <div style={{ display: "flex", alignItems: "flex-end", paddingBottom: "2px" }}>
            <p style={{ fontSize: "12px", color: "#888", lineHeight: "1.5" }}>
              Par défaut : <strong>30 min</strong>.<br />
              Modifiez si la pause varie (0 = pas de pause).
            </p>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-title">📅 Facturation</div>
        <div className="g2">
          <Field label="Mois concerné"><input className="inp" type="month" value={cfg.mois} onChange={e => set("mois", e.target.value)} /></Field>
          <Field label="N° de facture"><input className="inp" type="text" value={cfg.fnum} placeholder="2025-001" onChange={e => set("fnum", e.target.value)} /></Field>
        </div>
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
