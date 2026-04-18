import { fmMin, fmDate, moisLabel } from "../App";

export default function Journal({ days, cfg, onDelete, onClear, onFacture, onEdit }) {
  const totalNet  = days.reduce((s, d) => s + d.net,  0);
  const totalHTVA = days.reduce((s, d) => s + d.htva, 0);

  return (
    <div>
      <div className="stats-grid">
        <Stat value={days.length}                                    label="Jours prestés" />
        <Stat value={fmMin(totalNet)}                                label="Heures facturables" />
        <Stat value={totalHTVA.toFixed(2).replace(".", ",") + " €"} label="Total HTVA" />
      </div>

      <div className="card">
        <div className="card-title">
          📋 Prestations du mois
          {cfg.mois && <span className="badge">{moisLabel(cfg.mois)}</span>}
        </div>

        {!days.length ? (
          <div className="empty">🌾 Aucune prestation enregistrée.<br />Commencez par saisir une journée.</div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Date</th><th>Départ</th><th>Fin</th><th>H. nettes</th>
                  <th>Lieu</th><th>Travaux</th><th>HTVA</th><th></th>
                </tr>
              </thead>
              <tbody>
                {days.map(d => (
                  <tr key={d.id}>
                    <td className="mono">{fmDate(d.date)}</td>
                    <td className="mono">{d.deb}</td>
                    <td className="mono">{d.fin}</td>
                    <td className="mono bold">{fmMin(d.net)}</td>
                    <td>{d.lieu}</td>
                    <td>{d.trav || "—"}</td>
                    <td className="mono bold">{d.htva.toFixed(2)} €</td>
                    <td>
                      <div style={{ display: "flex", gap: "4px" }}>
                        <button
                          className="btn-icon edit"
                          title="Modifier"
                          onClick={() => onEdit(d)}
                        >✏️</button>
                        <button
                          className="btn-icon delete"
                          title="Supprimer"
                          onClick={() => { if (window.confirm("Supprimer cette journée ?")) onDelete(d.id); }}
                        >✕</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="acts">
        <button className="btn wheat" onClick={onFacture}>🧾 Voir la facture</button>
        {days.length > 0 && (
          <button className="btn danger small" onClick={() => { if (window.confirm("Effacer TOUTES les journées ?")) onClear(); }}>
            🗑️ Tout effacer
          </button>
        )}
      </div>
    </div>
  );
}

function Stat({ value, label }) {
  return (
    <div className="stat-card">
      <div className="stat-value">{value}</div>
      <div className="stat-label">{label}</div>
    </div>
  );
}
