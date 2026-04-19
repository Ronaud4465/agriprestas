import { useState } from "react";
import { fmMin, fmDate, moisLabel } from "../App";

function getMonths(days) {
  const months = {};
  days.forEach(d => {
    const m = d.date.substring(0, 7);
    if (!months[m]) months[m] = true;
  });
  return Object.keys(months).sort();
}

export default function Journal({ days, cfg, onDelete, onClear, onFacture, onEdit }) {
  const [filterMois, setFilterMois] = useState("tout");

  const months = getMonths(days);

  const filteredDays = filterMois === "tout"
    ? days
    : days.filter(d => d.date.startsWith(filterMois));

  const totalNet  = filteredDays.reduce((s, d) => s + d.net,  0);
  const totalHTVA = filteredDays.reduce((s, d) => s + d.htva, 0);

  function handlePrint() {
    window.print();
  }

  return (
    <div>
      {/* STATS */}
      <div className="stats-grid">
        <Stat value={filteredDays.length}                                    label="Jours prestés" />
        <Stat value={fmMin(totalNet)}                                        label="Heures facturables" />
        <Stat value={totalHTVA.toFixed(2).replace(".", ",") + " €"}         label="Total HTVA" />
      </div>

      <div className="card">
        <div className="card-title">📋 Journal des prestations</div>

        {/* FILTRE MOIS */}
        {months.length > 1 && (
          <div className="month-filter no-print">
            <button
              className={`month-btn ${filterMois === "tout" ? "on" : ""}`}
              onClick={() => setFilterMois("tout")}
            >Tout</button>
            {months.map(m => (
              <button
                key={m}
                className={`month-btn ${filterMois === m ? "on" : ""}`}
                onClick={() => setFilterMois(m)}
              >{moisLabel(m)}</button>
            ))}
          </div>
        )}

        {/* TITRE IMPRESSION */}
        <div className="print-only journal-print-title">
          Journal des prestations — {filterMois === "tout" ? "Tous les mois" : moisLabel(filterMois)}
          {cfg.nom && <span style={{ float: "right" }}>{cfg.nom}</span>}
        </div>

        {!filteredDays.length ? (
          <div className="empty">🌾 Aucune prestation pour cette période.</div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Départ</th>
                  <th>Fin</th>
                  <th>Pause</th>
                  <th>H. nettes</th>
                  <th>Lieu</th>
                  <th>Travaux</th>
                  <th>HTVA</th>
                  <th className="no-print"></th>
                </tr>
              </thead>
              <tbody>
                {filteredDays.map(d => (
                  <>
                    <tr key={d.id}>
                      <td className="mono">{fmDate(d.date)}</td>
                      <td className="mono">{d.deb}</td>
                      <td className="mono">{d.fin}</td>
                      <td className="mono">{d.pause || 30} min</td>
                      <td className="mono bold">{fmMin(d.net)}</td>
                      <td>{d.lieu}</td>
                      <td>{d.trav || "—"}</td>
                      <td className="mono bold">{d.htva.toFixed(2)} €</td>
                      <td className="no-print">
                        <div style={{ display: "flex", gap: "4px" }}>
                          <button className="btn-icon edit" title="Modifier" onClick={() => onEdit(d)}>✏️</button>
                          <button className="btn-icon delete" title="Supprimer"
                            onClick={() => { if (window.confirm("Supprimer cette journée ?")) onDelete(d.id); }}>✕</button>
                        </div>
                      </td>
                    </tr>
                    {/* REMARQUE sous la ligne si elle existe */}
                    {d.note && (
                      <tr key={`note-${d.id}`} className="note-row">
                        <td colSpan={9} className="note-cell">
                          📝 <em>{d.note}</em>
                        </td>
                      </tr>
                    )}
                  </>
                ))}
              </tbody>
              {/* TOTAL en bas */}
              <tfoot>
                <tr className="total-row">
                  <td colSpan={4}><strong>TOTAUX</strong></td>
                  <td className="mono"><strong>{fmMin(totalNet)}</strong></td>
                  <td colSpan={2}></td>
                  <td className="mono"><strong>{totalHTVA.toFixed(2)} €</strong></td>
                  <td className="no-print"></td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>

      <div className="acts no-print">
        <button className="btn wheat" onClick={onFacture}>🧾 Voir la facture</button>
        <button className="btn primary" onClick={handlePrint}>🖨️ Imprimer le journal</button>
        {days.length > 0 && (
          <button className="btn danger small"
            onClick={() => { if (window.confirm("Effacer TOUTES les journées ?")) onClear(); }}>
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
