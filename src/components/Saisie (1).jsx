import { useState, useEffect } from "react";
import { toMin, fmMin, todayStr } from "../App";

const PAUSE_KEY = "agriprestas_pause";

function loadPause() {
  try {
    const v = localStorage.getItem(PAUSE_KEY);
    if (v === null) return 30;
    return parseInt(v);
  } catch { return 30; }
}

export default function Saisie({ cfg, clients, onAdd, onUpdate, editDay, copyDay, clearEdit, showToast }) {
  const [form, setForm] = useState({
    date: todayStr(), deb: "", fin: "", lieu: "", trav: "", note: "", clientId: ""
  });
  const [pause, setPause] = useState(loadPause);

  const taux = parseFloat(cfg.taux) || 0;
  const mini = parseFloat(cfg.mini) || 0;

  useEffect(() => {
    const src = editDay || copyDay;
    if (src) {
      setForm({
        date:     copyDay ? todayStr() : src.date,
        deb:      src.deb,
        fin:      src.fin,
        lieu:     src.lieu,
        trav:     src.trav || "",
        note:     src.note || "",
        clientId: src.clientId || ""
      });
      setPause(src.pause !== undefined ? src.pause : 30);
    }
  }, [editDay, copyDay]);

  function handlePauseChange(val) {
    const p = val === "" ? 0 : Math.max(0, parseInt(val) || 0);
    setPause(p);
    try { localStorage.setItem(PAUSE_KEY, String(p)); } catch {}
  }

  function calcDay(deb, fin) {
    if (!deb || !fin) return { brut: 0, net: 0, htva: 0 };
    let brut = toMin(fin) - toMin(deb);
    if (brut <= 0) brut += 1440;
    const net = Math.max(0, brut - pause);
    const htva = taux > 0 ? Math.max(mini, (net / 60) * taux) : 0;
    return { brut, net, htva };
  }

  const prev = calcDay(form.deb, form.fin);

  function handleSubmit() {
    if (!form.date || !form.deb || !form.fin || !form.lieu.trim()) {
      showToast("⚠️ Date, heures et lieu sont obligatoires");
      return;
    }
    const { brut, net, htva } = calcDay(form.deb, form.fin);
    const jour = {
      date: form.date, deb: form.deb, fin: form.fin,
      brut, net, lieu: form.lieu.trim(), trav: form.trav.trim(),
      note: form.note.trim(), clientId: form.clientId,
      taux, mini, pause, htva
    };

    if (editDay) {
      onUpdate({ ...jour, id: editDay.id });
      clearEdit();
      showToast("✅ Journée modifiée !");
    } else {
      onAdd({ ...jour, id: Date.now() });
    }
    resetForm();
  }

  function resetForm() {
    setForm({ date: todayStr(), deb: "", fin: "", lieu: "", trav: "", note: "", clientId: "" });
  }

  function handleCancel() {
    clearEdit();
    resetForm();
  }

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const isEdit = !!editDay;
  const isCopy = !!copyDay;

  return (
    <div>
      {(isEdit || isCopy) && (
        <div style={{
          background: isEdit ? "#fff3cd" : "#e8f4fd",
          border: `1.5px solid ${isEdit ? "#c8a84b" : "#3498db"}`,
          borderRadius: "12px", padding: "12px 16px", marginBottom: "12px",
          display: "flex", alignItems: "center", justifyContent: "space-between"
        }}>
          <span style={{ fontSize: "13px", fontWeight: "600", color: isEdit ? "#7a5c3a" : "#2980b9" }}>
            {isEdit ? `✏️ Modification — journée du ${form.date}` : `📋 Copie — modifiez et validez`}
          </span>
          <button className="btn danger small" onClick={handleCancel}>Annuler</button>
        </div>
      )}

      <div className="card">
        <div className="card-title">📅 Journée de travail</div>
        <div className="g3">
          <Field label="Date">
            <input className="inp" type="date" value={form.date} onChange={e => set("date", e.target.value)} />
          </Field>
          <Field label="Heure départ">
            <input className="inp" type="time" value={form.deb} onChange={e => set("deb", e.target.value)} />
          </Field>
          <Field label="Heure fin">
            <input className="inp" type="time" value={form.fin} onChange={e => set("fin", e.target.value)} />
          </Field>
        </div>
      </div>

      <div className="card">
        <div className="card-title">⏱️ Calcul automatique</div>
        <div className="g3">
          <Field label="Heures brutes">
            <div className="ro">{prev.brut > 0 ? fmMin(prev.brut) : "—"}</div>
          </Field>
          <Field label="⏸️ Pause midi (min)">
            <input
              className="inp"
              type="number"
              value={pause}
              min="0"
              max="120"
              step="5"
              onChange={e => handlePauseChange(e.target.value)}
              style={{ background: "#fff3cd", borderColor: "#c8a84b", fontWeight: "600" }}
            />
          </Field>
          <Field label="H. facturables">
            <div className="ro">{prev.net > 0 ? fmMin(prev.net) : fmMin(0)}</div>
          </Field>
        </div>
        <div className="res-box">
          <div>
            <div className="res-label">Montant de la journée</div>
            <div className="res-sub">
              {prev.brut > 0 && taux > 0
                ? prev.htva === mini && mini > 0
                  ? `Min. journalier (${(prev.net/60).toFixed(2)}h × ${taux}€)`
                  : `${(prev.net/60).toFixed(2)}h × ${taux} €/h`
                : "Renseignez les heures et le tarif"}
            </div>
          </div>
          <div className="res-value">{prev.htva > 0 ? prev.htva.toFixed(2)+" € HTVA" : "— €"}</div>
        </div>
      </div>

      <div className="card">
        <div className="card-title">👤 Client</div>
        {clients && clients.length > 0 ? (
          <Field label="Sélectionner un client">
            <select className="inp" value={form.clientId} onChange={e => set("clientId", e.target.value)}>
              <option value="">— Choisir un client —</option>
              {clients.map(c => (
                <option key={c.id} value={c.id}>{c.nom}{c.localite ? ` – ${c.localite}` : ""}</option>
              ))}
            </select>
          </Field>
        ) : (
          <p style={{ fontSize: "12px", color: "#9a8878" }}>
            👉 Ajoutez vos clients dans l'onglet ⚙️ Config
          </p>
        )}
      </div>

      <div className="card">
        <div className="card-title">📍 Chantier</div>
        <div className="g2">
          <Field label="Lieu / Exploitation">
            <input className="inp" type="text" value={form.lieu} placeholder="Ferme Dupont – La Chapelle"
              onChange={e => set("lieu", e.target.value)} />
          </Field>
          <Field label="Nature des travaux">
            <input className="inp" type="text" value={form.trav} placeholder="Labour, fauchage, semis…"
              onChange={e => set("trav", e.target.value)} />
          </Field>
        </div>
        <div style={{ marginTop: "10px" }}>
          <Field label="Remarques">
            <input className="inp" type="text" value={form.note} placeholder="Météo, incident, matériel…"
              onChange={e => set("note", e.target.value)} />
          </Field>
        </div>
      </div>

      <div className="card">
        <div className="card-title">💶 Tarification</div>
        <div className="g3">
          <Field label="€ / heure"><div className="ro">{cfg.taux||"—"} €/h</div></Field>
          <Field label="Minimum €/jour"><div className="ro">{cfg.mini||"—"} €</div></Field>
          <Field label="TVA %"><div className="ro">{cfg.tvap||"21"} %</div></Field>
        </div>
        <p style={{ fontSize: "11px", color: "#9a8878", marginTop: "8px" }}>
          👉 Modifiez dans l'onglet ⚙️ Config
        </p>
      </div>

      <div className="acts">
        <button className="btn primary" onClick={handleSubmit}>
          {isEdit ? "💾 Enregistrer la modification" : "✅ Ajouter cette journée"}
        </button>
        <button className="btn" onClick={isEdit || isCopy ? handleCancel : resetForm}>
          {isEdit || isCopy ? "Annuler" : "Effacer"}
        </button>
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
