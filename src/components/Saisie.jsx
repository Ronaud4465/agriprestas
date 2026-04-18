import { useState } from "react";
import { toMin, fmMin, todayStr } from "../App";

const PAUSE_KEY = "agriprestas_pause";

function loadPause() {
  try { return parseInt(localStorage.getItem(PAUSE_KEY) || "30"); }
  catch { return 30; }
}

export default function Saisie({ cfg, onAdd, showToast }) {
  const [form, setForm] = useState({
    date: todayStr(), deb: "", fin: "", lieu: "", trav: "", note: ""
  });
  const [pause, setPause] = useState(loadPause);

  const taux = parseFloat(cfg.taux) || 0;
  const mini = parseFloat(cfg.mini) || 0;

  function handlePauseChange(val) {
    const p = Math.max(0, parseInt(val) || 0);
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

  function handleAdd() {
    if (!form.date || !form.deb || !form.fin || !form.lieu.trim()) {
      showToast("⚠️ Date, heures et lieu sont obligatoires");
      return;
    }
    const { brut, net, htva } = calcDay(form.deb, form.fin);
    onAdd({
      id: Date.now(), date: form.date, deb: form.deb, fin: form.fin,
      brut, net, lieu: form.lieu.trim(), trav: form.trav.trim(),
      note: form.note.trim(), taux, mini, pause, htva
    });
    setForm({ date: todayStr(), deb: "", fin: "", lieu: "", trav: "", note: "" });
  }

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div>
      <div className="card">
        <div className="card-title">📅 Journée de travail</div>
        <div className="g3">
          <Field label="Date">
            <input className="inp" type="date" value={form.date}
              onChange={e => set("date", e.target.value)} />
          </Field>
          <Field label="Heure départ">
            <input className="inp" type="time" value={form.deb}
              onChange={e => set("deb", e.target.value)} />
          </Field>
          <Field label="Heure fin">
            <input className="inp" type="time" value={form.fin}
              onChange={e => set("fin", e.target.value)} />
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
            <div className="ro">{prev.net > 0 ? fmMin(prev.net) : "—"}</div>
          </Field>
        </div>
        <div className="res-box">
          <div>
            <div className="res-label">Montant de la journée</div>
            <div className="res-sub">
              {prev.net > 0 && taux > 0
                ? prev.htva === mini && mini > 0
                  ? `Min. journalier appliqué (${(prev.net / 60).toFixed(2)}h × ${taux}€)`
                  : `${(prev.net / 60).toFixed(2)}h × ${taux} €/h`
                : "Renseignez les heures et le tarif"}
            </div>
          </div>
          <div className="res-value">
            {prev.htva > 0 ? prev.htva.toFixed(2) + " € HTVA" : "— €"}
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-title">📍 Chantier</div>
        <div className="g2">
          <Field label="Lieu / Exploitation">
            <input className="inp" type="text" value={form.lieu}
              placeholder="Ferme Dupont – La Chapelle"
              onChange={e => set("lieu", e.target.value)} />
          </Field>
          <Field label="Nature des travaux">
            <input className="inp" type="text" value={form.trav}
              placeholder="Labour, fauchage, semis…"
              onChange={e => set("trav", e.target.value)} />
          </Field>
        </div>
        <div style={{ marginTop: "10px" }}>
          <Field label="Remarques">
            <input className="inp" type="text" value={form.note}
              placeholder="Météo, incident, matériel…"
              onChange={e => set("note", e.target.value)} />
          </Field>
        </div>
      </div>

      <div className="card">
        <div className="card-title">💶 Tarification</div>
        <div className="g3">
          <Field label="€ / heure">
            <div className="ro">{cfg.taux || "—"} €/h</div>
          </Field>
          <Field label="Minimum €/jour">
            <div className="ro">{cfg.mini || "—"} €</div>
          </Field>
          <Field label="TVA %">
            <div className="ro">{cfg.tvap || "21"} %</div>
          </Field>
        </div>
        <p style={{ fontSize: "11px", color: "#9a8878", marginTop: "8px" }}>
          👉 Modifiez ces valeurs dans l'onglet ⚙️ Config
        </p>
      </div>

      <div className="acts">
        <button className="btn primary" onClick={handleAdd}>
          ✅ Ajouter cette journée
        </button>
        <button className="btn" onClick={() =>
          setForm({ date: todayStr(), deb: "", fin: "", lieu: "", trav: "", note: "" })
        }>
          Effacer
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
